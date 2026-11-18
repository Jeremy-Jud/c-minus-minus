'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('studio', {
  open: () => ipcRenderer.invoke('open'),
  save: (path, text, as) => ipcRenderer.invoke('save', { path, text, as: !!as }),
  setDirty: (v) => ipcRenderer.send('dirty', !!v),
  setTitle: (t) => ipcRenderer.send('title', String(t)),
  onOpenFile: (cb) => ipcRenderer.on('open-file', (_e, f) => cb(f)),
});
