"use strict";

const MISSED_CALL_EVENT = "webrtc:missed-call";

export class NotificationManager {
  constructor({ onInAppMissedCall }) {
    this.onInAppMissedCall = onInAppMissedCall || (() => {});
    this.hasBoundInteraction = false;
  }

  bindPermissionPromptAfterInteraction() {
    if (this.hasBoundInteraction) return;
    this.hasBoundInteraction = true;

    const requestPermissionOnce = async () => {
      window.removeEventListener("click", requestPermissionOnce);
      window.removeEventListener("keydown", requestPermissionOnce);
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        try {
          await Notification.requestPermission();
        } catch (err) {
          console.error("Notification permission request failed", err);
        }
      }
    };

    window.addEventListener("click", requestPermissionOnce, { once: true });
    window.addEventListener("keydown", requestPermissionOnce, { once: true });
  }

  notifyMissedCall({ callerId, callerName, callerAvatar, callType, at }) {
    const payload = {
      id: `missed-${callerId}-${at || Date.now()}`,
      callerId: String(callerId || ""),
      callerName: callerName || "Unknown",
      callerAvatar: callerAvatar || "",
      callType: callType === "video" ? "video" : "voice",
      at: at || Date.now(),
    };

    this.onInAppMissedCall(payload);
    window.dispatchEvent(new CustomEvent(MISSED_CALL_EVENT, { detail: payload }));

    // Show OS-level notification only when app is backgrounded.
    if (!document.hidden) return;
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;

    const n = new Notification(`Missed call from ${payload.callerName}`, {
      body: "Tap to call back",
      icon: payload.callerAvatar || "/vite.svg",
      tag: `missed-${payload.callerId}`,
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      window.dispatchEvent(new CustomEvent("webrtc:open-chat", { detail: { userId: payload.callerId } }));
      n.close();
    };
  }
}

export function getMissedCallEventName() {
  return MISSED_CALL_EVENT;
}

/**
 * Service Worker approach for tab-closed notifications:
 * self.registration.showNotification("Missed call from Alice", {
 *   body: "Tap to call back",
 *   icon: "/icons/avatar.png",
 *   data: { callerId: "u123" }
 * });
 */
