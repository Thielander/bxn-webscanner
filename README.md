# bxn-webscanner

Dieses Tool ermöglicht das Scannen eines IP-Bereichs nach Webservern und prüft deren Inhalt auf spezifische Schlüsselwörter.

## Installation

Um das Tool zu installieren, folgen Sie diesen Schritten:

1. Klone Sie dieses Repository:
```bash
git clone https://github.com/Thielander/bxn-webscanner.git
```

2. Wechseln Sie in das geklonte Verzeichnis:
```bash
cd bxn-webscanner
```

3. Installieren Sie die benötigten npm-Pakete:
```bash
npm install
```

## Verwendung

Führen Sie das Skript aus und geben Sie den zu scannenden IP-Bereich sowie die maximale Anzahl von gleichzeitigen Verbindungen an:

```bash
node .\scan.mjs -i 89.166.35.0-89.166.35.255 -m 20
```

Hier steht `-i` für den IP-Bereich und `-m` für die maximale Anzahl von gleichzeitigen Verbindungen. Wenn keine maximale Anzahl von Verbindungen angegeben wird, wird standardmäßig `10` verwendet.

## Lizenz

Dieses Projekt steht unter der [GNU General Public License v2.0](LICENSE).
