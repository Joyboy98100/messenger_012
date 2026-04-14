import React, { useEffect } from "react";
import { useWebRTCCall } from "../../context/useWebRTCCall";
import { CallState } from "../../webrtc/callStateMachine";
import OutgoingCallScreen from "./screens/OutgoingCallScreen";
import IncomingCallScreen from "./screens/IncomingCallScreen";
import ActiveVoiceCall from "./screens/ActiveVoiceCall";
import ActiveVideoCall from "./screens/ActiveVideoCall";
import { useToastContext } from "../../context/ToastContext";

export default function WebRTCCallLayer() {
  const toast = useToastContext();
  const {
    state,
    context,
    callQuality,
    remoteVideoEnabled,
    isMuted,
    isCameraOff,
    isSpeakerOn,
    attachMediaElements,
    cancelOutgoingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    endCall,
    lastError,
    clearLastError,
  } = useWebRTCCall();

  useEffect(() => {
    if (context.reason === "busy") toast.info("User is busy");
    if (context.reason === "network_failure") toast.error("Call ended due to network issue");
  }, [context.reason, toast]);

  useEffect(() => {
    if (!lastError) return;
    toast.error(lastError);
    clearLastError();
  }, [lastError, toast, clearLastError]);

  return (
    <>
      {state === CallState.CALLING && (
        <OutgoingCallScreen
          peerName={context.peerName}
          callType={context.type}
          onCancel={cancelOutgoingCall}
        />
      )}
      {state === CallState.RINGING && context.role === "callee" && (
        <IncomingCallScreen
          peerName={context.peerName}
          callType={context.type}
          onAccept={acceptIncomingCall}
          onDecline={rejectIncomingCall}
        />
      )}
      {state === CallState.CONNECTED && context.type === "voice" && (
        <ActiveVoiceCall
          peerName={context.peerName}
          quality={callQuality}
          isMuted={isMuted}
          isSpeakerOn={isSpeakerOn}
          onToggleMute={toggleMute}
          onToggleSpeaker={toggleSpeaker}
          onEnd={() => endCall("hangup")}
        />
      )}
      {state === CallState.CONNECTED && context.type === "video" && (
        <ActiveVideoCall
          peerName={context.peerName}
          remoteVideoEnabled={remoteVideoEnabled}
          onAttachMedia={attachMediaElements}
          isMuted={isMuted}
          isCameraOff={isCameraOff}
          onToggleMute={toggleMute}
          onToggleCamera={toggleCamera}
          onSwitchCamera={switchCamera}
          onEnd={() => endCall("hangup")}
        />
      )}
    </>
  );
}
