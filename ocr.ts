/**
 * OCR ON-DEVICE — riconoscimento testo dalle foto/appunti, SENZA API e offline.
 *
 * Usa il plugin @capacitor-community/image-to-text, che sfrutta:
 *   - su iOS  → il Vision Framework di Apple
 *   - su Android → ML Kit Text Recognition
 * Entrambi girano interamente sul dispositivo: nessuna chiave, nessun costo,
 * nessun dato inviato in rete.
 *
 * In ambiente web (browser desktop) il plugin nativo non è disponibile: in quel
 * caso `isOcrAvailable()` ritorna false e la UI lo segnala. L'import è DINAMICO
 * così l'app continua a compilare e a funzionare come calcolatrice anche senza
 * il pacchetto installato.
 */
import { Capacitor } from "@capacitor/core";

export function isOcrAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Riconosce il testo contenuto in un'immagine.
 * @param image data-URL ("data:image/...;base64,XXXX") oppure path/URI del file.
 * @returns il testo riconosciuto (stringa), eventualmente vuota.
 * @throws Error con messaggio chiaro se l'OCR non è disponibile o fallisce.
 */
export async function recognizeText(image: string): Promise<string> {
  if (!isOcrAvailable()) {
    throw new Error(
      "Il riconoscimento del testo dalle foto è disponibile solo nell'app installata (iOS/Android), non nell'anteprima web.",
    );
  }

  // Import dinamico con specifier "a variabile" + @vite-ignore: così il bundler web
  // NON prova a risolvere il plugin nativo in fase di build (serve solo nell'app).
  let Ocr: any;
  const pkg = "@capacitor-community/image-to-text";
  try {
    ({ Ocr } = await import(/* @vite-ignore */ pkg));
  } catch {
    throw new Error(
      "Modulo OCR non installato. Esegui: npm i @capacitor-community/image-to-text && npx cap sync",
    );
  }

  try {
    // Se riceviamo un data-URL passiamo il base64 puro, altrimenti il path del file.
    const dataUrl = image.match(/^data:[^;]+;base64,(.+)$/);
    const options = dataUrl ? { base64: dataUrl[1] } : { filename: image };
    const data = await Ocr.detectText(options);
    const lines: string[] = (data?.textDetections || []).map((d: any) => d.text);
    return lines.join("\n").trim();
  } catch {
    throw new Error(
      "Non sono riuscito a leggere il testo dalla foto. Riprova con un'immagine più nitida e ben illuminata.",
    );
  }
}
