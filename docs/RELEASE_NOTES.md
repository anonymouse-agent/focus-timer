# Focus Timer 0.1.0-beta.1

This is the first public beta. It is ready for feedback, but I still need to finish the manual Windows checks before calling it stable.

## What is included

- Four original pixel-art characters: avocado, cat, dog, and tomato.
- A small floating timer that keeps the character, task, time, and main control together.
- Pause, resume, cancel, and finish-early controls.
- Recovery after you close the app, restart Windows, or the app crashes.
- Optional accomplishment notes at the end of a session.
- Daily Markdown files saved in a folder you choose.
- Sound, Windows notifications, always-on-top mode, and remembered settings.
- A Windows installer and a portable ZIP.
- No account, ads, analytics, cloud sync, or internet connection.

## Known limitations

- The installer and portable ZIP are not signed yet. Windows may show a SmartScreen warning.
- There is no automatic updater.
- Focus Timer cannot alert you while the app is closed. It restores the unfinished session the next time you open it.
- Another app syncing the same Markdown folder may temporarily block a save. Focus Timer shows the error and lets you retry.
- Transparent parts of the window can still receive clicks. I kept the window small to reduce the empty clickable area.
- Electron can occasionally miss part of the transparent window in a screenshot. I have not seen content disappear during normal use, but this still needs more testing.
- I still need to complete the Narrator, high-contrast, notification, sleep and wake, performance, and eight-hour tests.
- `npm audit` reports moderate issues in development tools used by electron-builder. These packages are not included as app runtime dependencies, and no upstream fix is currently available.

## Back up your sessions

Back up the whole data folder you chose during setup. Keep `.focus-timer-folder.json` together with the daily Markdown files.

Focus Timer also keeps temporary recovery data in Electron's `userData` folder. That recovery data helps restore an unfinished session, but it does not replace a backup of your saved Markdown files.
