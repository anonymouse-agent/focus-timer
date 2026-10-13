import type { SessionRecord } from './types';

export const START_MARKER_PREFIX = '<!-- focus-timer:session:start id=';
export const END_MARKER_PREFIX = '<!-- focus-timer:session:end id=';

export function escapeHeading(value: string): string {
  return value.replace(/[\r\n\u2028\u2029]+/gu, ' ').replace(/([\\`*_{}\[\]()#+.!|>-])/gu, '\\$1');
}

export function dailyHeader(date: string): string {
  return `---\nschema_version: 1\ndate: ${date}\n---\n`;
}

export function serializeRecord(record: SessionRecord): string {
  const accomplishment = record.accomplishment === null || record.accomplishment.trim() === ''
    ? '_Not provided._'
    : record.accomplishment;
  return [
    `${START_MARKER_PREFIX}${record.sessionId} -->`,
    `## ${escapeHeading(record.taskLabel)}`,
    '',
    `- **Session ID:** \`${record.sessionId}\``,
    `- **Outcome:** \`${record.outcome}\``,
    `- **Started:** \`${record.startedAtLocal}\``,
    `- **Ended:** \`${record.endedAtLocal}\``,
    `- **Confirmed:** \`${record.confirmedAtLocal}\``,
    `- **Planned seconds:** ${record.plannedSeconds}`,
    `- **Focused seconds:** ${record.focusedSeconds}`,
    `- **Paused seconds:** ${record.pausedSeconds}`,
    `- **Recovery:** \`${record.recoveryProvenance}\``,
    `- **App version:** \`${record.appVersion}\``,
    '',
    '### Accomplishment',
    '',
    accomplishment,
    `${END_MARKER_PREFIX}${record.sessionId} -->`,
    '',
  ].join('\n');
}

export type MarkerStatus = 'absent' | 'complete' | 'malformed';

export function inspectRecordMarkers(content: string, sessionId: string): MarkerStatus {
  const start = `${START_MARKER_PREFIX}${sessionId} -->`;
  const end = `${END_MARKER_PREFIX}${sessionId} -->`;
  const starts = content.split(start).length - 1;
  const ends = content.split(end).length - 1;
  if (starts === 0 && ends === 0) return 'absent';
  if (starts === 1 && ends === 1 && content.indexOf(start) < content.indexOf(end)) return 'complete';
  return 'malformed';
}
