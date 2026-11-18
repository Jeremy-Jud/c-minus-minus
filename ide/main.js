// C-- Studio: Hauptprozess (Fenster, Datei öffnen/speichern)
'use strict';
const { app, BrowserWindow, ipcMain, dialog, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');

let win = null;
// .cmm-Datei, mit der die App gestartet wurde (Doppelklick im Explorer)
const fileArg = (argv) => argv.slice(1).find((a) => /\.cmm$/i.test(a) && fs.existsSync(a));
let startFile = fileArg(process.argv);
function readCmm(p) {
  try {
    if (fs.statSync(p).size > 2 * 1024 * 1024) return null;
    return { path: p, name: path.basename(p), text: fs.readFileSync(p, 'utf8') };
  } catch { return null; }
}
let dirty = false;
const FILTERS = [{ name: 'C--', extensions: ['cmm'] }, { name: 'Alle Dateien', extensions: ['*'] }];

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 760, minHeight: 500,
    title: 'C-- Studio',
    backgroundColor: '#17181d',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, 'index.html'));
  win.webContents.on('did-finish-load', () => {
    if (startFile) { const f = readCmm(startFile); startFile = null; if (f) win.webContents.send('open-file', f); }
  });
  // Links (z. B. im Hilfe-Fenster) im Browser öffnen, nie in der App
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F12') win.webContents.toggleDevTools();
  });
  win.on('close', (e) => {
    if (!dirty) return;
    const r = dialog.showMessageBoxSync(win, {
      type: 'warning', buttons: ['Nicht speichern', 'Abbrechen'], defaultId: 1, cancelId: 1,
      title: 'C-- Studio', message: 'Ungespeicherte Änderungen',
      detail: 'Dein Meisterwerk ist noch nicht gespeichert. Trotzdem schliessen?',
    });
    if (r === 1) e.preventDefault();
  });
  win.on('closed', () => { win = null; });
}

// ---------- Updates über GitHub-Releases ----------
// Nur in der installierten App. Der Status geht an die Statusleiste im Fenster.
let updater = null;
let updateState = { state: 'idle' };
function sendUpdate(s) { updateState = s; if (win && !win.isDestroyed()) win.webContents.send('update', s); }
function setupUpdater() {
  if (!app.isPackaged) return;
  try { ({ autoUpdater: updater } = require('electron-updater')); } catch { return; }
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.on('checking-for-update', () => sendUpdate({ state: 'checking' }));
  updater.on('update-available', (i) => sendUpdate({ state: 'downloading', version: i.version, percent: 0 }));
  updater.on('update-not-available', () => sendUpdate({ state: 'none' }));
  updater.on('download-progress', (p) => sendUpdate({ ...updateState, state: 'downloading', percent: Math.round(p.percent || 0) }));
  updater.on('update-downloaded', (i) => sendUpdate({ state: 'ready', version: i.version }));
  updater.on('error', (e) => {
    const msg = String((e && e.message) || e);
    // Privates Repo oder noch kein Release: GitHub antwortet mit 404
    sendUpdate({ state: 'error', reason: /404|Not Found|Unable to find latest version/i.test(msg) ? 'notfound' : /ENOTFOUND|ECONNREFUSED|ETIMEDOUT|net::/i.test(msg) ? 'offline' : 'other' });
  });
  setTimeout(() => updater.checkForUpdates().catch(() => {}), 4000);
  setInterval(() => updater.checkForUpdates().catch(() => {}), 4 * 3600e3);
}
ipcMain.handle('update-check', async () => {
  if (!updater) return { state: 'dev' };
  try { await updater.checkForUpdates(); } catch {}
  return updateState;
});
ipcMain.handle('update-state', () => (updater ? updateState : { state: 'dev' }));
ipcMain.on('update-install', () => {
  if (!updater || updateState.state !== 'ready') return;
  dirty = false; // Entwurf ist im Fenster gespeichert und kommt nach dem Neustart zurück
  updater.quitAndInstall(false, true);
});
ipcMain.handle('version', () => app.getVersion());

ipcMain.on('dirty', (_e, v) => { dirty = !!v; });
ipcMain.on('title', (_e, t) => { if (win) win.setTitle(String(t).slice(0, 200)); });

ipcMain.handle('open', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'C--Datei öffnen', filters: FILTERS, properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  const st = fs.statSync(p);
  if (st.size > 2 * 1024 * 1024) return { error: 'Die Datei ist grösser als 2 MB. So viel C-- schreibt niemand.' };
  return { path: p, name: path.basename(p), text: fs.readFileSync(p, 'utf8') };
});

ipcMain.handle('save', async (_e, { path: p, text, as }) => {
  let target = typeof p === 'string' && p && !as ? p : null;
  if (!target) {
    const r = await dialog.showSaveDialog(win, { title: 'Speichern unter', defaultPath: p || 'programm.cmm', filters: FILTERS });
    if (r.canceled || !r.filePath) return null;
    target = r.filePath;
  }
  fs.writeFileSync(target, String(text), 'utf8');
  return { path: target, name: path.basename(target) };
});

// Nur ein Fenster: weitere Doppelklicks öffnen die Datei im laufenden Studio
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', (_e, argv) => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.focus();
    const p = fileArg(argv);
    const f = p && readCmm(p);
    if (f) win.webContents.send('open-file', f);
  });
  app.whenReady().then(() => { createWindow(); setupUpdater(); });
}
app.on('window-all-closed', () => app.quit());
