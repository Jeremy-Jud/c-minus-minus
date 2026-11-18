// C-- Interpreter. Läuft in Node (Konsole) und im Browser (IDE).
// io = { write(text), readLine(prompt) -> Promise<string|null>, clear(), exit(), stopped() }
(function (root) {
  'use strict';
  const VERSION = '1.1 (Codename: „Einfach so“)';
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
  // Die Zeile ist keine Rechnung: dann ist sie einfach Text
  class ParseError extends CmmError {}
  const parseFail = (msg) => { throw new ParseError(msg); };

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
        if (j >= src.length) parseFail('Da fehlt ein Anführungszeichen. Ich hab gewartet, aber es kam keins.');
        t.push({ k: 'str', v: s }); i = j + 1; continue;
      }
      const n = /^\d+(?:\.\d+)?/.exec(src.slice(i));
      if (n) { t.push({ k: 'num', v: Number(n[0]) }); i += n[0].length; continue; }
      const w = /^[A-Za-zÄÖÜäöüß_][\wÄÖÜäöüß]*/.exec(src.slice(i));
      if (w) { t.push({ k: 'id', v: w[0] }); i += w[0].length; continue; }
      const op = /^(==|!=|>=|<=|[-+*/%()<>])/.exec(src.slice(i));
      if (op) { t.push({ k: 'op', v: op[0] }); i += op[0].length; continue; }
      parseFail(`Was soll „${ch}“ sein? ` + pick(ROASTS));
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
      if (!tk) parseFail('Da fehlt was am Ende. Ich bin ja kein Hellseher.');
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
        if (!isOp(')')) parseFail('Klammer auf, aber nie wieder zu. Wie ein Tab im Browser.');
        p++;
        return v;
      }
      parseFail(`„${tk.v}“ hier? ` + pick(ROASTS));
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
    if (p < t.length) parseFail(`Was macht „${t[p].v}“ da? ` + pick(ROASTS));
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

    // ---------- Einfache Befehle: einfach das Wort hinschreiben ----------
    const cmd = s.toLowerCase();
    if (Object.hasOwn(CMDS, cmd)) { await CMDS[cmd](); return; }

    // Wiederholen: 3x hallo welt
    const rep0 = /^(\d+)\s*x\s+(.+)$/i.exec(s);
    if (rep0) {
      const n = Number(rep0[1]);
      if (n > 1000) fail('Mehr als 1000 Mal? Ich hab auch noch ein Leben.');
      for (let i = 0; i < n; i++) { vars.i = i + 1; await run(rep0[2]); }
      return;
    }

    // Wenn … dann … sonst …
    const wenn = /^wenn\s+(.+?)\s+dann\s+(.+?)(?:\s+sonst\s+(.+))?$/i.exec(s);
    if (wenn) {
      // ein einzelnes = heisst hier „ist gleich“
      const ok = await evaluate(wenn[1].replace(/(^|[^=!<>])=(?!=)/g, '$1=='));
      if (ok) await run(wenn[2]);
      else if (wenn[3]) await run(wenn[3]);
      return;
    }

    // Fragen: frag Wie heisst du?
    const frag0 = /^frage?\s+(.+)$/i.exec(s);
    if (frag0) { await FUNCS.ask(toText(frag0[1])); return; }

    // Knöpfe: knopf1 = delete  (beim Klick wird „delete“ ausgeführt)
    const knopf = /^((?:knopf|button)[\wÄÖÜäöüß]*)\s*=(?!=)\s*(.+)$/i.exec(s);
    if (knopf) {
      const [, name, action] = knopf;
      if (io.button) io.button(name, () => runLine(action, name));
      else out(c.gray + `[ ${name} ]  (Knöpfe zum Klicken gibt es nur im C-- Studio)` + c.reset);
      return;
    }

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
      const fr = /^frage?\s+(.+)$/i.exec(rhs.trim());
      const v = fr ? await FUNCS.ask(toText(fr[1])) : await evalOrText(rhs);
      if (name === 'bugs') { setBugs(v); return; }
      if (isFunc(name)) fail(`${name} ist schon eine Funktion. Such dir einen eigenen Namen.`);
      vars[name] = v;
      return;
    }

    // Alles andere: ausrechnen. Wurde nichts ausgegeben, zeigt die Konsole das Ergebnis (wie PowerShell).
    state.printed = false;
    const v = await evalOrText(s);
    if (!state.printed && v !== undefined && v !== null) out(show(v));
  }

  // Text: Wörter, die Variablen sind, werden durch ihren Wert ersetzt („hallo name“ → „hallo Anna“)
  const toText = (s) => s.trim().replace(/[A-Za-zÄÖÜäöüß_][\wÄÖÜäöüß]*/g, (w) => (w in vars ? show(vars[w]) : w));
  // Erst als Rechnung versuchen, sonst ist es einfach Text
  async function evalOrText(s) {
    try { return await evalChain(s); }
    catch (e) { if (e instanceof ParseError) return toText(s); throw e; }
  }

  const JOKES = [
    'Warum mögen Programmierer keine Natur? Zu viele Bugs.',
    'Es gibt 10 Arten von Menschen: die, die binär verstehen, und die anderen.',
    'Mein Code hat keine Bugs. Nur zufällige Features.',
    '„Bei mir funktioniert’s.“ – Jeder Programmierer, immer.',
    'Ein SQL-Befehl geht in eine Bar, sieht zwei Tabellen und fragt: „Darf ich joinen?“',
    'C++ hat zwei Plus. C-- hat zwei Minus. Mathematisch sind wir quitt.',
  ];
  const CMDS = {
    delete: () => io.clear(), löschen: () => io.clear(), 'alles löschen': () => io.clear(), clear: () => io.clear(), cls: () => io.clear(),
    help: () => showHelp(), hilfe: () => showHelp(),
    konfetti: () => out([...Array(24)].map(() => pick(['🎉', '🎊', '✨', '🥳', '🎈', '⭐'])).join('')),
    witz: () => out('😄 ' + pick(JOKES)),
    würfel: () => out('🎲 ' + FUNCS.dice(6)),
    münze: () => out('🪙 ' + FUNCS.coin()),
    zeit: () => out('🕒 ' + new Date().toLocaleTimeString('de-CH')),
    uhr: () => out('🕒 ' + new Date().toLocaleTimeString('de-CH')),
    datum: () => out('📅 ' + new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })),
    kaffee: () => FUNCS.drink('kaffee'),
    hack: () => FUNCS.hack('NASA'),
    tschüss: () => { out(c.green + 'Tschüss! 👋' + c.reset); io.exit(); },
  };

  function showHelp() {
    const h = (a, b) => out(`  ${c.yellow}${a.padEnd(36)}${c.reset}${b}`);
    out(c.bold + '\nC-- Spickzettel' + c.reset + c.gray + '  (einfach hinschreiben, ohne "" und ohne print)' + c.reset);
    h('hallo welt', 'zeigt „hallo welt“');
    h('zahl1 = 5', 'Variable');
    h('zahl1 + zahl2', 'rechnen: + - * / %');
    h('hallo name', 'Variablen im Text werden ersetzt');
    h('name = frag Wie heisst du?', 'fragen');
    h('3x hallo', 'wiederholen (i zählt mit)');
    h('wenn x > 3 dann gross sonst klein', 'wenn … dann … sonst');
    h('knopf1 = delete', 'Knopf: Klick löscht alles (nur im Studio)');
    h('knopf2 = konfetti', 'Knopf mit beliebigem Befehl');
    h('x--   x++', 'minus 1 / plus 1');
    h('bugs=none', 'alle Bugs entfernen');
    h('delete', 'alles löschen');
    h('konfetti  witz  würfel  münze', 'Spass');
    h('zeit  datum  kaffee  hack', 'noch mehr Spass');
    h('-- Kommentar', 'wird ignoriert');
    h('tschüss', 'beenden');
    out(c.gray + '  Profi-Modus: "Text"(print), hallo(yell), hallo(rainbow), name = "Frage?"(ask), "Spam"(print)(3x)' + c.reset + '\n');
    return null;
  }

  function banner() {
    out(c.bold + `C-- Shell ${VERSION}` + c.reset);
    out('Copyright (C) Niemand. Alle Rechte verloren.');
    out('');
    out(c.gray + 'Lade Bugs … ' + c.reset + c.green + 'fertig (' + (Math.floor(Math.random() * 900) + 100) + ' gefunden).' + c.reset);
    out('Tipp: ' + c.yellow + 'hilfe' + c.reset + ' zeigt alle Befehle.');
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
