import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, RefreshCw, Video, VideoOff } from "lucide-react";

export default function ActiveVideoCall({
  peerName,
  remoteVideoEnabled,
  onAttachMedia,
  isMuted,
  isCameraOff,
  onToggleMute,
  onToggleCamera,
  onSwitchCamera,
  onEnd,
}) {
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pipRef = useRef(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pipPos, setPipPos] = useState({ x: 16, y: 16 });
  const dragRef = useRef({ dragging: false, ox: 0, oy: 0 });

  useEffect(() => {
    onAttachMedia({
      localVideo: localVideoRef.current,
      remoteVideo: remoteVideoRef.current,
      remoteAudio: remoteAudioRef.current,
    });
  }, [onAttachMedia]);

  useEffect(() => {
    const timer = setTimeout(() => setControlsVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [controlsVisible]);

  const showControls = () => setControlsVisible(true);

  const onPointerDown = (e) => {
    if (!pipRef.current) return;
    const rect = pipRef.current.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
    };
    pipRef.current.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    setPipPos({
      x: Math.max(8, e.clientX - dragRef.current.ox),
      y: Math.max(8, e.clientY - dragRef.current.oy),
    });
  };

  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  return (
    <div className="fixed inset-0 z-[140] bg-black text-white" onMouseMove={showControls} onClick={showControls}>
      <audio ref={remoteAudioRef} className="hidden" />
      {remoteVideoEnabled ? (
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {(peerName || "U").charAt(0).toUpperCase()}
          </div>
          <p className="mt-3 text-white/80">Camera is off</p>
        </div>
      )}

      <div
        ref={pipRef}
        className="absolute w-40 h-28 rounded-xl overflow-hidden border border-white/30 bg-black cursor-move"
        style={{ left: `${pipPos.x}px`, top: `${pipPos.y}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>

      {controlsVisible && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/65 rounded-full px-4 py-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCamera}
            className={`rounded-full p-3 ${isCameraOff ? "bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
          >
            {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            className={`rounded-full p-3 ${isMuted ? "bg-red-600" : "bg-white/20 hover:bg-white/30"}`}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <button type="button" onClick={onSwitchCamera} className="rounded-full p-3 bg-white/20 hover:bg-white/30">
            <RefreshCw size={18} />
          </button>
          <button type="button" onClick={onEnd} className="rounded-full p-3 bg-red-500 hover:bg-red-600">
            <PhoneOff size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
