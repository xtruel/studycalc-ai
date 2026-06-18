# ✅ Checklist finale — Pubblicazione su App Store Connect

## 0. Prerequisiti
- [ ] Mac con **Xcode 15+** installato e aperto almeno una volta (accetta licenza).
- [ ] **CocoaPods** installato (`pod --version`).
- [ ] **Node 18+** (`node -v`).
- [ ] **Apple Developer Program** attivo (99 €/anno) e accesso a App Store Connect.

## 1. Preparazione progetto
- [ ] `npm install` senza errori.
- [ ] `npm test` → tutti i test verdi (precisione 133+ cifre, casi estremi).
- [ ] `npm run build:app` → cartella `dist/` generata.
- [ ] `npx cap add ios` (prima volta) → cartella `ios/` creata.
- [ ] `npx cap sync ios` senza errori (installa i Pods, incluso ML Kit).

## 1-bis. Form "Nuova app" su App Store Connect (valori consigliati)
- [ ] **Piattaforme:** seleziona **solo iOS**. Per avere anche il Mac usa **Mac Catalyst**
      (stessa scheda, stesso Bundle ID); **non** spuntare macOS/tvOS/visionOS.
- [ ] **Nome:** `StudyCalc AI` (max 30 caratteri).
- [ ] **Lingua primaria:** Italiano.
- [ ] **ID pacchetto (Bundle ID):** registralo prima in *Certificates, Identifiers & Profiles*
      (es. `com.tuonome.smartcalc`) e usa lo **stesso** valore in `capacitor.config.ts` e Xcode.
- [ ] **SKU:** un codice interno qualsiasi e univoco, es. `SMARTCALC-001` (non è pubblico).
- [ ] **Accesso utenti:** *Accesso illimitato* (Full Access) se lavori da solo.
- [ ] Per il Mac: in Xcode → target App → General → **Supported Destinations** → aggiungi
      **Mac (Mac Catalyst)**.

## 2. Identità dell'app
- [ ] **Bundle Identifier** definitivo scelto (dominio inverso, es. `com.tuonome.smartcalc`)
      e impostato **sia** in `capacitor.config.ts` **sia** nel target Xcode.
- [ ] **Nome app** ("StudyCalc AI" o il tuo) coerente in Xcode e App Store Connect.
- [ ] **Version** `1.0.0` e **Build** `1` impostati in Xcode → General.

## 3. Firma (Signing)
- [ ] Target **App** → Signing & Capabilities → **Team** selezionato.
- [ ] **Automatically manage signing** attivo (Xcode crea certificato e provisioning).
- [ ] Nessun errore rosso nella sezione Signing.

## 4. Privacy & permessi (CRITICO: senza questi l'app crasha o viene rifiutata)
- [ ] `Info.plist` contiene `NSCameraUsageDescription`.
- [ ] `Info.plist` contiene `NSPhotoLibraryUsageDescription`.
- [ ] (se salvi foto) `NSPhotoLibraryAddUsageDescription`.
- [ ] In App Store Connect, sezione **App Privacy**: dichiara che **NON** raccogli dati
      (l'app è offline, niente tracking, niente rete). Compila "Data Not Collected".

## 5. Icone, splash, UI
- [ ] Icona **1024×1024** senza canale alpha/trasparenza (richiesto da Apple).
- [ ] `npx @capacitor/assets generate --ios` eseguito → tutte le dimensioni presenti.
- [ ] Launch screen mostra correttamente lo sfondo scuro `#0f172a`.
- [ ] Provato su **iPhone reale** o simulatore: nessun testo tagliato, niente
      contenuto sotto la notch/Dynamic Island (è impostato `contentInset: 'always'`).
- [ ] Rotazione/Dark mode/Dynamic Type non rompono il layout.

## 6. Stabilità (anti-crash)
- [ ] Test manuale input estremi: numeri lunghissimi incollati, `5/0`, `()`,
      simboli non validi → l'app mostra un messaggio, **non** va in crash.
- [ ] App funziona in **modalità aereo** (offline): la calcolatrice risponde sempre.
- [ ] OCR su foto chiara: estrae il testo; su foto illeggibile mostra messaggio chiaro.

## 7. Build & Upload
- [ ] Destinazione **Any iOS Device (arm64)** (non simulatore).
- [ ] **Product → Archive** completato.
- [ ] Organizer → **Distribute App → App Store Connect → Upload** riuscito.
- [ ] Build visibile in App Store Connect → TestFlight (dopo qualche minuto).

## 8. Scheda App Store Connect
- [ ] Nome, sottotitolo, descrizione (vedi testo pronto sotto).
- [ ] **Screenshot** per i formati richiesti (almeno iPhone 6.7" e 6.5").
- [ ] **Categoria**: Education o Utilities.
- [ ] **Fascia d'età** / Content Rating compilata.
- [ ] **Privacy Policy URL** (puoi pubblicare `playstore-assets/privacy-policy.html`).
- [ ] **Prezzo** (gratuito o a pagamento) impostato.
- [ ] Build associata alla versione → **Submit for Review**.

---

## ✍️ Testo pronto per la scheda (puoi modificarlo)

**Nome:** StudyCalc AI
**Sottotitolo:** Calcolatrice precisa, offline, passo passo

**Descrizione:**
> StudyCalc AI è la calcolatrice che non sbaglia gli arrotondamenti. Usa un motore
> a precisione arbitraria: oltre 133 cifre decimali esatte, numeri enormi e
> piccolissimi, divisioni lunghe, potenze, radici e percentuali — senza gli errori
> tipici di Excel e delle calcolatrici comuni.
>
> Scrivi l'espressione (anche in parole) o inquadra l'esercizio con la fotocamera:
> l'app riconosce il testo direttamente sul dispositivo e ti mostra la soluzione
> passo passo, con il controllo del risultato.
>
> 100% offline: nessun account, nessuna pubblicità, nessun abbonamento e nessun
> dato inviato in rete.

**Parole chiave:** calcolatrice, precisione, frazioni, equazioni, OCR, matematica, offline

---

## ⚠️ Note importanti
- Il **Bundle ID non è modificabile** dopo la prima pubblicazione: scegline uno tuo ora.
- Conserva l'accesso all'**account Apple Developer**: serve per ogni aggiornamento.
- A ogni nuovo upload **incrementa il Build number** (1 → 2 → 3…).
