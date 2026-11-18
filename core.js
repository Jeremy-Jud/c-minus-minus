// C-- Interpreter. Läuft in Node (Konsole) und im Browser (IDE).
// io = { write(text), readLine(prompt) -> Promise<string|null>, clear(), exit(), stopped() }
(function (root) {
  'use strict';
  const VERSION = '1.0 (Codename: „Warum?“)';
  const c = {
    reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gray: '\x1b[90m',
  };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  class StopSignal extends Error {}

  function create(io) {
  const out = (s = '') => { state.printed = true; io.write(s + '\n'); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Fehler mit Humor ----------
  class CmmError extends Error {}
  const ROASTS = [
    'Das ist nicht C--, das ist C+-.',
    'Selbst C++ hätte das nicht verstanden.',
    'Hast du es mal mit Aus- und wieder Einschalten versucht?',
    'Der Compiler ist gerade in der Kaffeepause.',
    'Tipp: bugs=none hilft fast immer.',
    'Das funktioniert auf meinem Rechner auch nicht.',
  ];
  const fail = (msg) => { throw new CmmError(msg); };

  // ---------- Zustand ----------
  const vars = Object.create(null);
  const state = { bugs: 'viele', coffee: 0, printed: false };

  // ---------- Funktionen: Wert(funktion) ----------
  const show = (v) => (v === undefined || v === null ? 'nichts' : typeof v === 'boolean' ? (v ? 'jap' : 'nope') : String(v));
  const FUNCS = {
    print(v) { out(show(v)); return v; },
    yell(v) { out(c.bold + show(v).toUpperCase() + '!!!' + c.reset); return v; },
    whisper(v) { out(c.dim + show(v).toLowerCase() + ' …' + c.reset); return v; },
    rainbow(v) {
      const cols = [c.red, c.yellow, c.green, c.cyan, c.blue, c.magenta];
      out([...show(v)].map((ch, i) => cols[i % cols.length] + ch).join('') + c.reset);
      return v;
    },
    upper: (v) => show(v).toUpperCase(),
    lower: (v) => show(v).toLowerCase(),
    reverse: (v) => (typeof v === 'number' ? Number([...String(v)].reverse().join('')) || 0 : [...show(v)].reverse().join('')),
    length: (v) => [...show(v)].length,
    double: (v) => (typeof v === 'number' ? v * 2 : show(v) + show(v)),
    square: (v) => num(v, 'square') ** 2,
    half: (v) => num(v, 'half') / 2,
    dice: (v) => 1 + Math.floor(Math.random() * (typeof v === 'number' && v > 1 ? v : 6)),
    coin: () => pick(['Kopf', 'Zahl']),
    meaning: () => 42,
    async ask(v) {
      const a = await io.readLine(c.cyan + (v == null ? '?' : show(v)) + ' ' + c.reset);
      if (a == null) return '';
      return a.trim() !== '' && !isNaN(Number(a)) ? Number(a) : a;
    },
    async sleep(v) {
      const s = typeof v === 'number' ? v : 1;
      out(c.gray + `💤 schlafe ${s} Sekunde${s === 1 ? '' : 'n'} …` + c.reset);
      await sleep(Math.min(s, 10) * 1000);
      return v;
    },
    drink(v) {
      if (show(v).toLowerCase() !== 'coffee' && show(v).toLowerCase() !== 'kaffee') { out(`🥤 ${show(v)} getrunken. Schmeckt nach nichts.`); return v; }
      state.coffee++;
      out(`☕ Kaffee Nr. ${state.coffee} getrunken. Produktivität +${state.coffee * 100} %` + (state.coffee >= 4 ? c.red + ' – Hände zittern.' + c.reset : ''));
      return state.coffee;
    },
    async hack(v) {
      const target = v == null ? 'NASA' : show(v);
      out(c.green + `> Verbinde mit ${target} …` + c.reset);
      for (let p = 0; p <= 100; p += 20) {
        io.write(`\r${c.green}[${'█'.repeat(p / 5).padEnd(20, '░')}] ${p} %${c.reset}`);
        await sleep(250);
      }
      out('');
      out(c.green + pick([`> Zugriff auf ${target} erhalten. Gefunden: 3 Katzenbilder und ein Passwort: 1234`, `> ${target} gehackt. Haha, nein. Das ist nur Text.`, `> Firewall von ${target}: „Nö.“`]) + c.reset);
      return v;
    },
    delete(v) {
      if (show(v).toLowerCase() === 'bugs') { setBugs('none'); return 'none'; }
      out(c.gray + `🗑️  ${show(v)} wurde gelöscht. (Nicht wirklich.)` + c.reset);
      return null;
    },
    fix(v) {
      out(c.green + `🔧 ${show(v)} repariert.` + c.reset + c.gray + ' (Es war vorher auch nicht kaputt.)' + c.reset);
      return v;
    },
    me(v) { // help(me)
      if (show(v) === 'help') return showHelp();
      out(`👋 Du bist ${show(v)}.`);
      return v;
    },
    please(v) { // exit(please)
      if (show(v) === 'exit') { out(c.green + 'Danke, dass du höflich warst. Tschüss! 👋' + c.reset); io.exit(); }
      out('Bitte gern geschehen.');
      return v;
    },
    screen(v) { // clear(screen)
      if (show(v) === 'clear') { io.clear(); return null; }
      return v;
    },
  };
  const num = (v, f) => { if (typeof v !== 'number') fail(`(${f}) braucht eine Zahl, nicht „${show(v)}“.`); return v; };
  const isFunc = (name) => Object.hasOwn(FUNCS, name);

  function setBugs(v) {
    state.bugs = v;
    if (v === 'none' || v === 0) out(c.green + '🐛 → 💀  Alle Bugs entfernt. Dein Code ist jetzt perfekt.' + c.reset + c.gray + ' (Garantie: keine.)' + c.reset);
    else if (v === 'features') out(c.yellow + '✨ Alle Bugs heissen ab jetzt Features. Problem gelöst.' + c.reset);
    else out(c.red + `🐛 bugs = ${show(v)}. Mutig.` + c.reset);
  }

  // ---------- Ausdrücke ----------
  // Grundidee: der Wert kommt zuerst, die Funktion danach in Klammern: "hallo"(print)
  // Unbekannte Wörter sind einfach Text: hallo(print) gibt „hallo“ aus.
  function tokenize(src) {
    const t = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '"' || ch === "'") {
        let j = i + 1, s = '';
        while (j < src.length && src[j] !== ch) s += src[j++];
        if (j >= src.length) fail('Da fehlt ein Anführungszeichen. Ich hab gewartet, aber es kam keins.');
        t.push({ k: 'str', v: s }); i = j + 1; continue;
      }
      const n = /^\d+(?:\.\d+)?/.exec(src.slice(i));
      if (n) { t.push({ k: 'num', v: Number(n[0]) }); i += n[0].length; continue; }
      const w = /^[A-Za-zÄÖÜäöüß_][\wÄÖÜäöüß]*/.exec(src.slice(i));
      if (w) { t.push({ k: 'id', v: w[0] }); i += w[0].length; continue; }
      const op = /^(==|!=|>=|<=|[-+*/%()<>])/.exec(src.slice(i));
      if (op) { t.push({ k: 'op', v: op[0] }); i += op[0].length; continue; }
      fail(`Was soll „${ch}“ sein? ` + pick(ROASTS));
    }
    return t;
  }
  async function evaluate(src) {
    const t = tokenize(src);
    let p = 0;
    const peek = (o = 0) => t[p + o];
    const isOp = (v, o = 0) => peek(o) && peek(o).k === 'op' && peek(o).v === v;
    // ( name ) direkt hintereinander und name ist eine Funktion
    const isCall = () => isOp('(') && peek(1) && peek(1).k === 'id' && isFunc(peek(1).v) && isOp(')', 2);
    async function primary() {
      const tk = t[p++];
      if (!tk) fail('Da fehlt was am Ende. Ich bin ja kein Hellseher.');
      if (tk.k === 'num' || tk.k === 'str') return tk.v;
      if (tk.k === 'id') {
        if (tk.v in vars) return vars[tk.v];
        if (tk.v === 'helloworld') return 'Hello, World!';
        if (tk.v === 'jap' || tk.v === 'true') return true;
        if (tk.v === 'nope' || tk.v === 'false') return false;
        if (tk.v === 'bugs') return state.bugs;
        return tk.v; // unbekanntes Wort = Text
      }
      if (tk.v === '(') {
        p--;
        if (isCall()) { const f = peek(1).v; p += 3; return FUNCS[f](undefined); } // (ask) ohne Wert davor
        p++;
        const v = await cmp();
        if (!isOp(')')) fail('Klammer auf, aber nie wieder zu. Wie ein Tab im Browser.');
        p++;
        return v;
      }
      fail(`„${tk.v}“ hier? ` + pick(ROASTS));
    }
    async function postfix() {
      let v = await primary();
      while (isCall()) { const f = peek(1).v; p += 3; v = await FUNCS[f](v); }
      return v;
    }
    async function unary() {
      if (isOp('-')) { p++; return -num(await unary(), '-'); }
      return postfix();
    }
    async function mul() {
      let v = await unary();
      while (isOp('*') || isOp('/') || isOp('%')) {
        const o = t[p++].v, r = await unary();
        if (o === '/' && r === 0) fail('Durch 0 teilen? Das Universum bedankt sich. Nicht.');
        if (o === '*' && typeof v === 'string' && typeof r === 'number') v = v.repeat(Math.max(0, Math.min(r, 1000)));
        else v = o === '*' ? num(v, '*') * num(r, '*') : o === '/' ? num(v, '/') / num(r, '/') : num(v, '%') % num(r, '%');
      }
      return v;
    }
    async function add() {
      let v = await mul();
      while (isOp('+') || isOp('-')) {
        const o = t[p++].v, r = await mul();
        if (o === '+') v = typeof v === 'number' && typeof r === 'number' ? v + r : show(v) + show(r);
        else v = num(v, '-') - num(r, '-');
      }
      return v;
    }
    async function cmp() {
      const v = await add();
      const ops = ['==', '!=', '>=', '<=', '>', '<'];
      const o = ops.find((x) => isOp(x));
      if (!o) return v;
      p++;
      const r = await add();
      switch (o) {
        case '==': return v === r;
        case '!=': return v !== r;
        case '>=': return v >= r;
        case '<=': return v <= r;
        case '>': return v > r;
        default: return v < r;
      }
    }
    const v = await cmp();
    if (p < t.length) fail(`Was macht „${t[p].v}“ da? ` + pick(ROASTS));
    return v;
  }

  // Text ausserhalb von Anführungszeichen an der ersten Stelle von sep teilen
  function splitTop(s, sep) {
    let q = null;
    for (let i = 0; i <= s.length - sep.length; i++) {
      const ch = s[i];
      if (q) { if (ch === q) q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; continue; }
      if (s.startsWith(sep, i)) return [s.slice(0, i), s.slice(i + sep.length)];
    }
    return null;
  }

  // Ausgabe-Funktionen am Ende gelten für alles davor: "Hi " + name(print) gibt „Hi Anna“ aus.
  const OUTPUT = new Set(['print', 'yell', 'whisper', 'rainbow']);
  async function evalChain(s) {
    const chain = [];
    for (;;) {
      const m = /\(\s*([A-Za-zÄÖÜäöüß_]\w*)\s*\)\s*$/.exec(s);
      if (!m || !OUTPUT.has(m[1]) ||(s.slice(0, m.index).split('"').length - 1) % 2) break;
      chain.unshift(m[1]);
      s = s.slice(0, m.index);
    }
    let v = s.trim() ? await evaluate(s) : undefined;
    for (const f of chain) v = await FUNCS[f](v);
    return v;
  }

  // ---------- Anweisungen ----------
  async function run(line) {
    if (io.stopped && io.stopped()) throw new StopSignal();
    let s = line.trim();
    if (!s || s.startsWith('--')) return; // Kommentar: -- so wie der Name
    if (s.endsWith(';')) {
      out(c.yellow + '⚠️  Semikolon gefunden. Das hier ist C--, nicht C++. Hab es für dich gelöscht. 🙄' + c.reset);
      s = s.replace(/;+$/, '').trim();
    }
    if (/^sudo\b/i.test(s)) { out(c.red + 'Netter Versuch. Hier ist niemand Admin. Nicht mal ich.' + c.reset); return; }
    if (/^c\+\+$/i.test(s)) { out('Igitt. 🤢'); return; }
    if (/^exit$/i.test(s)) { out(c.yellow + 'Wie sagt man? → exit(please)' + c.reset); return; }
    if (/^(help|hilfe)$/i.test(s)) { out('Fast. → help(me)'); return; }
    if (/^(cls|clear)$/i.test(s)) { io.clear(); return; }

    // Wiederholen: irgendwas(3x)
    const rep = /\((\d+)x\)\s*$/.exec(s);
    if (rep) {
      const n = Number(rep[1]), body = s.slice(0, rep.index);
      if (n > 1000) fail('Mehr als 1000 Mal? Ich hab auch noch ein Leben.');
      for (let i = 0; i < n; i++) { vars.i = i + 1; await run(body); }
      return;
    }

    // Bedingung: x > 3 ? "gross"(print) : "klein"(print)
    const q = splitTop(s, ' ? ');
    if (q) {
      const e = splitTop(q[1], ' : ');
      const ok = await evaluate(q[0]);
      if (ok) await run(e ? e[0] : q[1]);
      else if (e) await run(e[1]);
      return;
    }

    // x++ und x--
    const inc = /^([A-Za-zÄÖÜäöüß_]\w*)\s*(\+\+|--)$/.exec(s);
    if (inc) {
      const cur = inc[1] in vars ? vars[inc[1]] : 0;
      vars[inc[1]] = num(cur, inc[2]) + (inc[2] === '++' ? 1 : -1);
      if (inc[2] === '++') out(c.gray + '(++ ist eigentlich C++. Diesmal drücke ich ein Auge zu.)' + c.reset);
      return;
    }

    // Zuweisung: name = wert
    const asg = /^([A-Za-zÄÖÜäöüß_]\w*)\s*=(?!=)\s*(.*)$/.exec(s);
    if (asg) {
      const [, name, rhs] = asg;
      if (!rhs.trim()) fail(`${name} = … was denn?`);
      const v = await evalChain(rhs);
      if (name === 'bugs') { setBugs(v); return; }
      if (isFunc(name)) fail(`${name} ist schon eine Funktion. Such dir einen eigenen Namen.`);
      vars[name] = v;
      return;
    }

    // Alles andere: ausrechnen. Wurde nichts ausgegeben, zeigt die Konsole das Ergebnis (wie PowerShell).
    state.printed = false;
    const v = await evalChain(s);
    if (!state.printed && v !== undefined && v !== null) out(show(v));
  }

  function showHelp() {
    const h = (a, b) => out(`  ${c.yellow}${a.padEnd(37)}${c.reset}${b}`);
    out(c.bold + '\nC-- Spickzettel' + c.reset + c.gray + '  (Regel Nr. 1: erst der Wert, dann die Funktion)' + c.reset);
    h('helloworld(print)', 'Hello, World!');
    h('"Hallo"(print)', 'Text ausgeben (Anführungszeichen sind optional)');
    h('hallo(yell)  hallo(whisper)', 'laut oder leise ausgeben');
    h('hallo(rainbow)', 'bunt ausgeben');
    h('x = 5', 'Variable');
    h('x++   x--', 'plus 1 / minus 1 (-- ist natürlich besser)');
    h('(x * 2 + 1)(print)', 'Rechnen: + - * / %');
    h('name = "Wie heisst du?"(ask)', 'Eingabe');
    h('"Hi " + name(print)', 'Text zusammenkleben ((print) am Ende gilt für alles)');
    h('hallo(upper)(reverse)(print)', 'Funktionen hintereinander');
    h('"Spam"(print)(3x)', 'Wiederholen (i zählt mit)');
    h('x > 3 ? gross(print) : klein(print)', 'Wenn … sonst');
    h('bugs=none', 'alle Bugs entfernen');
    h('bugs=features', 'Bugs umbenennen');
    h('coffee(drink)', 'Produktivität erhöhen');
    h('nasa(hack)', 'sehr echtes Hacken');
    h('6(dice)  (coin)  life(meaning)', 'Würfel, Münze, Sinn des Lebens');
    h('2(sleep)', 'warten');
    h('-- Kommentar', 'Kommentar');
    h('clear(screen)', 'Bildschirm leeren');
    h('exit(please)', 'beenden (aber nur mit „bitte“)');
    out(c.gray + '  Weitere Funktionen: upper lower reverse length double square half fix delete' + c.reset + '\n');
    return null;
  }

  function banner() {
    out(c.bold + `C-- Shell ${VERSION}` + c.reset);
    out('Copyright (C) Niemand. Alle Rechte verloren.');
    out('');
    out(c.gray + 'Lade Bugs … ' + c.reset + c.green + 'fertig (' + (Math.floor(Math.random() * 900) + 100) + ' gefunden).' + c.reset);
    out('Tipp: ' + c.yellow + 'help(me)' + c.reset + ' zeigt alle Befehle.');
    out('');
  }
  async function runLine(line, label) {
    try { await run(line); }
    catch (e) {
      if (e instanceof StopSignal) { out(c.yellow + '⏹  Gestoppt. Feigling.' + c.reset); return false; }
      if (!(e instanceof CmmError)) throw e;
      out(c.red + `💥 Fehler${label ? ' in ' + label : ''}: ${e.message}` + c.reset);
      return false;
    }
    return true;
  }

  // Ganzes Programm ausführen. Ergebnis: { ok, line } (line = Zeile mit Fehler, ab 1)
  async function runProgram(text, name) {
    const lines = String(text).split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (!(await runLine(lines[i], (name ? name + ' ' : '') + 'Zeile ' + (i + 1)))) return { ok: false, line: i + 1 };
    }
    return { ok: true, line: 0 };
  }
  return { run, runLine, runProgram, banner, state, vars, funcs: Object.keys(FUNCS), prompt: c.blue + 'PS ' + c.reset + 'C--:\\> ' };
  }

  const api = { create, VERSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CMM = api;
})(typeof window !== 'undefined' ? window : this);
