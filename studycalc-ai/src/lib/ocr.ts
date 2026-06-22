/**
 * OCR ON-DEVICE — riconoscimento testo dalle foto/appunti, SENZA API e offline.
 *
 * Usa il plugin @capacitor-community/image-to-text (Apple Vision su iOS, ML Kit su
 * Android): tutto on-device, nessuna chiave, nessun dato in rete.
 *
 * L'import è STATICO così il wrapper JS del plugin viene incluso nel bundle dell'app
 * (un import dinamico "a stringa" non verrebbe risolto nel webview a runtime).
 * Su web desktop il plugin non è nativo: `isOcrAvailable()` ritorna false e la UI
 * lo segnala, senza rompere la calcolatrice.
 */
import { Capacitor } from "@capacitor/core";
import { Ocr } from "@capacitor-community/image-to-text";

export function isOcrAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Riconosce il testo contenuto in un'immagine.
 * @param image data-URL ("data:image/...;base64,XXXX") oppure path/URI del file.
 */
export async function recognizeText(image: string): Promise<string> {
  if (!isOcrAvailable()) {
    throw new Error(
      "Il riconoscimento del testo dalle foto è disponibile solo nell'app installata (iOS/Android), non nell'anteprima web.",
    );
  }
  try {
    // data-URL → base64 puro; altrimenti è un percorso file.
    const dataUrl = image.match(/^data:[^;]+;base64,(.+)$/);
    const options: any = dataUrl ? { base64: dataUrl[1] } : { filename: image };
    const data: any = await Ocr.detectText(options);
    const lines: string[] = (data?.textDetections || []).map((d: any) => d.text);
    return lines.join("\n").trim();
  } catch {
    throw new Error(
      "Non sono riuscito a leggere il testo dalla foto. Riprova con un'immagine più nitida e ben illuminata.",
    );
  }
}
