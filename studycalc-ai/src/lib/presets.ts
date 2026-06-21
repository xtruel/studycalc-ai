import { Preset } from "../types";

/**
 * Esercizi di prova predefiniti — statici lato client così l'app funziona
 * anche su hosting statico (GitHub Pages) e dentro l'APK Android, senza backend.
 */
export const PRESETS: Preset[] = [
  {
    id: "exp1",
    title: "Espressione algebrica (Medie)",
    level: "Medie",
    description: "Risolvi espressioni con frazioni e potenze",
    text: "Calcola la seguente espressione: (1/2 + 3/4) * 2^2 - 1/8",
  },
  {
    id: "eq1",
    title: "Equazione di secondo grado (Superiori)",
    level: "Superiori",
    description: "Trova le soluzioni reali di un'equazione quadratica",
    text: "Risolvi l'equazione di secondo grado: 2x^2 - 5x + 3 = 0",
  },
  {
    id: "geo1",
    title: "Problema di Geometria (Medie)",
    level: "Medie",
    description: "Calcola area e perimetro di un rettangolo",
    text: "In un rettangolo la base supera l'altezza di 4 cm e il loro rapporto è 5/3. Calcola l'area e la lunghezza della diagonale.",
  },
  {
    id: "excel1",
    title: "Calcolo Voti & Foglio Excel (Tabelle)",
    level: "Tutti",
    description: "Formule Excel per calcolare media ponderata voti",
    text: "Ho una tabella con i seguenti voti scritti nelle celle B2, B3, B4, B5: 6.5, 7.5, 8.0, 5.0. Come calcolo la media dei voti escludendo il voto insufficiente o calcolando la media totale con una formula Excel?",
  },
];
