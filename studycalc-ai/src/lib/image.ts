/**
 * Riduzione immagini PRIMA di tenerle in memoria / passarle all'OCR.
 *
 * Le foto di un iPhone moderno sono da 12 MP (anche 4–8 MB in base64): tenerle a
 * piena risoluzione nello stato React, mostrarle e poi passarle intere al plugin
 * OCR può saturare la memoria del webview su iPhone vecchi e causare la PAGINA
 * BIANCA. Qui ridimensioniamo a un lato massimo ragionevole e ricomprimiamo in
 * JPEG: la qualità resta più che sufficiente per leggere il testo, ma la memoria
 * usata crolla. Tutto in locale, nessun dato in rete.
 */

const MAX_DIMENSION = 1600; // lato lungo massimo in pixel
const JPEG_QUALITY = 0.82;

/** Carica un File come data-URL. */
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Lettura file fallita"));
    reader.readAsDataURL(file);
  });
}

/** Carica un data-URL in un elemento Image. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Immagine non valida"));
    img.src = src;
  });
}

/**
 * Ridimensiona/ricomprime un'immagine (File o data-URL) e restituisce un data-URL
 * JPEG con lato lungo ≤ maxDim. Se qualcosa va storto, ritorna l'originale come
 * data-URL così l'app non si blocca mai.
 */
export async function downscaleImage(
  input: File | string,
  maxDim: number = MAX_DIMENSION,
  quality: number = JPEG_QUALITY,
): Promise<string> {
  let originalDataUrl: string;
  try {
    originalDataUrl = typeof input === "string" ? input : await readFileAsDataUrl(input);
  } catch {
    // Non dovrebbe capitare; in extremis non abbiamo nulla da restituire.
    throw new Error("Impossibile leggere l'immagine selezionata.");
  }

  try {
    const img = await loadImage(originalDataUrl);
    const { naturalWidth: w, naturalHeight: h } = img;
    if (!w || !h) return originalDataUrl;

    // Già abbastanza piccola: non tocchiamo nulla.
    if (Math.max(w, h) <= maxDim) return originalDataUrl;

    const ratio = maxDim / Math.max(w, h);
    const targetW = Math.round(w * ratio);
    const targetH = Math.round(h * ratio);

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return originalDataUrl;

    ctx.drawImage(img, 0, 0, targetW, targetH);
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    // Se il ridimensionamento fallisce, meglio l'originale che un crash.
    return originalDataUrl;
  }
}
