# Focus Timer — Data Contract

Status: **CONFIRMED** (Gate B)

## Ownership and locations

Final session history lives only in the user-selected folder. Internal recoverable application state lives under `%LOCALAPPDATA%\FocusTimer`.

Internal files:

- `settings.v1.json`
- `session-state.v1.json`
- `session-state.v1.backup.json`
- `logs/focus-timer-YYYY-MM-DD.N.log` (privacy-safe and bounded)

## Folder protocol

The chosen directory must be empty or contain a compatible `.focus-timer-folder.json`:

```json
{
  "product": "Focus Timer",
  "schemaVersion": 1
}
```

Selecting an ordinary non-empty directory without that marker is rejected. A folder may happen to sit inside an Obsidian vault, but the application has no Obsidian-specific behavior.

## Daily files

File name is permanently based on session local start date: `YYYY-MM-DD.md`. UTF-8 without BOM and LF newlines are used for application-written content.

```markdown
---
schema_version: 1
date: 2026-10-13
---
```

Existing unknown content after a valid header is preserved. Finalized records are never edited or deleted.

## Session section v1

```markdown
<!-- focus-timer:session:start id=6f2dcb02-c90e-4fe4-8066-c35cb2a3249f -->
## Write release notes

- **Session ID:** `6f2dcb02-c90e-4fe4-8066-c35cb2a3249f`
- **Outcome:** `timer_elapsed`
- **Started:** `2026-10-13T09:30:00+05:30`
- **Ended:** `2026-10-13T09:55:00+05:30`
- **Confirmed:** `2026-10-13T09:56:12+05:30`
- **Planned seconds:** 1500
- **Focused seconds:** 1500
- **Paused seconds:** 0
- **Recovery:** `none`
- **App version:** the application version string, for example `0.1.0-beta.1`

### Accomplishment

_Not provided._
<!-- focus-timer:session:end id=6f2dcb02-c90e-4fe4-8066-c35cb2a3249f -->
```

Task headings escape Markdown metacharacters and collapse embedded line separators to spaces. Accomplishments are written as user-authored Markdown without interpretation. Supported outcomes are `timer_elapsed` and `finished_early`; recovery is `none`, `same_boot_monotonic`, `reboot_utc`, or `user_resolved`.

## Idempotency and failure

Before append, scan for the exact stable start and end markers:

- Both well-formed markers for the ID: treat retry as success.
- Only one marker, reversed markers, duplicates, or malformed matching content: fail visibly and do not append.
- No marker: append one complete section under exclusive application ownership and flush before reporting success.

New files are created exclusively and flushed. Existing files are opened for append, written as one UTF-8 buffer, and flushed. A process-local write queue prevents concurrent appends. External contention or synchronization conflicts surface as typed filesystem failures.

## Recovery JSON

JSON stores schema version, full durable state, last observed UTC/monotonic evidence, and alert-delivery flags. Writes use a same-directory temporary file, file flush, backup rotation, and atomic rename/replace. Secrets and session text are excluded from diagnostic logs.
