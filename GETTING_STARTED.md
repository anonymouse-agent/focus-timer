# Getting started with Focus Timer

Focus Timer runs on Windows 11. You do not need a GitHub account or any developer tools.

## Install the app

1. Go to the [Focus Timer releases page](https://github.com/anonymouse-agent/focus-timer/releases).
2. Open the newest release.
3. Under **Assets**, download the file named like this:

   `Focus-Timer-Setup-0.1.0-beta.1-windows-x64.exe`

   The version numbers may be different in a newer release.

4. Open the downloaded file.
5. Follow the installer. You can keep the default options.
6. When installation finishes, open **Focus Timer**.

### If Windows shows a warning

The current beta is not code-signed yet, so Windows may show **Windows protected your PC**.

Only continue if you downloaded Focus Timer from this address:

`https://github.com/anonymouse-agent/focus-timer`

Then:

1. Click **More info**.
2. Check that the app name is Focus Timer.
3. Click **Run anyway**.

If the download came from anywhere else, cancel and download it again from the official repository.

## First launch

The first time you open Focus Timer, it asks where to save your completed sessions.

1. Click **Choose data folder**.
2. In Documents, create a new folder named `Focus Timer Sessions`.
3. Choose that folder.

Use a new, empty folder just for Focus Timer. The app adds a small setup file and saves each day's sessions there as Markdown.

Focus Timer does not upload these files. You can open or back up the folder whenever you want.

## Start a timer

1. Enter what you want to focus on.
2. Choose a duration from 1 to 240 minutes.
3. Select **Start**.

Click the clock to pause or resume. Open the three-dot menu for the other controls and settings.

When the timer ends, write what you accomplished or click **Skip & save**. Focus Timer saves the session to a file named like `2026-10-14.md` in your data folder.

## Portable version

If you do not want to install the app, use the portable ZIP instead.

1. From the release's **Assets**, download the file ending in `windows-x64.zip`.
2. Right-click the ZIP and select **Extract All**.
3. Open the extracted folder.
4. Run `Focus Timer.exe`.

Keep the whole extracted folder together. Do not run the app from inside the ZIP.

## Find or back up your sessions

Open the three-dot menu, click **Settings**, then click **Open data folder**.

Back up that entire folder. Do not delete `.focus-timer-folder.json`; it identifies the folder as a Focus Timer data folder.

## Uninstall

1. Open Windows **Settings**.
2. Go to **Apps** > **Installed apps**.
3. Find **Focus Timer**, open its menu, and click **Uninstall**.

Uninstalling the app does not delete the session Markdown files in the data folder you chose.

## Need help?

Open a [GitHub issue](https://github.com/anonymouse-agent/focus-timer/issues) and describe what happened. Do not include private task names, accomplishment notes, or other personal information.
