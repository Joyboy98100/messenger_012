import React from "react";
import { PhoneOff } from "lucide-react";

export default function OutgoingCallScreen({ peerName, callType, onCancel }) {
  return (
    <div className="fixed inset-0 z-[140] bg-neutral-950 text-white flex items-center justify-center">
      <style>{`
        @keyframes ringPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          70% { transform: scale(1.15); opacity: 0.2; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
      <div className="text-center">
        <div className="relative w-28 h-28 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-emerald-500/30" style={{ animation: "ringPulse 1.8s infinite" }} />
          <div className="absolute inset-3 rounded-full bg-emerald-500/40" style={{ animation: "ringPulse 1.8s infinite 0.3s" }} />
          <div className="absolute inset-6 rounded-full bg-emerald-500 flex items-center justify-center text-3xl font-bold">
            {(peerName || "U").charAt(0).toUpperCase()}
          </div>
        </div>
        <h2 className="text-2xl font-semibold">{peerName || "Unknown user"}</h2>
        <p className="text-sm text-white/70 mt-1">{callType === "video" ? "Video Call" : "Voice Call"}</p>
        <p className="text-sm text-white/60 mt-1">Ringing...</p>
        <button
          type="button"
          onClick={onCancel}
          className="mt-8 inline-flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 p-4"
          title="Cancel Call"
        >
          <PhoneOff size={22} />
        </button>
      </div>
    </div>
  );
}
