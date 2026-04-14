import React, { useEffect, useMemo, useRef, useState } from "react";
import socket from "../socket";
import { CallManager } from "../webrtc/callManager";
import { CallState } from "../webrtc/callStateMachine";
import { WebRTCCallContext } from "./WebRTCCallContextValue";
import { NotificationManager } from "../webrtc/notificationManager";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function WebRTCCallProvider({ children }) {
  const managerRef = useRef(null);
  const [fsmState, setFsmState] = useState(CallState.IDLE);
  const [fsmContext, setFsmContext] = useState({
    callId: null,
    role: null,
    type: null,
    peerUserId: null,
    peerName: null,
    reason: "",
  });
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setMuted] = useState(false);
  const [isCameraOff, setCameraOff] = useState(false);
  const [isSpeakerOn, setSpeakerOn] = useState(true);
  const [callQuality, setCallQuality] = useState("good");
  const [remoteVideoEnabled, setRemoteVideoEnabled] = useState(true);
  const [missedCalls, setMissedCalls] = useState([]);
  const notificationRef = useRef(null);

  useEffect(() => {
    const user = getCurrentUser();
    const userId = user?.id || user?._id;
    if (!userId) return undefined;

    const notificationManager = new NotificationManager({
      onInAppMissedCall: (payload) => {
        setMissedCalls((prev) => [payload, ...prev].slice(0, 20));
      },
    });
    notificationManager.bindPermissionPromptAfterInteraction();
    notificationRef.current = notificationManager;

    const manager = new CallManager({
      socket,
      currentUserId: userId,
      onStateChange: ({ next, context }) => {
        setFsmState(next);
        setFsmContext(context);
      },
      onStreamsChange: (local, remote) => {
        setLocalStream(local);
        setRemoteStream(remote);
      },
      onQualityChange: ({ quality, remoteVideoEnabled: remoteVideoLive }) => {
        setCallQuality(quality);
        setRemoteVideoEnabled(remoteVideoLive);
      },
      onMissedCall: (payload) => {
        notificationManager.notifyMissedCall(payload);
      },
      onBusy: () => {
        setFsmContext((prev) => ({ ...prev, reason: "busy" }));
      },
    });

    managerRef.current = manager;
    return () => manager.destroy();
  }, []);

  const api = useMemo(() => {
    const manager = managerRef.current;
    return {
      state: fsmState,
      context: fsmContext,
      localStream,
      remoteStream,
      isMuted,
      isCameraOff,
      isSpeakerOn,
      callQuality,
      remoteVideoEnabled,
      missedCalls,
      attachMediaElements: (elements) => manager?.attachElements(elements),
      startOutgoingCall: (data) => manager?.startOutgoingCall(data),
      cancelOutgoingCall: () => manager?.cancelOutgoingCall(),
      acceptIncomingCall: () => manager?.acceptIncomingCall(),
      rejectIncomingCall: () => manager?.rejectIncomingCall(),
      endCall: (reason) => manager?.endCall(reason),
      toggleMute: () => {
        const muted = manager?.toggleMute() || false;
        setMuted(muted);
      },
      toggleCamera: () => {
        const cameraOff = manager?.toggleCamera() || false;
        setCameraOff(cameraOff);
      },
      switchCamera: async () => manager?.switchCameraFacingMode(),
      toggleSpeaker: () => {
        // Mobile browsers have limited speaker routing APIs; this is UI state.
        setSpeakerOn((prev) => !prev);
      },
      consumeMissedCall: (id) => {
        setMissedCalls((prev) => prev.filter((x) => x.id !== id));
      },
      dismissTerminalState: () => {
        if (!manager) return;
        if ([CallState.ENDED, CallState.MISSED, CallState.REJECTED, CallState.FAILED].includes(manager.fsm.state)) {
          manager.fsm.reset();
          setMuted(false);
          setCameraOff(false);
          setSpeakerOn(true);
        }
      },
    };
  }, [
    fsmState,
    fsmContext,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    isSpeakerOn,
    callQuality,
    remoteVideoEnabled,
    missedCalls,
  ]);

  return <WebRTCCallContext.Provider value={api}>{children}</WebRTCCallContext.Provider>;
}
