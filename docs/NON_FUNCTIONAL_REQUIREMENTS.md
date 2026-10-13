# Focus Timer — Non-Functional Requirements

Status: **CONFIRMED** (Gate C character-first revision approved, 2026-10-13)

| ID | Requirement |
|---|---|
| NFR-001 | Expiry is within one second under normal load; reconciliation occurs within one second after execution resumes. |
| NFR-002 | No acknowledged transition is lost; accomplishment drafts may lose at most one second of the newest input. |
| NFR-003 | Main-process command feedback is delivered to the renderer within 100 ms under normal load, excluding user dialogs and filesystem contention. |
| NFR-004 | Cold start to interactive UI completes within two seconds on the target reference machine. |
| NFR-005 | Average CPU remains below 1% and working set at or below 300 MB during a 30-minute timing run on the reference machine. |
| NFR-006 | Keyboard-only operation, accessible names, visible focus, Windows Narrator, high contrast, reduced motion, and 200% scaling are supported. |
| NFR-007 | The packaged app makes no runtime network attempts and loads no remote content. |
| NFR-008 | The application runs unelevated and writes only to user-selected history and its Electron user-data directory. |
| NFR-009 | Logs exclude task/accomplishment text, paths beyond safe leaf/context data, and secrets; retain at most seven 1 MB files. |
| NFR-010 | Only one process owns timer state for a Windows user. Secondary launches activate the existing instance. |
| NFR-011 | Renderer sandboxing, context isolation, disabled Node integration, restrictive CSP, validated IPC inputs, and navigation denial are mandatory. |
| NFR-012 | All durable formats are versioned and forward incompatibility fails visibly without destructive migration. |
| NFR-013 | Animation uses low frame rates and is disabled when reduced motion is requested. |
| NFR-014 | Release artifacts are a self-contained unsigned Windows x64 assisted installer and portable ZIP, each with a SHA-256 checksum. The default current-user install requires no administrator access, and uninstall never deletes the selected Markdown folder, settings, or unresolved-session recovery data. |
| NFR-015 | Compact mode has no opaque bounding rectangle at 100%, 150%, or 200% Windows scaling; the character and primary controls remain unclipped. |
| NFR-016 | Every primary or secondary control has a semantic role, accessible name, keyboard path, and a visible focus treatment independent of the artwork. |
| NFR-017 | Window restoration, expansion, display removal, and DPI changes keep the character and its menu reachable in a visible work area. |
| NFR-018 | Production character assets use low-resolution masters with nearest-neighbor scaling and do not contain authoritative task, time, state, or control text. |
