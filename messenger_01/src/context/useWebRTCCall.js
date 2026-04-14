import { useContext } from "react";
import { WebRTCCallContext } from "./WebRTCCallContextValue";

export function useWebRTCCall() {
  const ctx = useContext(WebRTCCallContext);
  if (!ctx) throw new Error("useWebRTCCall must be used within WebRTCCallProvider");
  return ctx;
}
