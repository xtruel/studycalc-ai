import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // ⚠️ BUNDLE IDENTIFIER — deve coincidere con quello registrato su App Store Connect.
  //    Su iOS questo valore diventa il Bundle ID del progetto Xcode. NON è modificabile
  //    dopo la prima pubblicazione: impostalo ORA con il TUO dominio inverso
  //    (es. com.tuonome.smartcalc) prima di creare l'app su App Store Connect.
  appId: 'com.studycalc.app',
  appName: 'StudyCalc AI',
  webDir: 'dist',
  android: {
    backgroundColor: '#0f172a',
  },
  ios: {
    // sfondo scuro durante il caricamento della webview (coerente col tema)
    backgroundColor: '#0f172a',
    // scroll nativo
    scrollEnabled: true,
    // evita che il contenuto finisca sotto la notch/Dynamic Island
    contentInset: 'always',
    // limita lo zoom accidentale a due dita sul testo
    limitsNavigationsToAppBoundDomains: true,
  },
};

export default config;
