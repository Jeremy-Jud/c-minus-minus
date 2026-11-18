'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  open: () => ipcRenderer.invoke('open'),
  save: (path, text, as) => ipcRenderer.invoke('save', { path, text, as: !!as }),
  setDirty: (v) => ipcRenderer.send('dirty', !!v),
  setTitle: (t) => ipcRenderer.send('title', String(t)),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_e, f) => cb(f)),
  version: () => ipcRenderer.invoke('version'),
  aiAsk: (wish, vars) => ipcRenderer.invoke('ai-ask', String(wish), vars),
  aiHasKey: () => ipcRenderer.invoke('ai-has-key'),
  aiSetKey: (key) => ipcRenderer.invoke('ai-set-key', String(key)),
  checkUpdate: () => ipcRenderer.invoke('update-check'),
  updateState: () => ipcRenderer.invoke('update-state'),
  installUpdate: () => ipcRenderer.send('update-install'),
  onUpdate: (cb) => ipcRenderer.on('update', (_e, s) => cb(s)),
});
