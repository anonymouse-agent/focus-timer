import electron from 'electron';
import type { AppCommand, CommandResponse, FocusTimerApi, PublicSnapshot } from '../shared/ipc';
import { IPC } from '../shared/ipc';

const { contextBridge, ipcRenderer } = electron;

const api: FocusTimerApi = {
  getSnapshot: () => ipcRenderer.invoke(IPC.getSnapshot) as Promise<PublicSnapshot>,
  command: (command: AppCommand) => ipcRenderer.invoke(IPC.command, command) as Promise<CommandResponse>,
  minimize: () => ipcRenderer.invoke(IPC.minimize) as Promise<void>,
  requestClose: () => ipcRenderer.invoke(IPC.close) as Promise<void>,
  setWindowMode: (mode) => ipcRenderer.invoke(IPC.setWindowMode, mode) as Promise<void>,
  onSnapshot: (listener) => {
    const wrapped = (_event: Electron.IpcRendererEvent, snapshot: PublicSnapshot): void => listener(snapshot);
    ipcRenderer.on(IPC.snapshot, wrapped);
    return () => ipcRenderer.removeListener(IPC.snapshot, wrapped);
  },
  onPlaySound: (listener) => {
    const wrapped = (): void => listener();
    ipcRenderer.on(IPC.playSound, wrapped);
    return () => ipcRenderer.removeListener(IPC.playSound, wrapped);
  },
};

contextBridge.exposeInMainWorld('focusTimer', api);
