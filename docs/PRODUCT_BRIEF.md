# Focus Timer — Product Brief

Status: **CONFIRMED** (Gate A revalidated for the character-first revision, 2026-10-13)

## Purpose

Focus Timer is a compact, playful Windows 11 desktop timer for people who want to name a task, choose a duration, and start focusing with minimal friction. It takes experiential inspiration from Tina Huang's Pixel Pomodoro while remaining an original product.

The product is personal-first, offline, and local-first. Trustworthy timing, crash recovery, inspectable Markdown, and ownership of data take priority over feature breadth.

## Target user and job

A single Windows user wants a small timer that can stay above other applications, survive interruption or restart, and leave behind a durable, understandable record of completed focus sessions.

## MVP promise

- Enter a task and whole-minute duration, then start immediately.
- Pause, resume, finish early, or cancel with deliberate controls.
- Keep a small pixel-art timer-character visible while working; the character is the application, not decoration inside an application card.
- Choose one of four original skins: avocado, cat, dog, or tomato.
- Recover unresolved work after exit, crash, sleep, or reboot.
- Review completion, optionally add an accomplishment, and save exactly one Markdown record.
- Choose and open the data folder at any time.

## Success indicators

- No acknowledged state transition is silently lost.
- A finalized session is never duplicated by retry or recovery.
- The timer does not drift because UI updates were delayed.
- The user can read, back up, and move all durable records without this application.
- A focus session can be started from the idle screen using only the keyboard.
- In normal idle, running, and paused use, the product reads visually as a desktop object rather than a conventional rectangular application window.

## Explicit non-goals

History UI, multiple concurrent timers, automatic breaks or cycles, tray mode, global shortcuts, accounts, sync, dedicated Obsidian integration, analytics, downloadable themes, gamification, AI coaching, telemetry, updater, mobile, web, macOS, and Linux are deferred.

## Inspiration boundary

We borrow the compact time-and-label workflow, friendly pixel-character concept, and Electron desktop shape. The character itself contains the clock and primary action. We do not copy Tina Huang's artwork, branding, source code, or Obsidian coupling. All visual assets and implementation are original.
