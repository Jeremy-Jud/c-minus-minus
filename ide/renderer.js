// C-- Studio: Editor, Terminal und alles dazwischen
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem('studio.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem('studio.' + k, JSON.stringify(v)); } catch {} },
  };

  // ================= Beispiele =================
  const EXAMPLES = {
    'Hallo Welt': `-- Mein erstes C---Programm: einfach hinschreiben!
hallo welt
bugs=none

name = frag Wie heisst du?
hallo name, schön dass du da bist!

alter = frag Wie alt bist du?
rest = 18 - alter
wenn alter > 17 dann Du darfst Auto fahren 🚗 sonst Noch rest Jahre bis zum Führerschein

3x Zähle i
kaffee
witz
`,
    'Rechner': `-- Ein Taschenrechner, der fast immer recht hat
zahl1 = frag Erste Zahl?
zahl2 = frag Zweite Zahl?
summe = zahl1 + zahl2
mal = zahl1 * zahl2
Summe: summe
Mal: mal
wenn zahl2 = 0 dann Durch 0 teile ich nicht. Ich hab Angst. sonst zahl1 / zahl2
`,
    'Knöpfe': `-- Knöpfe: im Terminal anklicken
Klick mal auf die Knöpfe!
knopf1 = delete
knopf2 = konfetti
knopf3 = witz
knopf4 = würfel
knopf5 = zeit
`,
    'Countdown': `-- Countdown (i zählt 1, 2, 3 …)
start = 5
5x start - i + 1
🚀 Abflug!
konfetti
`,
    'Troll-Show': `-- Alles, was C-- besonders macht
Willkommen zur Troll-Show
bugs=features
3x kaffee
hack
münze
witz
konfetti
tschüss
Das hier sieht niemand mehr.
`,
  };

  const SNIPPETS = [
    ['Los geht’s', [
      ['hallo welt', 'zeigt „hallo welt“'],
      ['hallo name', 'Variablen im Text werden ersetzt'],
      ['-- Kommentar', 'wird ignoriert'],
    ]],
    ['Variablen & Rechnen', [
      ['zahl1 = 5', 'Variable anlegen'],
      ['zahl1 + zahl2', 'rechnen: + - * / %'],
      ['summe = zahl1 + zahl2', 'Ergebnis merken'],
      ['zahl1--', 'minus 1 (das Markenzeichen)'],
    ]],
    ['Fragen', [
      ['name = frag Wie heisst du?', 'fragt im Terminal nach'],
    ]],
    ['Knöpfe', [
      ['knopf1 = delete', 'Klick löscht alles'],
      ['knopf2 = konfetti', 'Klick macht Konfetti'],
      ['knopf3 = hallo name', 'Klick zeigt Text'],
    ]],
    ['Wiederholen & Wenn', [
      ['3x hallo', '3× wiederholen, i zählt mit'],
      ['wenn zahl1 > 3 dann gross sonst klein', 'wenn … dann … sonst'],
      ['wenn zahl1 > zahl2 schreibe ja falls nicht schreibe nein', 'geht auch als normaler Satz'],
    ]],
    ['🤖 KI (irgendwas eingeben)', [
      ['ki mach 3 knöpfe mit witzen', 'KI macht Code daraus und führt ihn aus'],
      ['ki rechne 17 mal 23 und sag ob das viel ist', 'rechnen mit Kommentar'],
      ['ki schreib die hauptstadt von japan', 'zeigt nur das Ergebnis'],
    ]],
    ['Spass', [
      ['bugs=none', 'alle Bugs entfernen'],
      ['konfetti', '🎉'],
      ['witz', 'Programmierer-Witz'],
      ['würfel', 'Würfel 1–6'],
      ['kaffee', 'Produktivität +100 %'],
      ['hack', 'sehr echtes Hacken'],
      ['delete', 'Terminal leeren'],
      ['tschüss', 'Programm beenden'],
    ]],
  ];

  // ================= Terminal =================
  const term = $('term');
  let cur = null; // aktuelle Zeile
  const newLine = () => { cur = el('div', 'tl'); term.appendChild(cur); };
  newLine();
  const ANSI = { 0: null, 1: 'a-bold', 2: 'a-dim', 31: 'a-red', 32: 'a-green', 33: 'a-yellow', 34: 'a-blue', 35: 'a-magenta', 36: 'a-cyan', 90: 'a-gray' };
  let style = [];
  const scrollDown = () => { term.scrollTop = term.scrollHeight; };
  function write(text) {
    for (const part of String(text).split(/(\x1b\[[0-9;]*m|\r|\n)/)) {
      if (!part) continue;
      if (part === '\n') { newLine(); continue; }
      if (part === '\r') { cur.replaceChildren(); continue; } // Wagenrücklauf: Zeile neu schreiben (Ladebalken)
      const m = /^\x1b\[([0-9;]*)m$/.exec(part);
      if (m) {
        for (const code of m[1].split(';').map(Number)) {
          if (!code) style = [];
          else if (ANSI[code]) style = style.filter((s) => !(s.startsWith('a-') && ANSI[code].startsWith('a-') && s !== 'a-bold' && s !== 'a-dim' && ANSI[code] !== 'a-bold' && ANSI[code] !== 'a-dim')).concat(ANSI[code]);
        }
        continue;
      }
      if (style.length) cur.appendChild(el('span', style.join(' '), part));
      else cur.appendChild(document.createTextNode(part));
    }
    // nicht unendlich wachsen
    while (term.childElementCount > 2000) term.firstElementChild.remove();
    scrollDown();
  }
  function clearTerm() { term.replaceChildren(); newLine(); }

  // Eingabe im Terminal (für die Konsole und für (ask))
  let pending = null;
  const history = store.get('history', []);
  function prompt(p) {
    write(p);
    const inp = document.createElement('input');
    inp.spellcheck = false;
    inp.setAttribute('aria-label', 'Eingabe');
    cur.appendChild(inp);
    scrollDown();
    inp.focus({ preventScroll: true });
    let h = history.length;
    return new Promise((resolve) => {
      pending = { resolve, inp, line: cur };
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const v = inp.value;
          inp.remove();
          pending = null;
          write(v + '\n');
          if (v.trim() && history[history.length - 1] !== v) { history.push(v); if (history.length > 100) history.shift(); store.set('history', history); }
          resolve(v);
        } else if (e.key === 'ArrowUp' && history.length) {
          e.preventDefault(); h = Math.max(0, h - 1); inp.value = history[h];
        } else if (e.key === 'ArrowDown') {
          e.preventDefault(); h = Math.min(history.length, h + 1); inp.value = history[h] || '';
        }
      });
    });
  }
  function cancelPrompt(dropLine) {
    if (!pending) return;
    const p = pending;
    pending = null;
    p.inp.remove();
    if (dropLine) { p.line.replaceChildren(); } else write('\n');
    p.resolve(null);
  }
  term.addEventListener('mouseup', () => { if (pending && !window.getSelection().toString()) pending.inp.focus(); });

  const EXIT = new Error('exit');
  let stopFlag = false;
  const io = {
    write,
    readLine: prompt,
    clear: clearTerm,
    exit: () => { throw EXIT; },
    // ki <Wunsch> → Hauptprozess fragt Claude (der Schlüssel bleibt dort)
    ai: async (wish, vars) => {
      const r = await window.studio.aiAsk(wish, vars);
      if (r && r.needKey) setTimeout(openAI, 300);
      return r;
    },
    aiKeyHint: '   Oben auf „🤖 KI“ klicken und deinen API-Schlüssel eintragen.',
    // knopf1 = delete → echter Knopf im Terminal
    button: (label, action) => {
      const b = el('button', 'term-btn', label);
      b.type = 'button';
      b.onclick = () => clickButton(action);
      cur.appendChild(b);
      newLine();
      scrollDown();
    },
    stopped: () => stopFlag,
  };

  // ================= Editor =================
  const src = $('src'), hl = $('hl'), gutter = $('gutter');
  const repl = CMM.create({ ...io, stopped: () => false });
  const FUNCS = new Set(repl.funcs);
  const MAGIC = new Set(['helloworld', 'bugs', 'none', 'features', 'jap', 'nope', 'true', 'false', 'sudo',
    'ki', 'wenn', 'dann', 'sonst', 'frag', 'frage', 'delete', 'löschen', 'konfetti', 'witz', 'würfel', 'münze', 'zeit', 'uhr', 'datum', 'kaffee', 'hack', 'hilfe', 'tschüss']);
  const esc = (s) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]));
  const TOKEN = /("[^"]*"?|'[^']*'?)|(\(\s*\d+x\s*\))|(\(\s*[A-Za-zÄÖÜäöüß_]\w*\s*\))|(\d+(?:\.\d+)?)|([A-Za-zÄÖÜäöüß_][\wÄÖÜäöüß]*)|(==|!=|>=|<=|\+\+|--|[-+*/%=?:<>])|(;)/g;
  function hiLine(line) {
    const t = line.trimStart();
    if (t.startsWith('--')) return `<span class="t-comment">${esc(line)}</span>`;
    let html = '', last = 0;
    line.replace(TOKEN, (m, str, rep, call, num, word, op, semi, i) => {
      html += esc(line.slice(last, i));
      last = i + m.length;
      let cls = '';
      if (str) cls = 't-string';
      else if (rep) cls = 't-repeat';
      else if (call) cls = FUNCS.has(m.replace(/[()\s]/g, '')) ? 't-func' : '';
      else if (num) cls = 't-number';
      else if (word) cls = /^(knopf|button)/i.test(word) ? 't-knopf' : MAGIC.has(word.toLowerCase()) ? 't-magic' : '';
      else if (op) cls = 't-op';
      else if (semi) cls = 't-bad';
      html += cls ? `<span class="${cls}">${esc(m)}</span>` : esc(m);
      return m;
    });
    return html + esc(line.slice(last));
  }
  let errLine = 0;
  function paint() {
    const lines = src.value.split('\n');
    hl.innerHTML = lines.map((l, i) => `<span class="ln${i + 1 === errLine ? ' err' : ''}">${hiLine(l) || ' '}</span>`).join('');
    const curRow = src.value.slice(0, src.selectionStart).split('\n').length;
    gutter.innerHTML = lines.map((_, i) => `<div class="${i + 1 === errLine ? 'err' : i + 1 === curRow ? 'cur' : ''}">${i + 1}</div>`).join('');
    sync();
  }
  function sync() { hl.scrollTop = src.scrollTop; hl.scrollLeft = src.scrollLeft; gutter.scrollTop = src.scrollTop; }
  function caretInfo() {
    const before = src.value.slice(0, src.selectionStart).split('\n');
    $('stPos').textContent = `Z ${before.length}, S ${before[before.length - 1].length + 1}`;
    [...gutter.children].forEach((d, i) => { if (!d.classList.contains('err')) d.className = i + 1 === before.length ? 'cur' : ''; });
  }
  src.addEventListener('scroll', sync);
  src.addEventListener('input', () => { errLine = 0; document.body.classList.remove('failed'); paint(); setDirty(true); saveDraft(); });
  ['keyup', 'click', 'select'].forEach((ev) => src.addEventListener(ev, caretInfo));
  // Text an der Markierung ersetzen, mit Rückgängig-Unterstützung
  const insert = (text) => { src.focus(); document.execCommand('insertText', false, text); };
  src.addEventListener('keydown', (e) => {
    if (e.key === 'Tab' && !e.ctrlKey) { e.preventDefault(); insert('  '); }
    else if (e.key === '/' && e.ctrlKey) { e.preventDefault(); toggleComment(); }
  });
  function toggleComment() {
    const v = src.value, a = v.lastIndexOf('\n', src.selectionStart - 1) + 1;
    let b = v.indexOf('\n', src.selectionEnd); if (b < 0) b = v.length;
    const block = v.slice(a, b).split('\n');
    const all = block.every((l) => !l.trim() || l.trimStart().startsWith('--'));
    const next = block.map((l) => (!l.trim() ? l : all ? l.replace(/^(\s*)-- ?/, '$1') : '-- ' + l)).join('\n');
    src.setSelectionRange(a, b);
    insert(next);
    src.setSelectionRange(a, a + next.length);
  }

  // ================= Dateien =================
  let file = { path: null, name: 'unbenannt.cmm' };
  let dirty = false;
  function setDirty(v) {
    dirty = v;
    $('tabDirty').classList.toggle('hidden', !v);
    window.studio.setDirty(v);
    window.studio.setTitle(`${file.name}${v ? ' ●' : ''} – C-- Studio`);
  }
  function setFile(f) { file = f; $('tabName').textContent = f.name; setDirty(dirty); }
  const saveDraft = () => store.set('draft', { text: src.value, path: file.path, name: file.name, dirty });
  function load(text, f, isDirty) {
    src.value = text;
    errLine = 0;
    setFile(f);
    setDirty(!!isDirty);
    src.setSelectionRange(0, 0);
    src.scrollTop = 0;
    paint(); caretInfo(); saveDraft();
  }
  const okToDiscard = () => !dirty || window.confirm('Ungespeicherte Änderungen gehen verloren. Weiter?');
  async function save(as) {
    const r = await window.studio.save(file.path, src.value, as);
    if (!r) return false;
    setFile({ path: r.path, name: r.name });
    setDirty(false); saveDraft();
    status(`💾 Gespeichert: ${r.name}`);
    return true;
  }
  async function open() {
    if (!okToDiscard()) return;
    const r = await window.studio.open();
    if (!r) return;
    if (r.error) { status(r.error); return; }
    load(r.text, { path: r.path, name: r.name }, false);
    status(`📂 Geöffnet: ${r.name}`);
  }
  function newFile() {
    if (!okToDiscard()) return;
    load('-- Neues Programm\n', { path: null, name: 'unbenannt.cmm' }, false);
  }

  // ================= Ausführen =================
  let running = false, runDone = null;
  function status(text) { $('stState').textContent = text; }
  function updateCounters(st) {
    const b = st.bugs;
    $('stBugs').textContent = b === 'none' || b === 0 ? '🐛 Bugs: none ✅' : b === 'features' ? '✨ Bugs: Features' : `🐛 Bugs: ${b}`;
    $('stCoffee').textContent = '☕ ' + st.coffee;
  }
  async function run() {
    if (running) return;
    running = true; stopFlag = false;
    let finish; runDone = new Promise((r) => { finish = r; });
    cancelPrompt(true);
    errLine = 0; paint();
    document.body.classList.remove('failed');
    document.body.classList.add('running');
    $('bRun').disabled = true; $('bStop').disabled = false;
    status(`▶ ${file.name} läuft …`);
    write(`\x1b[90m> C-- ${file.name}\x1b[0m\n`);
    const cmm = CMM.create(io);
    const t0 = performance.now();
    let res;
    try { res = await cmm.runProgram(src.value, ''); }
    catch (e) {
      if (e === EXIT) res = { ok: true, line: 0 };
      else { write(`\x1b[31m💥 Interner Fehler: ${e.message}. Das war wirklich nicht deine Schuld.\x1b[0m\n`); res = { ok: false, line: 0 }; }
    }
    const secs = ((performance.now() - t0) / 1000).toFixed(2);
    document.body.classList.remove('running');
    updateCounters(cmm.state);
    if (stopFlag) status('⏹ Gestoppt');
    else if (!res.ok) {
      errLine = res.line; paint();
      document.body.classList.add('failed');
      status(`💥 Fehler in Zeile ${res.line}`);
      if (res.line) { const pos = src.value.split('\n').slice(0, res.line - 1).join('\n').length + (res.line > 1 ? 1 : 0); src.focus(); src.setSelectionRange(pos, pos); caretInfo(); }
    } else status(`✓ Fertig in ${secs} s. ${troll(['Keine Fehler. Verdächtig.', 'Läuft. Frag nicht warum.', 'Kompiliert. Also, nicht wirklich, aber egal.', 'Perfekt. Wie immer.'])}`);
    write('\n');
    $('bRun').disabled = false; $('bStop').disabled = true;
    running = false;
    finish();
  }
  function stop() {
    if (!running) return;
    stopFlag = true;
    cancelPrompt(false);
    status('⏹ Stoppe …');
  }
  const troll = (a) => a[Math.floor(Math.random() * a.length)];

  // Konsole: läuft immer, wenn kein Programm läuft
  // Klick auf einen Knopf im Terminal: Aktion ausführen (nicht während ein Programm läuft)
  async function clickButton(action) {
    if (running) { status('⏳ Erst warten, bis das Programm fertig ist.'); return; }
    running = true; stopFlag = false;
    let finish; runDone = new Promise((r) => { finish = r; });
    cancelPrompt(true);
    try { await action(); }
    catch (e) { if (e !== EXIT) write(`\x1b[31m💥 ${e.message}\x1b[0m\n`); }
    running = false;
    finish();
  }

  async function replLoop() {
    for (;;) {
      if (running) { await runDone; continue; }
      const line = await prompt(repl.prompt);
      if (line == null) continue;
      try { await repl.runLine(line); }
      catch (e) {
        if (e === EXIT) write('\x1b[90m(exit(please) beendet hier nur Programme. Das Studio bleibt. Für immer.)\x1b[0m\n');
        else write(`\x1b[31m💥 ${e.message}\x1b[0m\n`);
      }
      updateCounters(repl.state);
    }
  }

  // ================= Oberfläche =================
  const exSel = $('examples');
  Object.keys(EXAMPLES).forEach((k) => exSel.appendChild(new Option(k, k)));
  exSel.onchange = () => {
    const k = exSel.value; exSel.value = '';
    if (!k || !okToDiscard()) return;
    load(EXAMPLES[k], { path: null, name: k.toLowerCase().replace(/[^a-z0-9äöüß]+/g, '-') + '.cmm' }, true);
  };
  const side = $('side');
  for (const [title, items] of SNIPPETS) {
    side.appendChild(el('h3', '', title));
    for (const [code, desc] of items) {
      const b = el('button', 'snip');
      b.type = 'button';
      b.append(el('code', '', code), el('span', '', desc));
      b.onclick = () => {
        const v = src.value, at = src.selectionStart;
        const lineStart = v.lastIndexOf('\n', at - 1) + 1;
        const empty = !v.slice(lineStart, at).trim() && !(v.slice(at).split('\n')[0] || '').trim();
        insert((empty ? '' : '\n') + code);
      };
      side.appendChild(b);
    }
  }
  if (store.get('sideHidden', false)) side.classList.add('hidden');
  const toggleSide = () => { side.classList.toggle('hidden'); store.set('sideHidden', side.classList.contains('hidden')); };

  $('bNew').onclick = newFile;
  $('bOpen').onclick = open;
  $('bSave').onclick = () => save(false);
  $('bRun').onclick = run;
  $('bStop').onclick = stop;
  $('bHelp').onclick = toggleSide;
  $('bClear').onclick = () => {
    if (!running) { cancelPrompt(true); clearTerm(); return; } // Konsole zeigt gleich wieder ein neues Prompt
    const p = pending;
    clearTerm();
    if (p) { p.line = cur; cur.appendChild(p.inp); p.inp.focus(); } // (ask) wartet noch: Eingabefeld behalten
  };
  $('bBugs').onclick = () => {
    if (!/^\s*bugs\s*=\s*none\s*$/m.test(src.value)) {
      src.focus(); src.setSelectionRange(0, 0); insert('bugs=none\n');
    }
    status(troll(['🐛 Alle Bugs entfernt. 3 neue sind schon unterwegs.', '🐛 Bugs entfernt. Die Features leider auch.', '🐛 Fertig. Dein Code ist jetzt offiziell perfekt.']));
  };
  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (e.key === 'F5' && e.shiftKey) { e.preventDefault(); stop(); }
    else if (e.key === 'F5') { e.preventDefault(); run(); }
    else if (e.key === 'F1') { e.preventDefault(); toggleSide(); }
    else if (e.ctrlKey && k === 's') { e.preventDefault(); save(e.shiftKey); }
    else if (e.ctrlKey && k === 'o') { e.preventDefault(); open(); }
    else if (e.ctrlKey && k === 'n') { e.preventDefault(); newFile(); }
    else if (e.ctrlKey && k === 'c' && running && document.activeElement && document.activeElement.closest('#term')) { e.preventDefault(); stop(); }
  });

  // Terminal-Höhe ziehen
  const rs = $('resizer'), tw = $('termWrap');
  tw.style.height = store.get('termH', 280) + 'px';
  rs.addEventListener('pointerdown', (e) => {
    rs.setPointerCapture(e.pointerId); rs.classList.add('drag');
    const startY = e.clientY, startH = tw.offsetHeight;
    const move = (ev) => { tw.style.height = Math.max(90, Math.min(window.innerHeight - 220, startH - (ev.clientY - startY))) + 'px'; };
    const up = () => { rs.removeEventListener('pointermove', move); rs.classList.remove('drag'); store.set('termH', tw.offsetHeight); };
    rs.addEventListener('pointermove', move);
    rs.addEventListener('pointerup', up, { once: true });
  });

  // Statusleiste: wechselnde Sprüche
  const TROLLS = ['Kompiliere nichts …', 'C++ wurde nicht gefunden. Gut so.', 'Tipp: bugs=none löst alles.', 'Zähle Bugs … Abbruch bei 999.', 'Kaffeestand wird überwacht.', 'Semikolons werden gejagt.', 'Indexiere nichts. Mit Hingabe.'];
  const rotate = () => { $('stTroll').textContent = troll(TROLLS); };
  rotate(); setInterval(rotate, 9000);

  // ================= KI-Dialog =================
  const aiDlg = $('aiDlg'), aiKey = $('aiKey'), aiMsg = $('aiMsg');
  const aiState = async () => { const has = await window.studio.aiHasKey(); $('bAI').classList.toggle('on', has); $('bAI').textContent = has ? '🤖 KI ✓' : '🤖 KI'; return has; };
  async function openAI() {
    if (aiDlg.open) return;
    const has = await aiState();
    aiKey.value = '';
    aiMsg.className = 'dlg-msg';
    aiMsg.textContent = has ? '✓ Ein Schlüssel ist gespeichert. Du kannst ihn ersetzen oder entfernen.' : '';
    aiDlg.showModal();
    aiKey.focus();
  }
  $('bAI').onclick = openAI;
  $('aiCancel').onclick = () => aiDlg.close();
  $('aiSave').onclick = async () => {
    if (!aiKey.value.trim()) { aiMsg.className = 'dlg-msg err'; aiMsg.textContent = 'Bitte zuerst einen Schlüssel einfügen.'; return; }
    const r = await window.studio.aiSetKey(aiKey.value);
    aiKey.value = '';
    if (!r.ok) { aiMsg.className = 'dlg-msg err'; aiMsg.textContent = r.error; return; }
    await aiState();
    aiMsg.className = 'dlg-msg ok'; aiMsg.textContent = '✓ Gespeichert. Probier im Terminal: ki erzähl mir einen witz';
    setTimeout(() => { if (aiDlg.open) aiDlg.close(); }, 1400);
  };
  aiKey.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('aiSave').click(); } });
  $('aiRemove').onclick = async () => {
    await window.studio.aiSetKey('');
    await aiState();
    aiMsg.className = 'dlg-msg ok'; aiMsg.textContent = 'Schlüssel entfernt.';
  };
  aiDlg.addEventListener('close', () => { if (pending) pending.inp.focus(); });
  aiState();

  // ================= Updates =================
  const stVer = $('stVer'), stUpd = $('stUpd');
  let manualCheck = false;
  window.studio.version().then((v) => { stVer.textContent = `C-- Studio ${v}`; });
  function showUpdate(s) {
    stUpd.className = 'st-upd hidden';
    stUpd.onclick = null;
    if (s.state === 'downloading') {
      stUpd.className = 'st-upd';
      stUpd.textContent = `⬇ Update ${s.version || ''} wird geladen … ${s.percent || 0} %`;
    } else if (s.state === 'ready') {
      stUpd.className = 'st-upd ready';
      stUpd.textContent = `🎁 Update ${s.version} bereit – neu starten`;
      stUpd.title = 'Jetzt installieren. Dein Code bleibt erhalten.';
      stUpd.onclick = () => { saveDraft(); window.studio.installUpdate(); };
      if (manualCheck || !stUpd.dataset.told) {
        stUpd.dataset.told = '1';
        write(`\x1b[32m🎁 C-- Studio ${s.version} ist da. Neue Bugs, äh, Features! Klick unten rechts auf „neu starten“.\x1b[0m\n`);
      }
    }
    if (!manualCheck) return;
    if (s.state === 'none') { status('✓ Du hast die neueste Version. Mehr Bugs gibt es noch nicht.'); manualCheck = false; }
    else if (s.state === 'error') {
      status(s.reason === 'offline' ? '📡 Kein Internet. Updates müssen warten.' : s.reason === 'notfound' ? '🔒 Kein Update gefunden (Repo privat oder noch kein Release).' : '⚠️ Update-Suche fehlgeschlagen.');
      manualCheck = false;
    } else if (s.state === 'dev') { status('🛠️ Entwicklerversion: Updates gibt es nur in der installierten App.'); manualCheck = false; }
    else if (s.state === 'checking') status('🔎 Suche nach Updates …');
    else if (s.state === 'ready' || s.state === 'downloading') manualCheck = false;
  }
  window.studio.onUpdate(showUpdate);
  window.studio.updateState().then(showUpdate);
  stVer.onclick = async () => { manualCheck = true; status('🔎 Suche nach Updates …'); showUpdate(await window.studio.checkUpdate()); };

  // Datei per Doppelklick im Explorer geöffnet
  window.studio.onOpenFile((f) => {
    if (!f || !okToDiscard()) return;
    load(f.text, { path: f.path, name: f.name }, false);
    status(`📂 Geöffnet: ${f.name}`);
  });

  // Start
  const draft = store.get('draft', null);
  if (draft && typeof draft.text === 'string') load(draft.text, { path: draft.path || null, name: draft.name || 'unbenannt.cmm' }, !!draft.dirty);
  else load(EXAMPLES['Hallo Welt'], { path: null, name: 'hallo.cmm' }, false);
  repl.banner();
  write('\x1b[90mF5 = Ausführen · Umschalt+F5 = Stopp · F1 = Spickzettel\x1b[0m\n\n');
  replLoop();
  src.focus();
})();
