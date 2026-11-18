# C--

Die Programmiersprache, die weniger kann als C++. Absichtlich.

## ⬇️ Download

**[C-- Studio für Windows herunterladen](https://github.com/Jeremy-Jud/c-minus-minus/releases/latest/download/CMinusMinus-Studio-Setup.exe)** – Installer mit Desktop-Verknüpfung, `.cmm`-Dateien öffnen sich per Doppelklick.

Alle Versionen: [Releases](https://github.com/Jeremy-Jud/c-minus-minus/releases)

> Windows meldet beim ersten Start vielleicht „Der Computer wurde durch Windows geschützt“, weil der Installer nicht signiert ist. Dann auf **Weitere Informationen → Trotzdem ausführen** klicken.

**Updates:** C-- Studio sucht beim Start und alle 4 Stunden selbst nach einer neuen Version und lädt sie im Hintergrund. Ist sie bereit, erscheint unten rechts „🎁 Update bereit – neu starten“. Von Hand: unten rechts auf die Versionsnummer klicken.

**Regel Nr. 1:** Einfach hinschreiben. Keine Anführungszeichen, kein `print`.

```
hallo welt
zahl1 = 5
zahl2 = 3
zahl1 + zahl2
name = frag Wie heisst du?
hallo name!
wenn zahl1 > 3 dann gross sonst klein
knopf1 = delete
```

## Starten

```
C--                        # Konsole (sieht aus wie PowerShell)
C-- beispiele\hallo.cmm    # Programm ausführen
```

Ohne `C--.cmd` geht es auch mit `node cmm.js` bzw. `node cmm.js datei.cmm`. Es braucht nur Node.js.

## Spickzettel

| Code | Was passiert |
|---|---|
| `hallo welt` | zeigt „hallo welt“ |
| `zahl1 = 5` | Variable |
| `zahl1 + zahl2` | rechnen mit `+ - * / %`, das Ergebnis erscheint von selbst |
| `summe = zahl1 + zahl2` | Ergebnis in einer Variable merken |
| `hallo name` | Variablen im Text werden durch ihren Wert ersetzt |
| `name = frag Wie heisst du?` | fragen |
| `3x hallo` | wiederholen, `i` zählt mit |
| `wenn x > 3 dann gross sonst klein` | wenn … dann … sonst |
| `knopf1 = delete` | Knopf im Studio, ein Klick löscht alles |
| `knopf2 = konfetti` | Knopf mit beliebigem Befehl oder Text |
| `x--`, `x++` | minus 1, plus 1 |
| `bugs=none` | alle Bugs entfernen |
| `delete` | alles löschen |
| `konfetti`, `witz`, `würfel`, `münze` | Spass |
| `zeit`, `datum`, `kaffee`, `hack` | noch mehr Spass |
| `-- Kommentar` | wird ignoriert |
| `hilfe` | alle Befehle |
| `tschüss` | beenden |

**Profi-Modus** (geht weiterhin): `"Text"(print)`, `hallo(yell)`, `hallo(rainbow)`, `name = "Frage?"(ask)`, `"Spam"(print)(3x)`, `x > 3 ? gross(print) : klein(print)`, `exit(please)`.

Semikolons, `sudo` und `C++` werden nicht gern gesehen.

## C-- Studio (Entwicklungsumgebung)

Eigene App mit Editor, Syntaxfarben, Terminal im PowerShell-Look und Spickzettel.

```
npm install
node node_modules/electron/install.js   # nur falls npm Electron nicht heruntergeladen hat
npm start                               # oder Doppelklick auf "C-- Studio.cmd"
```

| Taste | Funktion |
|---|---|
| F5 | Ausführen |
| Umschalt+F5 | Stopp |
| Strg+S / Strg+Umschalt+S | Speichern / Speichern unter |
| Strg+O, Strg+N | Öffnen, Neu |
| Strg+/ | Zeile auskommentieren |
| F1 | Spickzettel ein/aus |

Im Terminal kannst du auch direkt C-- tippen, mit ↑/↓ holst du frühere Befehle zurück. Fehler werden rot in der Zeile markiert.

## Installer bauen

```
npm run icon   # Icon neu zeichnen (build/icon.ico, build/icon.png)
npm run dist   # Installer: dist/CMinusMinus-Studio-Setup.exe
```

Der Installer fragt nach dem Ordner, legt eine Desktop- und Startmenü-Verknüpfung an und verknüpft `.cmm`-Dateien mit C-- Studio (Doppelklick öffnet sie direkt).

## Neue Version veröffentlichen

1. Version in `package.json` erhöhen (z. B. `1.0.1`).
2. `npm run dist`
3. Release auf GitHub mit dem Tag `v1.0.1` anlegen und `CMinusMinus-Studio-Setup.exe`, `CMinusMinus-Studio-Setup.exe.blockmap` und `latest.yml` aus `dist/` hochladen.

Installierte Apps finden das Update dann von selbst. Das klappt nur, solange das Repo öffentlich ist: Bei einem privaten Repo bekommt die App von GitHub keine Antwort.
