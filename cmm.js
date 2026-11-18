#!/usr/bin/env node
// C-- : die Programmiersprache, die weniger kann als C++. Absichtlich.
//   node cmm.js            -> interaktive Konsole
//   node cmm.js datei.cmm  -> Datei ausführen
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const CMM = require('./core.js');

// ---------- Eingabe (für (ask) und die Konsole) ----------
let rl = null;
const lineQueue = [];
let lineWaiter = null;
let inputClosed = false;
function startInput() {
  rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  rl.on('line', (l) => { if (lineWaiter) { const w = lineWaiter; lineWaiter = null; w(l); } else lineQueue.push(l); });
  rl.on('close', () => { inputClosed = true; if (lineWaiter) { const w = lineWaiter; lineWaiter = null; w(null); } });
}
function readLine(prompt) {
  if (!rl) startInput();
  process.stdout.write(prompt);
  const echo = (l) => { if (!process.stdin.isTTY && l != null) process.stdout.write(l + '\n'); return l; };
  if (lineQueue.length) return Promise.resolve(echo(lineQueue.shift()));
  if (inputClosed) return Promise.resolve(null);
  return new Promise((r) => { lineWaiter = (l) => r(echo(l)); });
}

const cmm = CMM.create({
  write: (s) => process.stdout.write(s),
  readLine,
  clear: () => process.stdout.write('\x1b[2J\x1b[H'),
  exit: () => process.exit(0),
});

async function main() {
  const file = process.argv[2];
  if (file) {
    if (!fs.existsSync(file)) { console.log(`Datei „${file}“ gibt es nicht. Vielleicht hat sie bugs=none zu ernst genommen.`); process.exit(1); }
    const r = await cmm.runProgram(fs.readFileSync(file, 'utf8'), path.basename(file));
    if (rl) rl.close();
    process.exit(r.ok ? 0 : 1);
  }
  cmm.banner();
  for (;;) {
    const line = await readLine(cmm.prompt);
    if (line == null) { console.log(''); break; }
    await cmm.runLine(line);
  }
  if (rl) rl.close();
}
main();
