import { describe, expect, it } from 'vitest';
import type { SessionState } from '../src/core/types';
import { isValidSkinGeometry, poseForState, SKIN_GEOMETRY, STATUS_TOAST_DURATION_MS, windowModeFor } from '../src/renderer/presentation';

describe('character presentation', () => {
  it('keeps ordinary timer states compact', () => {
    expect(windowModeFor({ status: 'IDLE' }, false)).toBe('compact');
    const session = fakeSession();
    expect(windowModeFor({ status: 'RUNNING', session }, false)).toBe('compact');
    expect(windowModeFor({ status: 'PAUSED', session }, false)).toBe('compact');
  });

  it('uses the attached panel for overlays and exceptional durable states', () => {
    expect(windowModeFor({ status: 'IDLE' }, true)).toBe('attached');
    expect(windowModeFor({ status: 'SETUP_REQUIRED', reason: 'Choose a folder.' }, false)).toBe('attached');
    expect(windowModeFor({
      status: 'TIME_CONFLICT',
      session: fakeSession(),
      wallElapsedMilliseconds: 1000,
      monotonicElapsedMilliseconds: 9000,
    }, false)).toBe('attached');
  });

  it('provides valid geometry for every bundled skin', () => {
    expect(Object.keys(SKIN_GEOMETRY).sort()).toEqual(['avocado', 'cat', 'dog', 'tomato']);
    for (const geometry of Object.values(SKIN_GEOMETRY)) expect(isValidSkinGeometry(geometry)).toBe(true);
  });

  it('keeps every clock core below the character face', () => {
    for (const geometry of Object.values(SKIN_GEOMETRY)) {
      expect(geometry.coreYPercent).toBeGreaterThanOrEqual(72);
      expect(geometry.coreSizePixels).toBeLessThanOrEqual(120);
    }
    expect(SKIN_GEOMETRY.tomato.coreYPercent).toBeGreaterThanOrEqual(84);
    expect(SKIN_GEOMETRY.tomato.coreSizePixels).toBeLessThanOrEqual(100);
  });

  it('maps durable states to unambiguous poses', () => {
    const session = fakeSession();
    expect(poseForState({ status: 'IDLE' })).toBe('idle');
    expect(poseForState({ status: 'RUNNING', session })).toBe('focus');
    expect(poseForState({ status: 'PAUSED', session })).toBe('paused');
  });

  it('keeps confirmations brief while giving failures more reading time', () => {
    expect(STATUS_TOAST_DURATION_MS.info).toBeLessThanOrEqual(3000);
    expect(STATUS_TOAST_DURATION_MS.error).toBeGreaterThan(STATUS_TOAST_DURATION_MS.info);
  });
});

function fakeSession(): Extract<SessionState, { status: 'RUNNING' }>['session'] {
  return {
    id: 'session',
    taskLabel: 'Write report',
    plannedSeconds: 1500,
    startedAtUtc: '2026-10-13T10:00:00.000Z',
    startedAtLocal: '2026-10-13T15:30:00+05:30',
    localStartDate: '2026-10-13',
    focusedMilliseconds: 0,
    pausedMilliseconds: 0,
    segmentStartedAtUtc: '2026-10-13T10:00:00.000Z',
    segmentStartedMonotonicMilliseconds: 1000,
    utcDeadline: '2026-10-13T10:25:00.000Z',
    pauseStartedAtUtc: null,
    recoveryProvenance: 'none',
  };
}
