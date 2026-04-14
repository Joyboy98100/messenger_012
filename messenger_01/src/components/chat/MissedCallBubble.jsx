import React from "react";
import { PhoneMissed, Phone, Video } from "lucide-react";

export default function MissedCallBubble({ isOwn, callType, time, onCallBack }) {
  const isVideo = callType === "video";
  return (
    <div className={`flex my-1 w-full px-1 sm:px-2 ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[420px] rounded-2xl border border-red-200 bg-red-50 text-red-800 px-3 py-2 shadow-sm dark:bg-red-900/20 dark:border-red-700/50 dark:text-red-200">
        <div className="flex items-center gap-2 text-sm">
          <PhoneMissed size={16} />
          <span>{`Missed ${isVideo ? "video" : "voice"} call`}</span>
          {time ? <span className="text-xs opacity-80">· {time}</span> : null}
        </div>
        <button
          type="button"
          onClick={onCallBack}
          className="mt-2 inline-flex items-center gap-1 text-xs underline hover:no-underline"
        >
          {isVideo ? <Video size={13} /> : <Phone size={13} />}
          Call back
        </button>
      </div>
    </div>
  );
}
