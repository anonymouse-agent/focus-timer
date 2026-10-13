import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';
import electron from 'electron';
import type { BrowserWindow as BrowserWindowType } from 'electron';
import type { Rectangle } from 'electron';
import { Coordinator } from './coordinator';
import type { SkinId } from '../core/types';
import type { AppCommand, WindowMode } from '../shared/ipc';
import { IPC } from '../shared/ipc';
import { boundsForMode, WINDOW_SIZES } from './window-bounds';

const { app, BrowserWindow, dialog, ipcMain, Notification, powerMonitor, screen, shell } = electron;

app.commandLine.appendSwitch('disable-background-networking');
app.commandLine.appendSwitch('disable-component-update');
app.commandLine.appendSwitch('disable-domain-reliability');

if (process.platform === 'win32' && !process.argv.some((argument) => argument.startsWith('--user-data-dir='))) {
  const localAppData = process.env['LOCALAPPDATA'];
  if (localAppData !== undefined && localAppData !== '') app.setPath('userData', join(localAppData, 'FocusTimer'));
}

let mainWindow: BrowserWindowType | null = null;
let coordinator: Coordinator | null = null;
let allowClose = false;
let currentWindowMode: WindowMode = 'compact';
let compactAnchorBounds: Rectangle | null = null;
let suppressPositionPersistence = false;
let pendingPositionSave: Promise<void> = Promise.resolve();
const smokeTest = process.argv.includes('--smoke-test');
const smokeRunning = process.argv.includes('--smoke-running');
const smokeControls = process.argv.includes('--smoke-controls');
const smokeAnchorCycle = process.argv.includes('--smoke-anchor-cycle');
const smokeSkin = readSmokeSkin();

function readSmokeSkin(): SkinId {
  const value = process.argv.find((argument) => argument.startsWith('--smoke-skin='))?.split('=')[1];
  return value === 'cat' || value === 'dog' || value === 'tomato' ? value : 'avocado';
}

const ownsInstance = app.requestSingleInstanceLock();
if (!ownsInstance) app.quit();

function showMainWindow(): void {
  if (mainWindow === null) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.setBounds(clampBounds(mainWindow.getBounds()));
  mainWindow.show();
  mainWindow.focus();
}

function clampBounds(bounds: Rectangle): Rectangle {
  const workArea = screen.getDisplayMatching(bounds).workArea;
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  return {
    width,
    height,
    x: Math.min(Math.max(bounds.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(bounds.y, workArea.y), workArea.y + workArea.height - height),
  };
}

function setWindowMode(mode: WindowMode): void {
  if (mainWindow === null || mode === currentWindowMode) return;
  const current = mainWindow.getBounds();
  if (currentWindowMode === 'compact') compactAnchorBounds = current;
  const anchor = compactAnchorBounds ?? current;
  const next = clampBounds(boundsForMode(anchor, mode));
  suppressPositionPersistence = true;
  currentWindowMode = mode;
  mainWindow.setBounds(next, true);
  if (mode === 'compact') compactAnchorBounds = null;
  setTimeout(() => { suppressPositionPersistence = false; }, 250);
}

function schedulePositionSave(): void {
  if (mainWindow === null || coordinator === null || suppressPositionPersistence || currentWindowMode !== 'compact') return;
  const { x, y } = mainWindow.getBounds();
  pendingPositionSave = pendingPositionSave
    .then(() => coordinator?.saveWindowPosition(x, y))
    .catch(() => undefined);
}

function keepWindowReachable(): void {
  if (mainWindow === null) return;
  suppressPositionPersistence = true;
  mainWindow.setBounds(clampBounds(mainWindow.getBounds()));
  setTimeout(() => { suppressPositionPersistence = false; }, 250);
}

async function createWindow(): Promise<void> {
  app.setAppUserModelId('com.focustimer.desktop');
  mainWindow = new BrowserWindow({
    ...WINDOW_SIZES.compact,
    resizable: false,
    frame: false,
    transparent: true,
    show: false,
    backgroundColor: '#00000000',
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('did-fail-load', (_event, code, description) => {
    if (!smokeTest) return;
    console.error(`Renderer failed to load (${code}): ${description}`);
    app.exit(1);
  });
  mainWindow.webContents.on('will-navigate', (event) => event.preventDefault());
  mainWindow.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  mainWindow.webContents.session.webRequest.onBeforeRequest((details, callback) => {
    const developmentUrl = process.env['ELECTRON_RENDERER_URL'];
    const allowed = details.url.startsWith('file:')
      || details.url.startsWith('data:')
      || (developmentUrl !== undefined && details.url.startsWith(developmentUrl));
    callback({ cancel: !allowed });
  });
  mainWindow.on('close', (event) => {
    if (allowClose || coordinator === null) return;
    if (!coordinator.hasUnresolvedWork()) {
      event.preventDefault();
      void pendingPositionSave.finally(() => {
        allowClose = true;
        mainWindow?.close();
      });
      return;
    }
    event.preventDefault();
    void dialog.showMessageBox(mainWindow!, {
      type: 'warning',
      title: 'Unresolved focus session',
      message: 'Exit and preserve this session?',
      detail: 'Focus Timer will restore the session next time, but cannot alert on time while it is closed.',
      buttons: ['Keep open', 'Exit and preserve'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    }).then(async ({ response }) => {
      if (response !== 1 || coordinator === null) return;
      await Promise.all([coordinator.checkpoint(), pendingPositionSave]);
      allowClose = true;
      app.quit();
    });
  });
  mainWindow.on('moved', schedulePositionSave);

  coordinator = new Coordinator(app.getPath('userData'), app.getVersion(), {
    publish: (snapshot) => mainWindow?.webContents.send(IPC.snapshot, snapshot),
    chooseDataFolder: async () => {
      const result = await dialog.showOpenDialog(mainWindow!, {
        title: 'Choose a dedicated Focus Timer data folder',
        properties: ['openDirectory', 'createDirectory'],
      });
      return result.canceled ? null : (result.filePaths[0] ?? null);
    },
    notify: (title, body) => {
      if (!Notification.isSupported()) return;
      const notification = new Notification({ title, body, silent: true });
      notification.on('click', showMainWindow);
      notification.show();
    },
    playSound: () => mainWindow?.webContents.send(IPC.playSound),
    setAlwaysOnTop: (enabled) => mainWindow?.setAlwaysOnTop(enabled, 'floating'),
    openFolder: (path) => shell.openPath(path),
  });

  ipcMain.handle(IPC.getSnapshot, () => coordinator!.getSnapshot());
  ipcMain.handle(IPC.command, (_event, command: unknown) => {
    if (!isAppCommand(command)) {
      return { ok: false, snapshot: coordinator!.getSnapshot(), message: 'Invalid application command.' };
    }
    return coordinator!.command(command);
  });
  ipcMain.handle(IPC.minimize, () => mainWindow?.minimize());
  ipcMain.handle(IPC.close, () => mainWindow?.close());
  ipcMain.handle(IPC.setWindowMode, (_event, mode: unknown) => {
    if (mode !== 'compact' && mode !== 'controls' && mode !== 'attached') return;
    setWindowMode(mode);
  });

  if (process.env['ELECTRON_RENDERER_URL'] !== undefined) {
    await mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    await mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
  await coordinator.initialize();
  if (smokeTest) {
    await coordinator.command({ type: 'setSkin', skin: smokeSkin });
    if (smokeRunning && coordinator.getSnapshot().state.status === 'IDLE') {
      await coordinator.command({ type: 'start', taskLabel: 'Write report', durationMinutes: '25' });
    }
  }
  const rememberedPosition = coordinator.getSnapshot().settings.windowPosition;
  if (rememberedPosition !== null) {
    const bounds = mainWindow.getBounds();
    mainWindow.setBounds(clampBounds({ ...bounds, ...rememberedPosition }));
  }
  screen.on('display-removed', keepWindowReachable);
  screen.on('display-metrics-changed', keepWindowReachable);
  powerMonitor.on('resume', () => {
    void coordinator?.reconcileAfterResume().catch(() => undefined);
  });
  if (smokeTest) {
    const rendererReady = await mainWindow.webContents.executeJavaScript(
      "Boolean(window.focusTimer?.getSnapshot && document.querySelector('#root')?.childElementCount)",
      true,
    ) as boolean;
    if (!rendererReady) {
      console.error('Smoke assertion failed: preload API or React root is unavailable.');
      app.exit(1);
      return;
    }
    if (smokeAnchorCycle) {
      const compactBefore = mainWindow.getBounds();
      await mainWindow.webContents.executeJavaScript("document.querySelector('.menu-trigger')?.click()", true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      await mainWindow.webContents.executeJavaScript("document.querySelector('[aria-label=\"Settings\"]')?.click()", true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      await mainWindow.webContents.executeJavaScript("document.querySelector('.panel-close')?.click()", true);
      await new Promise((resolve) => setTimeout(resolve, 450));
      const compactAfter = mainWindow.getBounds();
      if (compactBefore.x !== compactAfter.x || compactBefore.y !== compactAfter.y
        || compactBefore.width !== compactAfter.width || compactBefore.height !== compactAfter.height) {
        console.error(`Smoke assertion failed: compact bounds changed after attached panel cycle (${JSON.stringify({ compactBefore, compactAfter })}).`);
        app.exit(1);
        return;
      }
      console.log('FOCUS_TIMER_ANCHOR_RESTORED');
    }
    if (smokeControls) {
      await mainWindow.webContents.executeJavaScript("document.querySelector('.menu-trigger')?.click()", true);
    }
    mainWindow.showInactive();
    await new Promise((resolve) => setTimeout(resolve, 900));
    const semanticUiReady = await mainWindow.webContents.executeJavaScript(
      "Boolean(document.querySelector('.character-art') && document.querySelector('.clock-core') && document.querySelector('.menu-trigger') && document.querySelector('.orbit-controls'))",
      true,
    ) as boolean;
    if (!semanticUiReady) {
      console.error('Smoke assertion failed: character shell semantics are unavailable.');
      app.exit(1);
      return;
    }
    const artifacts = join(process.cwd(), 'artifacts');
    await mkdir(artifacts, { recursive: true });
    const smokeName = `electron-smoke-${smokeSkin}-${smokeControls ? 'controls' : smokeRunning ? 'running' : 'idle'}.png`;
    await mainWindow.webContents.capturePage();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await writeFile(join(artifacts, smokeName), (await mainWindow.webContents.capturePage()).toPNG());
    mainWindow.hide();
    console.log('FOCUS_TIMER_SMOKE_READY');
    setTimeout(() => app.exit(0), 500);
  } else {
    mainWindow.show();
  }
}

function isAppCommand(value: unknown): value is AppCommand {
  if (value === null || typeof value !== 'object' || !('type' in value) || typeof value.type !== 'string') return false;
  const candidate = value as Record<string, unknown>;
  switch (value.type) {
    case 'chooseDataFolder':
    case 'pause':
    case 'resume':
    case 'addNote':
    case 'discardDraft':
    case 'openDataFolder':
      return true;
    case 'cancel':
    case 'finishEarly':
      return candidate['confirmed'] === true;
    case 'start':
      return typeof candidate['taskLabel'] === 'string' && typeof candidate['durationMinutes'] === 'string';
    case 'updateDraft':
      return typeof candidate['draft'] === 'string';
    case 'save':
      return typeof candidate['includeDraft'] === 'boolean';
    case 'resolveTimeConflict':
      return candidate['choice'] === 'wall_clock' || candidate['choice'] === 'pause_verified';
    case 'setSkin':
      return candidate['skin'] === 'avocado' || candidate['skin'] === 'cat' || candidate['skin'] === 'dog' || candidate['skin'] === 'tomato';
    case 'setSound':
    case 'setNotifications':
    case 'setAlwaysOnTop':
      return typeof candidate['enabled'] === 'boolean';
    default:
      return false;
  }
}

app.on('second-instance', showMainWindow);
app.whenReady().then(createWindow).catch((error: unknown) => {
  dialog.showErrorBox('Focus Timer could not start', error instanceof Error ? error.message : 'Unknown startup error.');
  app.quit();
});
app.on('window-all-closed', () => app.quit());
app.on('before-quit', () => coordinator?.stop());
