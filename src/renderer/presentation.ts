import type { SessionState, SkinId } from '../core/types';
import type { WindowMode } from '../shared/ipc';

export type CharacterPose = 'idle' | 'focus' | 'paused' | 'complete';
export type StatusTone = 'info' | 'error';

export const STATUS_TOAST_DURATION_MS: Readonly<Record<StatusTone, number>> = {
  info: 2400,
  error: 6000,
};

export interface SkinGeometry {
  readonly coreXPercent: number;
  readonly coreYPercent: number;
  readonly coreSizePixels: number;
  readonly artScale: number;
}

export const SKIN_GEOMETRY: Readonly<Record<SkinId, SkinGeometry>> = {
  avocado: { coreXPercent: 50, coreYPercent: 78, coreSizePixels: 110, artScale: 1 },
  cat: { coreXPercent: 50, coreYPercent: 77, coreSizePixels: 116, artScale: 1 },
  dog: { coreXPercent: 50, coreYPercent: 78, coreSizePixels: 114, artScale: 1 },
  tomato: { coreXPercent: 50, coreYPercent: 86, coreSizePixels: 96, artScale: 1 },
};

export function poseForState(state: SessionState): CharacterPose {
  switch (state.status) {
    case 'RUNNING': return 'focus';
    case 'PAUSED':
    case 'TIME_CONFLICT': return 'paused';
    case 'COMPLETION_REVIEW':
    case 'NOTE_ENTRY':
    case 'SAVE_FAILED': return 'complete';
    default: return 'idle';
  }
}

export function windowModeFor(state: SessionState, overlayOpen: boolean): WindowMode {
  if (overlayOpen) return 'attached';
  switch (state.status) {
    case 'IDLE':
    case 'RUNNING':
    case 'PAUSED':
      return 'compact';
    default:
      return 'attached';
  }
}

export function isValidSkinGeometry(value: SkinGeometry): boolean {
  return value.coreXPercent >= 0
    && value.coreXPercent <= 100
    && value.coreYPercent >= 0
    && value.coreYPercent <= 100
    && value.coreSizePixels >= 96
    && value.coreSizePixels <= 160
    && value.artScale >= 0.8
    && value.artScale <= 1.2;
}
