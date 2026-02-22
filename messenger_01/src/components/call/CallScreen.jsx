import React, { useEffect, useRef, useState } from "react";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { useCall } from "../../context/CallContext";

function formatCallDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function CallScreen() {
  const {
    callState,
    callType,
    remoteUser,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleVideo,
    isMuted,
    isVideoOff,
  } = useCall();

  const [callDuration, setCallDuration] = useState(0);
  const timerIntervalRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  useEffect(() => {
    if (callState === "connected") {
      setCallDuration(0);
      timerIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setCallDuration(0);
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (callType === "audio" && remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const showScreen =
    callState === "calling" ||
    callState === "connected";

  if (!showScreen) return null;

  const name = remoteUser?.name || "User";
  const isVideo = callType === "video";

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col">
      {/* Remote audio: for audio-only calls, video element is not shown so we need this to hear */}
      {callState === "connected" && remoteStream && !isVideo && (
        <audio
          ref={remoteAudioRef}
          autoPlay
          playsInline
          className="hidden"
          aria-hidden
        />
      )}
      {/* Remote stream (large) */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 bg-black">
        {callState === "calling" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
            <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 animate-pulse">
              <span className="text-4xl">📞</span>
            </div>
            <p className="text-xl font-medium">Calling {name}...</p>
            <p className="text-sm text-white/70 mt-1">
              {isVideo ? "Video" : "Audio"} call
            </p>
          </div>
        )}

        {callState === "connected" && (
          <>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-lg text-lg font-mono tabular-nums">
              {formatCallDuration(callDuration)}
            </div>
            {isVideo && remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-white">
                <div className="w-32 h-32 rounded-full bg-purple-600/80 flex items-center justify-center text-5xl mb-4">
                  {name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xl font-medium">{name}</p>
                <p className="text-sm text-white/70">Connected</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Local stream (small, only for video) */}
      {callState === "connected" && isVideo && localStream && (
        <div className="absolute top-4 right-4 w-40 h-32 rounded-xl overflow-hidden border-2 border-white/50 shadow-xl bg-black">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Controls */}
      <div className="p-6 bg-gray-900/95 flex justify-center gap-4">
        {callState === "connected" && (
          <>
            <button
              type="button"
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-white/20 hover:bg-white/30 text-white"
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            {isVideo && (
              <button
                type="button"
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  isVideoOff
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
                title={isVideoOff ? "Turn on camera" : "Turn off camera"}
              >
                {isVideoOff ? (
                  <VideoOff size={24} />
                ) : (
                  <Video size={24} />
                )}
              </button>
            )}
          </>
        )}
        <button
          type="button"
          onClick={endCall}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
}
