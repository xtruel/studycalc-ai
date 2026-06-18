# 🚀 Pubblicare StudyCalc AI SENZA Xcode — build su Mac in cloud (Codemagic)

Il tuo Mac non può usare Xcode? Nessun problema: un **Mac in cloud** compila, firma e
carica l'app su App Store Connect al posto tuo. Servono ~30 minuti la prima volta.

Prerequisiti già pronti:
- ✅ Apple Developer Program attivo (99 €/anno)
- ✅ App creata su App Store Connect (Nome: StudyCalc AI, Bundle ID: `com.studycalc.app`)
- ✅ Codice del progetto (l'archivio `studycalc-ai.tgz`)

---

## Passo 1 — Metti il codice su GitHub (dal Terminale del Mac, niente Xcode)

Apri **Terminale** (è nel Dock o in Applicazioni › Utility) ed esegui:

```bash
cd ~/Downloads
tar xzf studycalc-ai.tgz        # scompatta il progetto
cd studycalc-ai
git --version                   # se dice "command not found", esegui: xcode-select --install
git init
git add -A
git commit -m "StudyCalc AI"
git branch -M main
```

Crea un repository vuoto su https://github.com/new (es. nome `studycalc-ai`, privato va bene),
poi collega e carica:

```bash
git remote add origin https://github.com/TUO-UTENTE/studycalc-ai.git
git push -u origin main
```

> Niente git? In alternativa su github.com → "Add file → Upload files" e trascini il
> contenuto della cartella `studycalc-ai` (così com'è, senza `node_modules`).

---

## Passo 2 — Crea la API key di App Store Connect

1. Vai su https://appstoreconnect.apple.com → **Users and Access** (Utenti e accessi).
2. Scheda **Integrations / Keys** → sezione **App Store Connect API** → **Generate API Key**.
3. Nome: `Codemagic`. Ruolo: **App Manager**. → **Generate**.
4. **Scarica il file `.p8`** (si scarica UNA SOLA VOLTA — conservalo!).
5. Annota due valori da quella pagina:
   - **Issuer ID** (in alto, un codice tipo `69a6de…`)
   - **Key ID** (accanto alla key creata)

---

## Passo 3 — Collega tutto su Codemagic

1. Vai su https://codemagic.io → **Sign up with GitHub** → autorizza.
2. **Add application** → scegli GitHub → seleziona il repo `studycalc-ai`.
   Codemagic rileva automaticamente il file `codemagic.yaml` già incluso.
3. In alto a destra: **Teams → (il tuo team) → Integrations → App Store Connect → Connect**:
   - **Issuer ID**: incolla quello del Passo 2
   - **Key ID**: incolla quello del Passo 2
   - **API key (.p8)**: carica il file scaricato
   - **Nome dell'integrazione**: scrivi **esattamente** `CODEMAGIC_ASC_KEY`
     (è il nome richiamato nel `codemagic.yaml`).

---

## Passo 4 — Avvia la build

1. Apri l'app in Codemagic → **Start new build**.
2. Seleziona il workflow **“StudyCalc AI - iOS App Store”** → **Start build**.
3. Attendi ~15–20 minuti. La pipeline fa tutto da sola:
   `npm ci` → test → build web → `cap add ios` → permessi privacy → firma → IPA →
   **upload su TestFlight**.

Se la build diventa **verde** ✅, l'IPA è stato caricato su App Store Connect.

---

## Passo 5 — Completa la scheda e invia in revisione

Su https://appstoreconnect.apple.com → la tua app:

1. **TestFlight**: dopo qualche minuto la build compare ("Processing" → pronta).
   Puoi installarla sul tuo iPhone con l'app **TestFlight** per provarla davvero.
2. **Distribution / App Store** → versione **1.0**:
   - **Screenshot** (iPhone 6.7"): usa quelli nella cartella `appstore-screenshots/`.
   - **Descrizione, parole chiave, sottotitolo**: testo pronto in `APPSTORE-CHECKLIST.md`.
   - **Icona**: viene presa dalla build; per la scheda usa `AppStore-icon-1024.png`.
   - **Privacy**: sezione *App Privacy* → **Data Not Collected** (l'app è offline).
   - **Categoria**: Education (o Utilities). **Prezzo**: gratuito o a pagamento.
   - **Età/Content Rating**: compila il questionario.
3. In **Build**, premi **+** e seleziona la build arrivata da Codemagic.
4. **Add for Review → Submit**. 🎉

---

## Aggiornamenti futuri
Modifichi il codice → `git push` → in Codemagic **Start build**. Il build number si
incrementa da solo. Su App Store Connect crei una nuova versione e reinvii.

## Problemi comuni
- **"No matching profiles"**: verifica che il Bundle ID registrato sia **identico** a
  `com.studycalc.app` (Passo App Store Connect e `capacitor.config.ts`).
- **Build rossa sui test**: apri il log; `npm test` deve passare (qui erano 31/31 verdi).
- **App in crash sull'OCR**: i permessi privacy vengono iniettati dalla pipeline; se
  hai una `ios/` tua, controlla che `Info.plist` contenga `NSCameraUsageDescription`.
