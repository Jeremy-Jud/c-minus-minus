// Zeichnet das App-Icon und schreibt build/icon.png (512 px), build/icon.ico und ide/icon.png.
//   npx electron build/make-icon.js
'use strict';
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const SIZES = [16, 24, 32, 48, 64, 128, 256];

const draw = `(size) => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = size;
  const g = cv.getContext('2d');
  const s = size / 256;
  // abgerundetes Quadrat mit Verlauf
  const r = 56 * s, m = 8 * s, w = size - 2 * m;
  const bg = g.createLinearGradient(0, 0, size, size);
  bg.addColorStop(0, '#7b3fe4');
  bg.addColorStop(1, '#2a1257');
  g.beginPath(); g.roundRect(m, m, w, w, r); g.fillStyle = bg; g.fill();
  // leichter Glanz oben
  const gl = g.createLinearGradient(0, m, 0, size / 2);
  gl.addColorStop(0, 'rgba(255,255,255,.22)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.beginPath(); g.roundRect(m, m, w, w, r); g.fillStyle = gl; g.fill();
  g.textBaseline = 'middle'; g.textAlign = 'center';
  if (size <= 24) {
    // Winzig: nur ein dickes C und ein Minus
    g.fillStyle = '#fff'; g.font = '900 ' + 190 * s + 'px Segoe UI, Arial';
    g.fillText('C', 112 * s, 136 * s);
    g.fillStyle = '#ff5fa2'; g.fillRect(170 * s, 118 * s, 60 * s, 30 * s);
    return cv.toDataURL('image/png');
  }
  g.fillStyle = '#fff';
  g.font = '900 ' + 150 * s + 'px Segoe UI, Arial';
  g.fillText('C', 92 * s, 118 * s);
  // die zwei Minus in Pink
  g.fillStyle = '#ff5fa2';
  const bw = 38 * s, bh = 20 * s, by = 108 * s;
  for (const x of [150, 198]) { g.beginPath(); g.roundRect(x * s, by, bw, bh, 6 * s); g.fill(); }
  // Terminal-Prompt unten
  g.font = '700 ' + 44 * s + 'px Cascadia Mono, Consolas, monospace';
  g.textAlign = 'left';
  g.fillStyle = '#9ee493'; g.fillText('>', 52 * s, 200 * s);
  g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(84 * s, 214 * s, 34 * s, 7 * s);
  return cv.toDataURL('image/png');
}`;

// ICO-Datei mit eingebetteten PNGs
function ico(pngs) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  const dir = Buffer.alloc(16 * pngs.length);
  let off = 6 + dir.length;
  pngs.forEach(({ size, buf }, i) => {
    const o = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, o);
    dir.writeUInt8(size >= 256 ? 0 : size, o + 1);
    dir.writeUInt8(0, o + 2); dir.writeUInt8(0, o + 3);
    dir.writeUInt16LE(1, o + 4); dir.writeUInt16LE(32, o + 6);
    dir.writeUInt32LE(buf.length, o + 8); dir.writeUInt32LE(off, o + 12);
    off += buf.length;
  });
  return Buffer.concat([head, dir, ...pngs.map((p) => p.buf)]);
}

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, webPreferences: { offscreen: true } });
  await win.loadURL('data:text/html,<meta charset=utf-8><body>');
  await win.webContents.executeJavaScript('document.fonts.ready');
  const render = async (size) => Buffer.from((await win.webContents.executeJavaScript(`(${draw})(${size})`)).split(',')[1], 'base64');
  const root = path.join(__dirname, '..');
  const pngs = [];
  for (const size of SIZES) pngs.push({ size, buf: await render(size) });
  fs.writeFileSync(path.join(__dirname, 'icon.ico'), ico(pngs));
  const big = await render(512);
  fs.writeFileSync(path.join(__dirname, 'icon.png'), big);
  fs.writeFileSync(path.join(root, 'ide', 'icon.png'), await render(256));
  console.log('Icon geschrieben');
  app.quit();
});
