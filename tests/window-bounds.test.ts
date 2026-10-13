import { describe, expect, it } from 'vitest';
import { boundsForMode } from '../src/main/window-bounds';

describe('window mode anchoring', () => {
  const compact = { x: 1200, y: 480, width: 320, height: 400 };

  it('expands controls upward without moving the character anchor', () => {
    expect(boundsForMode(compact, 'controls')).toEqual({ x: 1200, y: 428, width: 320, height: 452 });
  });

  it('expands an attached workflow around the same bottom-center anchor', () => {
    expect(boundsForMode(compact, 'attached')).toEqual({ x: 1150, y: 280, width: 420, height: 600 });
  });

  it('returns exactly to the original compact bounds after any temporary mode', () => {
    expect(boundsForMode(compact, 'compact')).toEqual(compact);
  });
});
