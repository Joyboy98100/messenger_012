"use strict";

import { CallState, CallStateMachine } from "./callStateMachine";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    {
      urls: [
        "turn:turn.yourdomain.com:3478?transport=udp",
        "turn:turn.yourdomain.com:3478?transport=tcp",
      ],
      username: "turn-user",
      credential: "turn-password",
    },
  ],
  iceCandidatePoolSize: 10,
};

export class CallManager {
  constructor({
    socket,
    currentUserId,
    onStateChange,
    onStreamsChange,
    onQualityChange,
    onMissedCall,
    onBusy,
    beaconEndpoint,
  }) {
    this.socket = socket;
    this.currentUserId = String(currentUserId);
    this.onStreamsChange = onStreamsChange || (() => {});
    this.onQualityChange = onQualityChange || (() => {});
    this.onMissedCall = onMissedCall || (() => {});
    this.onBusy = onBusy || (() => {});
    this.beaconEndpoint = beaconEndpoint || "/api/calls/beacon-ended";
    this.localStream = null;
    this.remoteStream = null;
    this.pc = null;
    this.callId = null;
    this.pendingCandidates = [];
    this.iceDisconnectTimer = null;
    this.remoteVideoEnabled = true;
    this.lastQuality = "good";
    this.boundEls = {
      localVideo: null,
      remoteVideo: null,
      remoteAudio: null,
    };

    this.fsm = new CallStateMachine(onStateChange);
    this.bindSocket();
    this.bindUnload();
  }

  bindSocket() {
    this.socket.on("call:initiate", this.onIncomingCall);
    this.socket.on("call:ringing", this.onRinging);
    this.socket.on("call:accepted", this.onAccepted);
    this.socket.on("call:rejected", this.onRejected);
    this.socket.on("call:missed", this.onMissed);
    this.socket.on("call:offer", this.onOffer);
    this.socket.on("call:answer", this.onAnswer);
    this.socket.on("call:ice-candidate", this.onIceCandidate);
    this.socket.on("call:ended", this.onEnded);
    this.socket.on("call:busy", this.onBusyEvent);
    this.socket.on("call:cancelled", this.onCancelled);
  }

  destroy() {
    this.socket.off("call:initiate", this.onIncomingCall);
    this.socket.off("call:ringing", this.onRinging);
    this.socket.off("call:accepted", this.onAccepted);
    this.socket.off("call:rejected", this.onRejected);
    this.socket.off("call:missed", this.onMissed);
    this.socket.off("call:offer", this.onOffer);
    this.socket.off("call:answer", this.onAnswer);
    this.socket.off("call:ice-candidate", this.onIceCandidate);
    this.socket.off("call:ended", this.onEnded);
    this.socket.off("call:busy", this.onBusyEvent);
    this.socket.off("call:cancelled", this.onCancelled);
    this.cleanupMedia();
  }

  bindUnload() {
    window.addEventListener("beforeunload", () => {
      if (
        this.fsm.state === CallState.CALLING ||
        this.fsm.state === CallState.RINGING ||
        this.fsm.state === CallState.CONNECTED
      ) {
        const payload = {
          callId: this.callId,
          fromUserId: this.currentUserId,
          reason: "page_unload",
          at: Date.now(),
        };
        // websocket best effort
        this.socket.emit("call:ended", payload);
        // guaranteed unload path
        navigator.sendBeacon(this.beaconEndpoint, JSON.stringify(payload));
      }
    });
  }

  attachElements({ localVideo, remoteVideo, remoteAudio }) {
    this.boundEls = { localVideo, remoteVideo, remoteAudio };
    this.applyStreamsToElements();
  }

  applyStreamsToElements() {
    const { localVideo, remoteVideo, remoteAudio } = this.boundEls;
    if (localVideo) {
      localVideo.srcObject = this.localStream || null;
      localVideo.autoplay = true;
      localVideo.playsInline = true;
      localVideo.muted = true;
    }
    if (remoteVideo) {
      remoteVideo.srcObject = this.remoteStream || null;
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
    }
    if (remoteAudio) {
      remoteAudio.srcObject = this.remoteStream || null;
      remoteAudio.autoplay = true;
      remoteAudio.playsInline = true;
    }
  }

  async startOutgoingCall({ toUserId, type, peerName }) {
    if (this.fsm.state !== CallState.IDLE) return;

    const callType = type === "video" ? "video" : "voice";
    this.fsm.transition(
      CallState.CALLING,
      { role: "caller", type: callType, peerUserId: String(toUserId), peerName },
      "start_outgoing"
    );

    const ack = await this.emitWithAck("call:initiate", {
      toUserId,
      fromUserId: this.currentUserId,
      type: callType,
    });
    if (!ack?.ok) {
      if (ack?.error === "busy") {
        this.onBusy({ toUserId: String(toUserId) });
        this.fsm.reset();
      } else {
        this.fsm.safeTransition(CallState.FAILED, {}, ack?.error || "call:initiate failed");
      }
      return;
    }

    this.callId = ack.callId;
    this.fsm.context.callId = this.callId;

    await this.ensurePeerConnection();
    await this.startLocalMedia(callType);

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket.emit("call:offer", { callId: this.callId, sdpOffer: this.pc.localDescription });
  }

  cancelOutgoingCall() {
    if (this.fsm.state !== CallState.CALLING) return;
    this.socket.emit("call:cancel", { callId: this.callId });
    this.cleanupMedia();
    this.fsm.reset();
  }

  async acceptIncomingCall() {
    if (this.fsm.state !== CallState.RINGING) return;
    await this.emitWithAck("call:accepted", { callId: this.callId });
  }

  async rejectIncomingCall() {
    if (this.fsm.state !== CallState.RINGING) return;
    await this.emitWithAck("call:rejected", { callId: this.callId, reason: "declined" });
    this.fsm.safeTransition(CallState.REJECTED, {}, "declined");
    this.cleanupMedia();
    this.fsm.reset();
  }

  endCall(reason = "hangup") {
    if (![CallState.CALLING, CallState.RINGING, CallState.CONNECTED].includes(this.fsm.state)) {
      return;
    }
    this.socket.emit("call:ended", { callId: this.callId, reason });
    this.fsm.safeTransition(CallState.ENDED, {}, reason);
    this.cleanupMedia();
  }

  onIncomingCall = async ({ callId, fromUserId, type, fromName }) => {
    if (this.fsm.state !== CallState.IDLE) {
      this.socket.emit("call:rejected", { callId, reason: "busy" });
      return;
    }

    this.callId = callId;
    const callType = type === "video" ? "video" : "voice";
    this.fsm.transition(
      CallState.RINGING,
      {
        callId,
        role: "callee",
        type: callType,
        peerUserId: String(fromUserId),
        peerName: fromName || "Unknown user",
      },
      "incoming_call"
    );
    await this.ensurePeerConnection();
    await this.startLocalMedia(callType);
  };

  onRinging = ({ callId }) => {
    if (this.callId !== callId || this.fsm.state !== CallState.CALLING) return;
    this.fsm.safeTransition(CallState.CALLING, {}, "ringing");
  };

  onAccepted = ({ callId }) => {
    if (this.callId !== callId) return;
  };

  onRejected = ({ callId, reason }) => {
    if (this.callId !== callId) return;
    this.fsm.safeTransition(CallState.REJECTED, {}, reason || "rejected");
    this.cleanupMedia();
  };

  onMissed = ({ callId }) => {
    if (this.callId !== callId) return;
    this.onMissedCall({
      callId,
      callerId: this.fsm.context.peerUserId,
      callerName: this.fsm.context.peerName,
      callType: this.fsm.context.type,
      at: Date.now(),
    });
    this.fsm.safeTransition(CallState.MISSED, {}, "missed_timeout");
    this.cleanupMedia();
  };

  onCancelled = ({ callId }) => {
    if (this.callId !== callId) return;
    this.fsm.safeTransition(CallState.ENDED, {}, "caller_cancelled");
    this.cleanupMedia();
    this.fsm.reset();
  };

  onBusyEvent = ({ callId }) => {
    if (this.callId && callId && String(this.callId) !== String(callId)) return;
    this.onBusy({ toUserId: this.fsm.context.peerUserId });
    this.cleanupMedia();
    this.fsm.reset();
  };

  onOffer = async ({ callId, sdpOffer }) => {
    if (this.callId !== callId || !this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdpOffer));
    await this.flushCandidates();
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.socket.emit("call:answer", { callId, sdpAnswer: this.pc.localDescription });
  };

  onAnswer = async ({ callId, sdpAnswer }) => {
    if (this.callId !== callId || !this.pc) return;
    await this.pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
    await this.flushCandidates();
  };

  onIceCandidate = async ({ callId, candidate }) => {
    if (this.callId !== callId || !this.pc || !candidate) return;
    const ice = new RTCIceCandidate(candidate);
    if (!this.pc.remoteDescription) {
      this.pendingCandidates.push(ice);
      return;
    }
    await this.pc.addIceCandidate(ice);
  };

  onEnded = ({ callId, reason }) => {
    if (this.callId !== callId) return;
    this.fsm.safeTransition(CallState.ENDED, {}, reason || "remote_end");
    this.cleanupMedia();
    this.fsm.reset();
  };

  async ensurePeerConnection() {
    if (this.pc) return;
    this.pc = new RTCPeerConnection(RTC_CONFIG);
    this.remoteStream = new MediaStream();
    this.onStreamsChange(this.localStream, this.remoteStream);
    this.applyStreamsToElements();

    this.pc.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream.addTrack(track);
        if (track.kind === "video") {
          this.remoteVideoEnabled = track.enabled;
          track.onmute = () => {
            this.remoteVideoEnabled = false;
            this.onQualityChange({ quality: this.lastQuality, remoteVideoEnabled: false });
          };
          track.onunmute = () => {
            this.remoteVideoEnabled = true;
            this.onQualityChange({ quality: this.lastQuality, remoteVideoEnabled: true });
          };
        }
      });
      this.onStreamsChange(this.localStream, this.remoteStream);
      this.applyStreamsToElements();
    };

    this.pc.onicecandidate = (event) => {
      if (!event.candidate || !this.callId) return;
      this.socket.emit("call:ice-candidate", { callId: this.callId, candidate: event.candidate });
    };

    this.pc.onconnectionstatechange = () => {
      const st = this.pc.connectionState;
      if (st === "connected") {
        this.clearIceDisconnectTimer();
        this.lastQuality = "good";
        this.onQualityChange({ quality: "good", remoteVideoEnabled: this.remoteVideoEnabled });
        this.fsm.safeTransition(CallState.CONNECTED, {}, "pc_connected");
      } else if (st === "disconnected" || st === "failed") {
        this.lastQuality = "poor";
        this.onQualityChange({ quality: "poor", remoteVideoEnabled: this.remoteVideoEnabled });
      }
    };

    this.pc.oniceconnectionstatechange = () => {
      const iceState = this.pc.iceConnectionState;
      if (iceState === "disconnected") {
        this.lastQuality = "poor";
        this.onQualityChange({ quality: "poor", remoteVideoEnabled: this.remoteVideoEnabled });
        this.startIceDisconnectGraceTimer();
      } else if (iceState === "connected" || iceState === "completed") {
        this.clearIceDisconnectTimer();
        this.lastQuality = "good";
        this.onQualityChange({ quality: "good", remoteVideoEnabled: this.remoteVideoEnabled });
      } else if (iceState === "failed") {
        this.handleNetworkFailure();
      }
    };
  }

  async startLocalMedia(type) {
    const constraints =
      type === "video"
        ? { audio: true, video: { width: 1280, height: 720 } }
        : { audio: true, video: false };

    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    this.localStream.getTracks().forEach((track) => this.pc.addTrack(track, this.localStream));
    this.onStreamsChange(this.localStream, this.remoteStream);
    this.applyStreamsToElements();
  }

  async flushCandidates() {
    while (this.pendingCandidates.length > 0) {
      const candidate = this.pendingCandidates.shift();
      await this.pc.addIceCandidate(candidate);
    }
  }

  toggleMute() {
    const track = this.localStream?.getAudioTracks?.()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return !track.enabled;
  }

  toggleCamera() {
    const track = this.localStream?.getVideoTracks?.()[0];
    if (!track) return false;
    track.enabled = !track.enabled;
    return !track.enabled;
  }

  async switchCameraFacingMode() {
    const currentTrack = this.localStream?.getVideoTracks?.()[0];
    if (!currentTrack) return false;
    const settings = currentTrack.getSettings?.() || {};
    const nextFacingMode = settings.facingMode === "environment" ? "user" : "environment";

    const switched = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: nextFacingMode } },
    });
    const nextTrack = switched.getVideoTracks()[0];
    if (!nextTrack) return false;

    const sender = this.pc?.getSenders?.().find((s) => s.track?.kind === "video");
    if (sender) {
      await sender.replaceTrack(nextTrack);
    }

    currentTrack.stop();
    this.localStream.removeTrack(currentTrack);
    this.localStream.addTrack(nextTrack);
    this.onStreamsChange(this.localStream, this.remoteStream);
    this.applyStreamsToElements();
    return true;
  }

  startIceDisconnectGraceTimer() {
    if (this.iceDisconnectTimer) return;
    this.iceDisconnectTimer = setTimeout(() => {
      this.handleNetworkFailure();
    }, 5000);
  }

  clearIceDisconnectTimer() {
    if (!this.iceDisconnectTimer) return;
    clearTimeout(this.iceDisconnectTimer);
    this.iceDisconnectTimer = null;
  }

  handleNetworkFailure() {
    this.clearIceDisconnectTimer();
    if (![CallState.CALLING, CallState.RINGING, CallState.CONNECTED].includes(this.fsm.state)) return;
    this.socket.emit("call:ended", { callId: this.callId, reason: "network_failure" });
    this.fsm.safeTransition(CallState.FAILED, {}, "network_failure");
    this.cleanupMedia();
    this.fsm.reset();
  }

  cleanupMedia() {
    this.clearIceDisconnectTimer();
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((t) => t.stop());
      this.remoteStream = null;
    }
    this.callId = null;
    this.pendingCandidates = [];
    this.remoteVideoEnabled = true;
    this.onStreamsChange(null, null);
    this.applyStreamsToElements();
  }

  emitWithAck(event, payload, timeoutMs = 6000) {
    return new Promise((resolve) => {
      let done = false;
      const timer = setTimeout(() => {
        if (done) return;
        done = true;
        resolve({ ok: false, error: `${event} timeout` });
      }, timeoutMs);
      this.socket.emit(event, payload, (res) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(res);
      });
    });
  }
}
