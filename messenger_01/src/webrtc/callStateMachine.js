"use strict";

export const CallState = Object.freeze({
  IDLE: "IDLE",
  CALLING: "CALLING",
  RINGING: "RINGING",
  CONNECTED: "CONNECTED",
  ENDED: "ENDED",
  MISSED: "MISSED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
});

const transitions = {
  [CallState.IDLE]: [CallState.CALLING, CallState.RINGING],
  [CallState.CALLING]: [
    CallState.RINGING,
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.MISSED,
    CallState.ENDED,
    CallState.FAILED,
  ],
  [CallState.RINGING]: [
    CallState.CONNECTED,
    CallState.REJECTED,
    CallState.MISSED,
    CallState.ENDED,
    CallState.FAILED,
  ],
  [CallState.CONNECTED]: [CallState.ENDED, CallState.FAILED],
  [CallState.ENDED]: [CallState.IDLE],
  [CallState.MISSED]: [CallState.IDLE],
  [CallState.REJECTED]: [CallState.IDLE],
  [CallState.FAILED]: [CallState.IDLE],
};

export class CallStateMachine {
  constructor(onTransition) {
    this.state = CallState.IDLE;
    this.context = {
      callId: null,
      role: null,
      type: null,
      peerUserId: null,
      peerName: null,
      reason: "",
    };
    this.onTransition = onTransition || (() => {});
  }

  canTransition(next) {
    return transitions[this.state]?.includes(next) === true;
  }

  transition(next, patch = {}, reason = "") {
    if (!this.canTransition(next)) {
      throw new Error(`Invalid call transition ${this.state} -> ${next}`);
    }

    const prev = this.state;
    this.state = next;
    this.context = { ...this.context, ...patch, reason };
    this.onTransition({ prev, next, context: this.context });
  }

  safeTransition(next, patch = {}, reason = "") {
    if (!this.canTransition(next)) {
      return false;
    }
    this.transition(next, patch, reason);
    return true;
  }

  reset() {
    this.state = CallState.IDLE;
    this.context = {
      callId: null,
      role: null,
      type: null,
      peerUserId: null,
      peerName: null,
      reason: "",
    };
    this.onTransition({ prev: null, next: this.state, context: this.context });
  }
}
