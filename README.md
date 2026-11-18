# C--

Die Programmiersprache, die weniger kann als C++. Absichtlich.

**Regel Nr. 1:** Erst kommt der Wert, dann die Funktion.

```
helloworld(print)
bugs=none
name = "Wie heisst du?"(ask)
"Hallo " + name(rainbow)
coffee(drink)(3x)
nasa(hack)
exit(please)
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
| `helloworld(print)` | Hello, World! |
| `hallo(print)` | Text ausgeben (Anführungszeichen sind optional) |
| `hallo(yell)`, `hallo(whisper)`, `hallo(rainbow)` | laut, leise, bunt |
| `x = 5`, `x++`, `x--` | Variablen |
| `(x * 2 + 1)(print)` | Rechnen mit `+ - * / %` |
| `name = "Wie heisst du?"(ask)` | Eingabe |
| `hallo(upper)(reverse)(print)` | Funktionen hintereinander |
| `"Spam"(print)(3x)` | Wiederholen, `i` zählt mit |
| `x > 3 ? gross(print) : klein(print)` | Wenn … sonst |
| `bugs=none` | alle Bugs entfernen |
| `bugs=features` | Bugs umbenennen |
| `coffee(drink)` | Produktivität erhöhen |
| `nasa(hack)` | sehr echtes Hacken |
| `6(dice)`, `(coin)`, `life(meaning)` | Würfel, Münze, 42 |
| `2(sleep)` | warten |
| `-- Kommentar` | Kommentar |
| `clear(screen)` | Bildschirm leeren |
| `help(me)` | Hilfe |
| `exit(please)` | beenden, aber nur mit „bitte“ |

Semikolons, `sudo`, `C++` und `exit` ohne „please“ werden nicht gern gesehen.

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
npm run dist   # Installer: dist/C-- Studio Setup 1.0.0.exe
```

Der Installer fragt nach dem Ordner, legt eine Desktop- und Startmenü-Verknüpfung an und verknüpft `.cmm`-Dateien mit C-- Studio (Doppelklick öffnet sie direkt).
