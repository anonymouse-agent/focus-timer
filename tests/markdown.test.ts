import { describe, expect, it } from 'vitest';
import { escapeHeading, inspectRecordMarkers, serializeRecord } from '../src/core/markdown';
import type { SessionRecord } from '../src/core/types';

const record: SessionRecord = {
  sessionId: '11111111-1111-4111-8111-111111111111', taskLabel: '# Ship [thing]',
  plannedSeconds: 1500, focusedSeconds: 1500, pausedSeconds: 60,
  startedAtUtc: '2026-10-13T04:00:00.000Z', startedAtLocal: '2026-10-13T09:30:00.000+05:30', localStartDate: '2026-10-13',
  endedAtUtc: '2026-10-13T04:26:00.000Z', endedAtLocal: '2026-10-13T09:56:00.000+05:30',
  confirmedAtLocal: '2026-10-13T09:57:00.000+05:30', outcome: 'timer_elapsed', recoveryProvenance: 'none',
  accomplishment: null, appVersion: '0.1.0',
};

describe('Markdown v1', () => {
  it('escapes headings and writes canonical missing accomplishment', () => {
    expect(escapeHeading('# Ship [thing]')).toBe('\\# Ship \\[thing\\]');
    const markdown = serializeRecord(record);
    expect(markdown).toContain('## \\# Ship \\[thing\\]');
    expect(markdown).toContain('_Not provided._');
    expect(inspectRecordMarkers(markdown, record.sessionId)).toBe('complete');
  });

  it('preserves multiline accomplishment Markdown', () => {
    const markdown = serializeRecord({ ...record, accomplishment: '- fixed tests\n- wrote notes' });
    expect(markdown).toContain('- fixed tests\n- wrote notes');
  });

  it('detects partial and duplicated markers', () => {
    const complete = serializeRecord(record);
    expect(inspectRecordMarkers(complete.replace(/<!-- focus-timer:session:end[^\n]+/u, ''), record.sessionId)).toBe('malformed');
    expect(inspectRecordMarkers(complete + complete, record.sessionId)).toBe('malformed');
    expect(inspectRecordMarkers('unrelated', record.sessionId)).toBe('absent');
  });
});
