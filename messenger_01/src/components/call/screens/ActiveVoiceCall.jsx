import React, { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ActiveVoiceCall({
  peerName,
  quality,
  isMuted,
  isSpeakerOn,
  onToggleMute,
  onToggleSpeaker,
  onEnd,
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((x) => x + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const qualityColor = useMemo(() => {
    if (quality === "good") return "text-emerald-400";
    if (quality === "poor") return "text-amber-400";
    return "text-red-400";
  }, [quality]);

  return (
    <div className="fixed inset-0 z-[140] bg-neutral-950 text-white flex flex-col items-center justify-center">
      <div className="w-28 h-28 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold mb-4">
        {(peerName || "U").charAt(0).toUpperCase()}
      </div>
      <h2 className="text-2xl font-semibold">{peerName || "Unknown user"}</h2>
      <p className="text-sm text-white/70 mt-1">Voice Call</p>
      <p className="text-lg font-mono mt-2">{formatDuration(elapsed)}</p>
      <p className={`text-xs mt-2 ${qualityColor}`}>Quality: {quality}</p>

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMute}
          className={`rounded-full p-4 ${isMuted ? "bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button
          type="button"
          onClick={onToggleSpeaker}
          className={`rounded-full p-4 ${isSpeakerOn ? "bg-emerald-600" : "bg-white/20 hover:bg-white/30"}`}
        >
          {isSpeakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        <button type="button" onClick={onEnd} className="rounded-full p-4 bg-red-500 hover:bg-red-600">
          <PhoneOff size={20} />
        </button>
      </div>
    </div>
  );
}
