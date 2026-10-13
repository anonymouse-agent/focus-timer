# Focus Timer — Decision Log

Status: living record

| ID | Status | Decision and reasoning |
|---|---|---|
| DEC-001 | CONFIRMED | Target Windows 11 x64 first; it narrows platform behavior and test scope. |
| DEC-002 | CONFIRMED | Running time is wall-clock time: sleep counts, pauses do not. This matches user expectations for a focus interval. |
| DEC-003 | CONFIRMED | Persist all unresolved states. Recovery is a product behavior, not an implementation detail. |
| DEC-004 | CONFIRMED | Final history is human-readable append-only Markdown in a user-owned folder; no database is used. |
| DEC-005 | CONFIRMED | Completion is reviewed before final history write. Reliability and intentional records take precedence over automatic logging parity. |
| DEC-006 | CONFIRMED | Obsidian integration is deferred. A user may select a folder inside a vault, but no Obsidian behavior exists. |
| DEC-007 | SUPERSEDED | WPF/.NET was initially selected, then replaced after the user prioritized architectural similarity to Tina Huang's app. |
| DEC-008 | CONFIRMED | Electron is the desktop runtime. Tina publicly identifies her app as Electron, and the user explicitly chose architectural similarity. |
| DEC-009 | CONFIRMED | React + TypeScript + Vite implement the renderer. Tina's renderer framework is not public; this is our maintainable implementation choice, not a claim about hers. |
| DEC-010 | CONFIRMED | Main process owns timing, persistence, filesystem, and native integration; renderer is sandboxed presentation. This preserves trust across Electron's process boundary. |
| DEC-011 | CONFIRMED | Four original bundled skins—avocado, cat, dog, tomato—are MVP. They affect presentation only and do not introduce unlocking or gamification. |
| DEC-012 | SUPERSEDED | The original compact frameless card is replaced by DEC-017 through DEC-024 after the user clarified that the character must be the clock rather than an element inside a screen. |
| DEC-013 | CONFIRMED | Subtle focusing/completion animation is allowed and honors reduced motion. |
| DEC-014 | CONFIRMED | Electron memory target is ≤300 MB during the reference run; the two-second startup target remains. |
| DEC-015 | CONFIRMED | No updater or runtime network. Electron security updates require explicit rebuilds and releases. |
| DEC-016 | CONFIRMED | Unsigned portable folder and ZIP are the initial distribution. Signing/installer work is deferred. |
| DEC-017 | CONFIRMED | Supersede DEC-012's pixel-art card: the compact product is a transparent timer-character with no persistent opaque card or conventional title bar. This corrects the mismatch between “mascot in an app” and “character as the app.” |
| DEC-018 | CONFIRMED | Duration/countdown and Start/Pause/Resume live inside each skin's clock-core region. The editable task is a one-line tab immediately above the idle character. |
| DEC-019 | SUPERSEDED | The original ordinary-hover reveal is replaced by DEC-026 after visual review showed that incidental hover made the compact character unnecessarily busy. |
| DEC-020 | CONFIRMED | Use one adaptive BrowserWindow. Setup, completion, settings, conflicts, failures, and confirmations appear in an attached expanded panel rather than separate windows. |
| DEC-021 | CONFIRMED | Target 320×400 logical pixels in compact mode and roughly 420×600 in expanded mode, clamped to available work area. Exact dimensions may be tuned against scaling tests. |
| DEC-022 | CONFIRMED | Pixel-level click-through is not an MVP requirement. Use tight transparent bounds; enable passthrough only if a later feasibility spike proves reliable with focus, dragging, DPI, and accessibility. |
| DEC-023 | CONFIRMED | Do not depend on Electron's experimental shaped-window API. This avoids making core interaction contingent on an unstable platform feature. |
| DEC-024 | CONFIRMED | Each bundled skin uses an original four-pose transparent sprite sheet plus a manifest defining clock-core geometry. The live clock remains semantic HTML rather than baked-in artwork. |
| DEC-025 | CONFIRMED | Keep the face visually unobstructed by moving a smaller clock core to the lower body. Once a session starts, remove the external task tab and put its read-only label inside the core with the countdown. This makes the character—not a floating form field—the persistent product surface. |
| DEC-026 | CONFIRMED | Secondary controls open from the persistent three-dot affordance or keyboard focus, not from ordinary character hover. This reduces accidental visual noise while retaining discoverability and keyboard access. |
| DEC-027 | CONFIRMED | Focused character expressions use soft or neutral brows and a small positive smile. Concentration is conveyed through writing props, posture, state text, and motion—not angry or judgmental facial cues. The tomato uses a uniquely lower, smaller clock core because its round silhouette places the face lower than the other skins. |
| DEC-028 | CONFIRMED | Replace the detached right-side menu with a small three-dot trigger integrated into the clock rim. Its secondary actions appear in a horizontal shelf that expands upward, keeping the character fixed and allowing it to sit naturally at a screen corner. |
| DEC-029 | CONFIRMED | Treat compact bounds as the authoritative visual anchor. Temporary control and attached modes calculate their bounds from that anchor, and compact restoration uses the saved anchor rather than the expanded window position. This cheaply fixes post-completion position drift without persisting another workflow state. |
| DEC-030 | SUPERSEDED | A proposed 7–9% clock-core reduction was withdrawn after review because the countdown must not feel any smaller or more cramped. |
| DEC-031 | CONFIRMED | New profiles start pinned because persistent visibility is the product's core promise. Existing saved choices are never overwritten. Use the visible label `PIN` rather than an ambiguous diamond symbol. |
| DEC-032 | CONFIRMED | Preserve the current avatar, clock-core, and countdown sizes. Any future improvement to body integration must come from per-skin placement and must retain face clearance and timer legibility. |

| DEC-033 | CONFIRMED | Treat command confirmations as transient, click-through feedback rather than durable UI. Successes dismiss after 2.4 seconds; errors remain for 6 seconds, while durable failure states continue to use the attached panel. |

## Source note

Tina Huang's public demonstration confirms a compact time-and-label flow, Electron, an avocado mascot, added cat/dog/tomato skins, and Obsidian logging. It does not publish a complete source architecture. The project therefore distinguishes verified inspiration from our own design decisions.
