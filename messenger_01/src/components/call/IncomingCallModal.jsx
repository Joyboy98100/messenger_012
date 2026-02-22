import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "../../context/CallContext";
import Avatar from "../common/Avatar";

export default function IncomingCallModal() {
  const { incomingCaller, acceptCall, rejectCall, callState } = useCall();
  const audioRef = useRef(null);

  const isIncoming = callState === "incoming" && incomingCaller;

  useEffect(() => {
    if (!isIncoming || !audioRef.current) return;
    const audio = audioRef.current;
    audio.volume = 0.5;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isIncoming]);

  if (!isIncoming) return null;

  const name = incomingCaller.callerName || "Someone";
  const isVideo = incomingCaller.callType === "video";

  return (
    <>
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2562-ring-tone-1.mp3"
        loop
        preload="auto"
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 border border-gray-200 dark:border-slate-700">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
            {isVideo ? "Video" : "Audio"} call from
          </p>
          <div className="flex justify-center mb-6">
            <Avatar name={name} size="lg" />
          </div>
          <h3 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-8">
            {name}
          </h3>
          <div className="flex justify-center gap-6">
            <button
              type="button"
              onClick={rejectCall}
              className="flex flex-col items-center gap-2 p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <PhoneOff size={28} />
              <span className="text-xs font-medium">Reject</span>
            </button>
            <button
              type="button"
              onClick={acceptCall}
              className="flex flex-col items-center gap-2 p-4 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
            >
              <Phone size={28} />
              <span className="text-xs font-medium">Accept</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
