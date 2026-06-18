# StudyCalc AI — Calcolatrice intelligente offline ad alta precisione

App **iOS** (e Android) costruita con **Capacitor + React + TypeScript**.
Risolve **passo passo** espressioni, equazioni di 1° e 2° grado e legge gli esercizi
**dalle foto** (OCR on-device). Tutto **offline**: nessuna chiave API, nessun
abbonamento, nessun dato inviato in rete.

> ⚠️ **Importante (architettura):** questa **non** è un'app nativa in Swift/SwiftUI.
> È un'app **web (React)** impacchettata in un guscio nativo con **Capacitor**.
> Si apre e si archivia comunque in **Xcode** come qualsiasi app iOS, ma il codice
> dell'interfaccia è in `src/` (TypeScript/React), non in Swift.

---

## ✨ Cosa fa

- **Motore matematico a precisione arbitraria** (`src/lib/bigdecimal.ts`):
  niente `float`/`double`, niente errori tipo `0.1 + 0.2 = 0.30000000000000004`.
  Gestisce **oltre 133 cifre decimali esatte**, numeri enormi e piccolissimi,
  divisioni lunghe, potenze, radici, percentuali, parentesi e priorità operatori.
- **Risoluzione passo passo** di espressioni ed equazioni (`src/lib/solver.ts`),
  con frazioni esatte (BigInt) e risultato decimale ad alta precisione.
- **OCR on-device** (`src/lib/ocr.ts`) con Google **ML Kit** (`@capacitor-mlkit/text-recognition`):
  legge il testo dalle foto **senza** inviare nulla in rete.
- **Multilingua** (IT/EN/ES/FR/DE/PT) e input in linguaggio naturale.

## 🧮 Precisione: come funziona

Ogni numero è `coeff × 10^(-scale)` con `coeff` di tipo **BigInt** (intero a
precisione illimitata). Addizione, sottrazione, moltiplicazione e potenza intera
restano **esatte**. Divisione e radice quadrata — che possono avere infinite cifre —
vengono calcolate con **divisione lunga / metodo di Newton** fino alla precisione
richiesta (default **150–200 cifre**, configurabile in `DECIMAL_DIGITS`).
Il **valore esatto** è sempre conservato internamente; la UI può mostrarne una
versione **leggibile** (`format(maxDecimals)`) senza alterare il valore reale.

---

## 🖥️ Requisiti (sul tuo Mac)

| Strumento | Versione | Note |
|-----------|----------|------|
| macOS | recente | per Xcode |
| **Xcode** | 15 o superiore | da App Store |
| **Node.js** | 18+ (consigliato 20/22) | `node -v` |
| **CocoaPods** | ultima | `sudo gem install cocoapods` |
| **Account Apple Developer** | a pagamento (99 €/anno) | richiesto per pubblicare |

---

## 🚀 Da zero all'app su iPhone

```bash
# 1) Installa le dipendenze
npm install

# 2) (consigliato) verifica che il motore matematico sia corretto
npm test

# 3) Crea la build web in modalità app
npm run build:app

# 4) SOLO LA PRIMA VOLTA: aggiungi la piattaforma iOS (crea la cartella ios/)
npx cap add ios

# 5) Sincronizza la build dentro il progetto iOS
npx cap sync ios

# 6) Apri il progetto in Xcode
npx cap open ios
```

Dalla seconda volta in poi, dopo ogni modifica al codice in `src/`:

```bash
npm run ios:sync   # = build:app + cap sync ios
npm run ios:open   # apre Xcode
```

### Qual è il file da aprire?

`npx cap open ios` apre **`ios/App/App.xcworkspace`** in Xcode.
👉 Apri **sempre il `.xcworkspace`**, **mai** il `.xcodeproj` (serve per i Pods).

---

## 🔐 Permessi privacy (OBBLIGATORI per l'OCR/fotocamera)

L'OCR usa fotocamera e galleria. iOS **rifiuta** l'app (e va in crash) se mancano le
descrizioni d'uso. In Xcode apri `ios/App/App/Info.plist` e aggiungi queste chiavi:

```xml
<key>NSCameraUsageDescription</key>
<string>Usiamo la fotocamera per leggere gli esercizi di matematica dalle tue foto, direttamente sul dispositivo.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>Accediamo alle foto per leggere gli esercizi dalle immagini che selezioni, direttamente sul dispositivo.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>Salviamo eventuali immagini elaborate nella tua galleria.</string>
```

---

## ⚙️ Configurazione iOS in Xcode

Seleziona il target **App** → schede **General** e **Signing & Capabilities**:

1. **Bundle Identifier** → deve coincidere con `appId` in `capacitor.config.ts`
   (`com.studycalc.app`). **Cambialo con il tuo dominio inverso** (es. `com.tuonome.smartcalc`)
   **prima** di creare l'app su App Store Connect.
2. **Team** → seleziona il tuo team Apple Developer (*Automatically manage signing*).
3. **Version** (es. `1.0.0`) e **Build** (es. `1`): la *Version* è quella pubblica,
   il *Build* va incrementato a ogni caricamento.
4. **Deployment Target**: iOS 14.0 o superiore (ML Kit richiede ≥ 12).

### Icone e launch screen

Metti un'icona quadrata **1024×1024** in `assets/icon.png` (già presente) e uno
splash in `assets/splash.png`, poi:

```bash
npm i -D @capacitor/assets
npx @capacitor/assets generate --ios
```

Genera automaticamente tutte le dimensioni richieste e il launch screen.

---

## 🖥️ Anche su macOS (Mac Catalyst)

Vuoi l'app **sia su iPhone/iPad sia su Mac**? Non serve riscrivere nulla: si usa
**Mac Catalyst**, che crea un'app Mac dallo **stesso** progetto.

1. In Xcode, target **App → General → Supported Destinations** → premi **+** e aggiungi
   **Mac (Mac Catalyst)**.
2. In **Signing & Capabilities** assicurati che il Team sia selezionato anche per Mac.
3. Compila scegliendo come destinazione **My Mac (Mac Catalyst)** per provarla.

⚠️ **Importante per App Store Connect:** un'app **Mac Catalyst** si pubblica sotto la
**stessa scheda** dell'app iOS (stesso Bundle ID). Quindi nel form "Nuova app"
seleziona **solo iOS**: la build Mac si aggiunge automaticamente allo stesso record.
**Non** creare una scheda macOS separata (quella serve solo per app native AppKit).

> In alternativa, senza Catalyst, sui **Mac con Apple Silicon** la tua app iOS può
> già girare "as-is": basta attivare la disponibilità su Mac nella scheda dell'app.
> Mac Catalyst dà però un'esperienza desktop migliore (finestra ridimensionabile, menu).

---

## 📦 Build, Archive e caricamento su App Store Connect

1. In Xcode scegli come destinazione **Any iOS Device (arm64)** (non un simulatore).
2. Menu **Product → Archive**. Attendi la compilazione.
3. Nell'**Organizer**: seleziona l'archivio → **Distribute App** →
   **App Store Connect** → **Upload**.
4. Su [appstoreconnect.apple.com](https://appstoreconnect.apple.com):
   - **My Apps → +** → crea l'app con lo stesso **Bundle ID**.
   - Compila scheda, screenshot, descrizione, privacy.
   - In **TestFlight/Build** comparirà la build caricata (può volerci qualche minuto).
   - Associa la build alla versione e premi **Submit for Review**.

La **checklist completa** è in [`APPSTORE-CHECKLIST.md`](./APPSTORE-CHECKLIST.md).
Il **report dell'analisi** (problemi trovati e correzioni) è in [`ANALISI-PROGETTO.md`](./ANALISI-PROGETTO.md).

---

## 🧪 Test

```bash
npm test
```

Esegue i test in `src/lib/*.test.ts`: precisione oltre 133 cifre, numeri estremi,
divisione per zero, input non validi, equazioni esatte e irrazionali ad alta precisione.

## 🌐 Anteprima nel browser (sviluppo)

```bash
npm run dev      # http://localhost:5173
```

> Nel browser desktop l'**OCR non è disponibile** (richiede il plugin nativo):
> l'app lo segnala e resta pienamente utilizzabile come calcolatrice. La parte
> matematica funziona identica ovunque.

---

## 📁 Struttura

```
src/
  lib/
    bigdecimal.ts        Motore aritmetico a precisione arbitraria (BigInt)
    bigdecimal.test.ts   Test del motore (precisione/stabilità)
    solver.ts            Risolutore espressioni/equazioni passo passo
    solver.test.ts       Test del risolutore
    ocr.ts               OCR on-device (ML Kit), import dinamico
    naturalMath.ts       Linguaggio naturale → matematica (multilingua)
    solverI18n.ts        Traduzioni dei passaggi
    uiI18n.ts            Traduzioni dell'interfaccia
    presets.ts           Esercizi di esempio
  components/            Componenti React (UI)
  App.tsx                Applicazione principale
capacitor.config.ts      Config Capacitor (appId, appName, iOS)
ios/                     (generata da `npx cap add ios` sul Mac)
android/                 Progetto Android (opzionale, cross-platform)
```
