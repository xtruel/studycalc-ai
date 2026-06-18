# 🔍 Analisi del progetto e correzioni applicate

Progetto originale: **StudyCalc AI** — esportato da Windows, generato con Google AI Studio.
Tipo: **Capacitor + React + TypeScript + Vite** (app web impacchettata in guscio nativo).

## 1. Cosa ho trovato

- **Non era un progetto iOS/Xcode nativo.** Era un'app web Capacitor con la sola
  piattaforma **Android** configurata; **mancava completamente la cartella `ios/`**.
- Il progetto dipendeva da **Gemini API** (`@google/genai`, `server.ts`) per OCR e
  problemi a parole — richiedeva chiave API e un **server Node**, incompatibile con
  un'app iOS statica.
- Il **motore matematico** usava sì le frazioni esatte con BigInt, ma le
  **approssimazioni decimali erano calcolate con `double`** e troncate a **4 cifre**
  (`fmtNum`), e le **radici** usavano `Math.sqrt` (float). Niente alta precisione.
- **Segreti committati nel repo**: keystore di firma `studycalc-release.jks`,
  `KEYSTORE-CREDENZIALI.txt` e `keystore.properties` con password in chiaro.
- Path/artefatti tipici di export Windows e `dist/`, `node_modules/` non necessari.

## 2. Bug e problemi (con gravità)

| # | Gravità | Problema | Stato |
|---|---------|----------|-------|
| 1 | 🔴 Alta | Manca la piattaforma iOS (`ios/`) → impossibile aprire in Xcode | Documentato: `npx cap add ios` + guida |
| 2 | 🔴 Alta | Segreti di firma + password in chiaro nel repo | **Rimossi** e ignorati in `.gitignore` |
| 3 | 🔴 Alta | Dipendenza da Gemini API (chiave + server) per l'AI | **Rimossa**: app ora 100% offline |
| 4 | 🟠 Media | Precisione decimale limitata a `double` e 4 cifre | **Risolto**: motore `BigDecimal` 133+ cifre |
| 5 | 🟠 Media | Radici di 2° grado con `Math.sqrt` (float) | **Risolto**: `BigDecimal.sqrt` ad alta precisione |
| 6 | 🟠 Media | Permessi privacy iOS assenti (crash/rifiuto) | Documentati in README + checklist |
| 7 | 🟡 Bassa | `build:app` dipendeva da file `.env.app` | **Risolto** nel `vite.config.ts` (define) |
| 8 | 🟡 Bassa | Nome progetto generico `react-example` | Rinominato `studycalc-ai`, versione `1.0.0` |
| 9 | 🟡 Bassa | Nessun test automatico | **Aggiunti** 31 test (precisione/stabilità) |

## 3. Correzioni applicate (file)

### Nuovi file
- `src/lib/bigdecimal.ts` — motore aritmetico a **precisione arbitraria** (BigInt):
  `+ − × ÷`, potenze (anche negative), **radice quadrata** (Newton), percentuali,
  confronti, parsing robusto (notazione scientifica, underscore), formattazione
  leggibile che **conserva il valore esatto**. Gestisce divisione per zero, input
  non validi, numeri enormi e piccolissimi **senza crash** e **senza notazione
  scientifica forzata**.
- `src/lib/bigdecimal.test.ts` — 19 test (incl. **>133 cifre** esatte di 1/3 e √2).
- `src/lib/solver.test.ts` — 12 test sul risolutore end-to-end.
- `src/lib/ocr.ts` — **OCR on-device** con ML Kit (import dinamico, fallback sicuro).
- `README.md`, `APPSTORE-CHECKLIST.md`, `ANALISI-PROGETTO.md` — documentazione iOS.

### File modificati
- `src/lib/solver.ts` — i risultati decimali esatti ora usano la **divisione lunga**
  ad alta precisione (`Frac.toDecimalString`, 150 cifre); le radici irrazionali delle
  equazioni di 2° grado usano `BigDecimal.sqrt`. Aggiunti helper `toBigDecimal`,
  `toDecimalString`, `isTerminating` e la costante `DECIMAL_DIGITS`.
- `src/App.tsx` — **rimosso il percorso cloud Gemini**; ora l'app è **sempre offline**
  e, se è presente una foto, esegue l'**OCR on-device** prima del calcolo.
- `capacitor.config.ts` — `appId`/`appName` aggiornati, opzioni iOS (`contentInset`).
- `vite.config.ts` — modalità app gestita via `define` (niente più `.env.app`).
- `package.json` — nome/versione, script `test`/`ios:sync`/`ios:open`; **rimossi**
  `@google/genai`, `express`, `dotenv`, `esbuild`; **aggiunti** ML Kit e camera.
- `metadata.json`, `.env.example`, `.gitignore` — ripuliti dai riferimenti cloud,
  aggiunte regole di ignore per iOS e per i certificati di firma.

### File rimossi (con motivazione)
- `server.ts` — era il backend Gemini; **non serve più** (app offline, niente AI server).
- `studycalc-release.jks`, `KEYSTORE-CREDENZIALI.txt`, `android/keystore.properties`,
  `android/local.properties` — **segreti**: non vanno mai nel repo.
- File del vecchio forum (`forum.html`, `thread.html`, `index.html`, `style.css`,
  `image.png`, `forum-migration/`) — non pertinenti: il repo ora ospita l'app.

> **Nessuna funzionalità di calcolo è stata rimossa.** L'unica funzione tolta è la
> modalità cloud Gemini, su tua esplicita richiesta (niente API/abbonamenti). L'OCR,
> che prima dipendeva dal cloud, è stato **sostituito** con una soluzione on-device.

## 4. Cosa manca / da fare sul Mac (non eseguibile qui su Linux)
- Generare la cartella `ios/` con `npx cap add ios` (richiede macOS + CocoaPods).
- Aggiungere le stringhe privacy in `ios/App/App/Info.plist` (vedi README).
- Generare le icone con `npx @capacitor/assets generate --ios`.
- Archiviare e caricare da Xcode (vedi `APPSTORE-CHECKLIST.md`).

## 5. Verifica eseguita
- `npm test` → **31/31 test verdi**, inclusi: `0.1 + 0.2 = 0.3` esatto, `1/3` con
  oltre 133 cifre, `√2` ad alta precisione, `2^256`, divisione per zero gestita,
  input non validi senza crash.
