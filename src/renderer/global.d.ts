import type { FocusTimerApi } from '../shared/ipc';

declare global {
  interface Window {
    readonly focusTimer: FocusTimerApi;
  }
}

export {};
