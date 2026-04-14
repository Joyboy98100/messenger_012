import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff } from "lucide-react";

export default function IncomingCallScreen({ peerName, callType, onAccept, onDecline }) {
  const ringAudioRef = useRef(null);

  useEffect(() => {
    const el = ringAudioRef.current;
    if (!el) return undefined;
    el.volume = 0.6;
    el.play().catch(() => {});
    return () => {
      el.pause();
      el.currentTime = 0;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm text-white flex items-center justify-center">
      <audio
        ref={ringAudioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2562-ring-tone-1.mp3"
        loop
        preload="auto"
      />
      <div className="w-full max-w-sm mx-4 rounded-2xl bg-neutral-900 border border-white/10 p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-white/10 mx-auto flex items-center justify-center text-3xl font-bold mb-4">
          {(peerName || "U").charAt(0).toUpperCase()}
        </div>
        <h2 className="text-2xl font-semibold">{peerName || "Unknown user"}</h2>
        <p className="text-sm text-white/70 mt-1">Incoming {callType === "video" ? "Video" : "Voice"} Call</p>
        <div className="mt-8 flex items-center justify-center gap-6">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-full bg-red-500 hover:bg-red-600 p-4"
            title="Decline"
          >
            <PhoneOff size={22} />
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-green-500 hover:bg-green-600 p-4"
            title="Accept"
          >
            <Phone size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
