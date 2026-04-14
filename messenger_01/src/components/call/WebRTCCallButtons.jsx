import React from "react";
import { Phone, Video } from "lucide-react";
import { useWebRTCCall } from "../../context/useWebRTCCall";
import { CallState } from "../../webrtc/callStateMachine";

export default function WebRTCCallButtons({ peerUserId, peerName, disabled }) {
  const { state, startOutgoingCall } = useWebRTCCall();
  const busy = state !== CallState.IDLE;
  const isDisabled = disabled || busy || !peerUserId;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => startOutgoingCall({ toUserId: peerUserId, type: "voice", peerName })}
        className="p-2 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Voice call"
      >
        <Phone size={18} />
      </button>
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => startOutgoingCall({ toUserId: peerUserId, type: "video", peerName })}
        className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Video call"
      >
        <Video size={18} />
      </button>
    </div>
  );
}
