import type { WindowMode } from '../shared/ipc';

export interface WindowBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const WINDOW_SIZES: Readonly<Record<WindowMode, { readonly width: number; readonly height: number }>> = {
  compact: { width: 320, height: 400 },
  controls: { width: 320, height: 452 },
  attached: { width: 420, height: 600 },
};

export function boundsForMode(compactAnchor: WindowBounds, mode: WindowMode): WindowBounds {
  const compact = WINDOW_SIZES.compact;
  const target = WINDOW_SIZES[mode];
  return {
    x: Math.round(compactAnchor.x + (compact.width - target.width) / 2),
    y: compactAnchor.y + compact.height - target.height,
    width: target.width,
    height: target.height,
  };
}
