// KI für C--: „ki <Wunsch>“ → Claude schreibt passenden C--Code, den C-- still ausführt. Keine Antwort, nur Ausgabe.
// Läuft nur in Node (Konsole und Hauptprozess des Studios), nie im Fenster: der API-Schlüssel bleibt hier.
'use strict';
const Anthropic = require('@anthropic-ai/sdk').default;

const MODEL = 'claude-opus-5-5';

const SYSTEM = `Du übersetzt Wünsche in Code für die Spass-Programmiersprache C--. Der Nutzer tippt einen Wunsch auf Deutsch (oft kurz, mit Tippfehlern, Schweizer Schreibweise ohne ß). Du gibst NUR C--Code zurück. Der Code wird sofort ausgeführt; der Nutzer sieht nur, was der Code ausgibt. Du redest nie mit dem Nutzer.

C-- (eine Anweisung pro Zeile):
- Eine Zeile mit Text wird genau so angezeigt: hallo welt
- Variablen: zahl1 = 5   name = Anna
- Rechnen (Ergebnis erscheint von selbst): zahl1 + zahl2   (Operatoren + - * / %, Klammern)
- Ergebnis merken: summe = zahl1 + zahl2
- Variablen im Text werden durch ihren Wert ersetzt: hallo name  → hallo Anna
- Fragen: name = frag Wie heisst du?
- Wiederholen: 3x hallo   (i zählt 1, 2, 3 …), z. B. 5x Zeile i
- Wenn: wenn zahl1 > zahl2 dann ja sonst nein   (= heisst gleich; dann- und sonst-Teil ist je eine Anweisung)
- Knöpfe im Terminal: knopf1 = delete   knopf2 = konfetti   knopf3 = hallo name  (beim Klick wird die Anweisung ausgeführt; Name beginnt mit knopf)
- Befehle: delete (alles löschen), konfetti, witz, würfel, münze, zeit, datum, kaffee, hack, bugs=none
- x-- und x++ (minus/plus 1)
- Es gibt keine Schleifen mit Bedingung, keine Funktionen, keine Listen, keine Dateien, kein Internet.
- VERBOTEN: das Zeichen ; und das Zeichen " (beides ist ein Syntaxfehler). Text nie in Anführungszeichen setzen.

Regeln für "code":
- Nur gültige C--Anweisungen, getrennt mit \\n, höchstens 40 Zeilen. Kein Markdown, keine Kommentare, keine Erklärungen.
- Nutze vorhandene Variablen, wenn sich der Wunsch darauf bezieht.
- Wissensfrage oder etwas, das nur Text braucht: eine kurze Textzeile mit dem Ergebnis, z. B. für „hauptstadt von japan“ einfach: Tokio
- Ist der Wunsch in C-- unmöglich: eine Textzeile, die kurz sagt, dass es in C-- nicht geht.`;

const FORMAT = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      code: { type: 'string' },
    },
    required: ['code'],
    additionalProperties: false,
  },
};

// vars: { name: wert } der laufenden C--Sitzung, damit „ki rechne zahl1 mal zwei“ funktioniert
async function ask(wish, vars, apiKey) {
  const client = apiKey ? new Anthropic({ apiKey }) : new Anthropic();
  const varText = Object.entries(vars || {}).slice(0, 40)
    .map(([k, v]) => `${k} = ${String(v).slice(0, 80)}`).join('\n');
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM,
      // Lehnt Claude Opus 5.5 aus Sicherheitsgründen ab, übernimmt automatisch ein passendes Ersatzmodell
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: FORMAT },
      messages: [{ role: 'user', content: (varText ? `Vorhandene Variablen:\n${varText}\n\n` : '') + `Wunsch: ${String(wish).slice(0, 2000)}` }],
    });
    if (response.stop_reason === 'refusal') return { error: 'Die KI möchte dabei nicht helfen.' };
    if (response.stop_reason === 'max_tokens') return { error: 'Die Antwort war zu lang. Versuch es kürzer.' };
    const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    let out;
    try { out = JSON.parse(text); } catch { return { error: 'Die KI hat Unsinn geantwortet. Nochmal versuchen?' }; }
    return {
      code: typeof out.code === 'string' ? out.code.split(/\r?\n/).slice(0, 60).join('\n') : '',
    };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { error: 'Der API-Schlüssel stimmt nicht.', needKey: true };
    if (e instanceof Anthropic.PermissionDeniedError) return { error: 'Dieser API-Schlüssel darf das nicht (keine Berechtigung).' };
    if (e instanceof Anthropic.RateLimitError) return { error: 'Zu viele Anfragen. Kurz warten und nochmal.' };
    if (e instanceof Anthropic.BadRequestError) return { error: 'Anfrage abgelehnt: ' + e.message };
    if (e instanceof Anthropic.APIConnectionError) return { error: 'Keine Verbindung zur KI. Internet da?' };
    if (e instanceof Anthropic.APIError) return { error: `KI-Fehler ${e.status ?? ''}: ${e.message}` };
    // Kein Schlüssel gefunden (weder gespeichert noch ANTHROPIC_API_KEY / ant-Profil)
    if (!apiKey && !process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) return { error: 'Kein API-Schlüssel eingerichtet.', needKey: true };
    return { error: 'KI-Fehler: ' + (e && e.message ? e.message : e) };
  }
}

module.exports = { ask, MODEL };
