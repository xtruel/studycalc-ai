/**
 * Stringhe localizzate del motore di calcolo (risposte passo-passo).
 * 6 lingue: it, en, es, fr, de, pt. Gli step numerici sono quasi tutti formule,
 * quindi qui servono solo etichette/frasi brevi. Placeholder ammessi: {n} {x} {x1} {x2} {sum} {prod} {descr} {detail} {formula}.
 */
import type { Lang } from "./naturalMath";

export interface Labels {
  // intestazioni di sezione (devono restare riconoscibili dal parser della UI)
  h_recognized: string;
  h_method: string;
  h_steps: string;
  h_result: string;
  h_check: string;
  h_excel: string;
  // espressione
  expr_recognized: string; // prefisso, seguito da $...$
  expr_method_exact: string;
  expr_method_float: string;
  expr_steps: string;
  decimal_pre: string;
  expr_check: string; // usa {n}
  // equazioni
  eq_first: string;
  eq_second: string;
  eq_identity: string;
  in_unknown: string; // "nell'incognita x"
  lin_method: string;
  quad_method: string;
  coefficients: string; // "Coefficienti"
  discriminant: string; // "Discriminante"
  sqrt_delta: string; // "√Δ ="
  no_real: string; // usa {d}=disc, frase "Δ<0 → nessuna soluzione reale"
  no_real_check: string;
  double_sol: string; // "Δ=0 → soluzione doppia"
  subst_check: string; // usa {x}
  subst_check2: string; // usa {x1} {x2}
  vieta_check: string; // usa {sum} {prod}
  identity_result: string;
  identity_check: string;
  impossible_result: string;
  impossible_check: string;
  // excel
  ex_recognized: string; // prefisso + {descr}
  ex_method: string;
  ex_steps: string;
  ex_result: string;
  ex_check: string;
  // fallback immagine
  img: string[]; // 5 righe (recognized, method, steps, result, check) — già con \n interni
  // fallback generico
  gen_recognized: string; // usa {q}
  gen_recognized_img: string;
  gen_method: string;
  gen_steps: string;
  gen_result: string;
  gen_check: string;
  // excel: descrizioni per tipo (descr|detail) — chiavi: avg, sum, weighted, condif, vlookup, percent, max, min
  exDescr: Record<string, string>;
  exDetail: Record<string, string>;
}

// Nomi funzioni Excel localizzati (Office cambia nome funzione per lingua)
export const FN: Record<string, Record<Lang, string>> = {
  AVERAGE: { it: "MEDIA", en: "AVERAGE", es: "PROMEDIO", fr: "MOYENNE", de: "MITTELWERT", pt: "MÉDIA" },
  SUM: { it: "SOMMA", en: "SUM", es: "SUMA", fr: "SOMME", de: "SUMME", pt: "SOMA" },
  AVERAGEIF: { it: "MEDIA.SE", en: "AVERAGEIF", es: "PROMEDIO.SI", fr: "MOYENNE.SI", de: "MITTELWERTWENN", pt: "MÉDIA.SE" },
  VLOOKUP: { it: "CERCA.VERT", en: "VLOOKUP", es: "BUSCARV", fr: "RECHERCHEV", de: "SVERWEIS", pt: "PROCV" },
  SUMPRODUCT: { it: "MATR.SOMMA.PRODOTTO", en: "SUMPRODUCT", es: "SUMAPRODUCTO", fr: "SOMMEPROD", de: "SUMMENPRODUKT", pt: "SOMARPRODUTO" },
  MAX: { it: "MAX", en: "MAX", es: "MAX", fr: "MAX", de: "MAX", pt: "MÁXIMO" },
  MIN: { it: "MIN", en: "MIN", es: "MIN", fr: "MIN", de: "MIN", pt: "MÍNIMO" },
};

export const PACKS: Record<Lang, Labels> = {
  it: {
    h_recognized: "Esercizio riconosciuto", h_method: "Metodo", h_steps: "Svolgimento passo passo",
    h_result: "Risultato finale", h_check: "Controllo errori", h_excel: "Formula Excel",
    expr_recognized: "Calcolo di un'espressione numerica:",
    expr_method_exact: "Si applica l'ordine delle operazioni (parentesi, potenze, poi ×÷, infine +−), mantenendo i risultati in frazione esatta.",
    expr_method_float: "Si applica l'ordine delle operazioni valutando funzioni e costanti in forma decimale.",
    expr_steps: "1. Si rispettano le precedenze degli operatori.\n2. Prima potenze e funzioni, poi prodotti/divisioni, infine somme/sottrazioni.\n3. Combinando i termini si ottiene il valore finale.",
    decimal_pre: "In forma decimale:", expr_check: "Ricalcolando in modo indipendente si ottiene $\\approx {n}$: risultato verificato. ✅",
    eq_first: "Equazione di primo grado", eq_second: "Equazione di secondo grado", eq_identity: "Identità / equazione costante",
    in_unknown: "nell'incognita $x$", lin_method: "Si isola l'incognita: $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "Si usa la formula risolutiva $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ con $\\Delta = b^2 - 4ac$.",
    coefficients: "Coefficienti", discriminant: "Discriminante", sqrt_delta: "quindi",
    no_real: "Poiché $\\Delta < 0$, non esistono soluzioni reali.", no_real_check: "Il discriminante negativo conferma l'assenza di radici reali. ✅",
    double_sol: "Poiché $\\Delta = 0$, c'è una soluzione doppia.",
    subst_check: "Sostituendo $x = {x}$ nell'equazione di partenza i due membri risultano uguali. ✅",
    subst_check2: "Sostituendo $x_1 = {x1}$ e $x_2 = {x2}$ entrambe soddisfano l'equazione. ✅",
    vieta_check: "Per Vieta: $x_1 + x_2 \\approx {sum}$ e $x_1 \\cdot x_2 \\approx {prod}$, coerenti. ✅",
    identity_result: "$$\\text{Identità: vera per ogni } x \\in \\mathbb{R}$$", identity_check: "I due membri coincidono per ogni $x$. ✅",
    impossible_result: "$$\\text{Nessuna soluzione (equazione impossibile)}$$", impossible_check: "I due membri non possono mai essere uguali: nessuna soluzione. ✅",
    ex_recognized: "Richiesta di una formula per foglio di calcolo:", ex_method: "Si individua la funzione adatta e l'intervallo di celle. Adatta gli intervalli (es. B2:B10) alle tue celle.",
    ex_steps: "1. Individua l'intervallo di celle con i dati.\n2. Scegli la funzione adatta.\n3. Inserisci la formula in una cella e premi Invio.",
    ex_result: "Usa la formula indicata qui sotto.", ex_check: "Verifica che gli intervalli coincidano coi tuoi dati e che non ci siano celle vuote o testo dove servono numeri. ✅",
    img: [
      "Hai caricato un'immagine. Il riconoscimento del testo da foto (OCR) richiede il modello AI in cloud, non attivo in modalità locale.",
      "Trascrivi l'esercizio come testo: un'espressione (es. (1/2 + 3/4)*2^2 - 1/8) o un'equazione (es. 2x^2 - 5x + 3 = 0).",
      "1. Leggi la traccia.\n2. Scrivila in chat.\n3. Invia: il motore locale la risolverà passo passo.",
      "In attesa del testo dell'esercizio. ✍️",
      "Suggerimento: usa ^ per le potenze, / per le frazioni e sqrt(...) per le radici.",
    ],
    gen_recognized: 'Richiesta: "{q}". Non ho individuato un\'espressione o un\'equazione da calcolare direttamente.',
    gen_recognized_img: "Immagine ricevuta, ma il testo va trascritto per il calcolo locale.",
    gen_method: "Il calcolo locale gestisce: espressioni numeriche (frazioni, potenze, radici, funzioni), equazioni di 1° e 2° grado e formule per fogli di calcolo. I problemi a parole vanno tradotti in espressione o equazione.",
    gen_steps: "1. Individua i dati numerici.\n2. Scrivi la relazione come espressione o equazione (es. area: base*altezza; equazione: 2x+3=11).\n3. Invia il calcolo.",
    gen_result: "Pronto a calcolare appena ricevo un'espressione o un'equazione. 🧮",
    gen_check: "Esempi validi: (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "calcolare la media dei valori in un intervallo", sum: "sommare un intervallo di celle", weighted: "calcolare una media ponderata (voti × pesi)", condif: "calcolare la media solo dei valori che rispettano una condizione (es. voti ≥ 6)", vlookup: "cercare un valore in una tabella e restituire un dato corrispondente", percent: "applicare una percentuale (es. IVA al 22%)", max: "trovare il valore massimo", min: "trovare il valore minimo" },
    exDetail: { avg: "calcola la media aritmetica dei valori dell'intervallo.", sum: "addiziona tutti i valori numerici dell'intervallo.", weighted: "moltiplica voti e pesi cella per cella e li somma; dividendo per la somma dei pesi si ottiene la media ponderata.", condif: "calcola la media dei soli valori che soddisfano il criterio tra virgolette.", vlookup: "cerca il valore nella prima colonna e restituisce il dato della colonna indicata (FALSO = corrispondenza esatta).", percent: "moltiplica il valore per (1 + percentuale).", max: "restituisce il valore più grande dell'intervallo.", min: "restituisce il valore più piccolo dell'intervallo." },
  },
  en: {
    h_recognized: "Recognized exercise", h_method: "Method", h_steps: "Step-by-step solution",
    h_result: "Final result", h_check: "Error check", h_excel: "Excel formula",
    expr_recognized: "Numeric expression calculation:",
    expr_method_exact: "Apply operator precedence (parentheses, powers, then ×÷, finally +−), keeping results as exact fractions.",
    expr_method_float: "Apply operator precedence, evaluating functions and constants in decimal form.",
    expr_steps: "1. Respect operator precedence.\n2. Powers and functions first, then ×÷, finally +−.\n3. Combine the terms to get the final value.",
    decimal_pre: "In decimal form:", expr_check: "Recomputing independently gives $\\approx {n}$: result verified. ✅",
    eq_first: "First-degree equation", eq_second: "Second-degree equation", eq_identity: "Identity / constant equation",
    in_unknown: "in the unknown $x$", lin_method: "Isolate the unknown: $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "Use the quadratic formula $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ with $\\Delta = b^2 - 4ac$.",
    coefficients: "Coefficients", discriminant: "Discriminant", sqrt_delta: "so",
    no_real: "Since $\\Delta < 0$, there are no real solutions.", no_real_check: "The negative discriminant confirms there are no real roots. ✅",
    double_sol: "Since $\\Delta = 0$, there is a double solution.",
    subst_check: "Substituting $x = {x}$ into the original equation, both sides are equal. ✅",
    subst_check2: "Substituting $x_1 = {x1}$ and $x_2 = {x2}$, both satisfy the equation. ✅",
    vieta_check: "By Vieta: $x_1 + x_2 \\approx {sum}$ and $x_1 \\cdot x_2 \\approx {prod}$, consistent. ✅",
    identity_result: "$$\\text{Identity: true for every } x \\in \\mathbb{R}$$", identity_check: "Both sides coincide for any $x$. ✅",
    impossible_result: "$$\\text{No solution (impossible equation)}$$", impossible_check: "The two sides can never be equal: no solution. ✅",
    ex_recognized: "Request for a spreadsheet formula:", ex_method: "Pick the right function and the cell range. Adapt the ranges (e.g. B2:B10) to your cells.",
    ex_steps: "1. Identify the cell range with your data.\n2. Choose the right function.\n3. Type the formula into a cell and press Enter.",
    ex_result: "Use the formula shown below.", ex_check: "Check that the ranges match your data and there are no empty cells or text where numbers are expected. ✅",
    img: [
      "You uploaded an image. Text recognition from photos (OCR) needs the cloud AI model, which is off in local mode.",
      "Type the exercise as text: an expression (e.g. (1/2 + 3/4)*2^2 - 1/8) or an equation (e.g. 2x^2 - 5x + 3 = 0).",
      "1. Read the problem.\n2. Type it in the chat.\n3. Send it: the local engine will solve it step by step.",
      "Waiting for the exercise text. ✍️",
      "Tip: use ^ for powers, / for fractions and sqrt(...) for roots.",
    ],
    gen_recognized: 'Request: "{q}". I could not find an expression or equation to compute directly.',
    gen_recognized_img: "Image received, but the text must be typed for local computation.",
    gen_method: "Local computation handles: numeric expressions (fractions, powers, roots, functions), first/second-degree equations and spreadsheet formulas. Word problems must be translated into an expression or equation.",
    gen_steps: "1. Identify the numeric data.\n2. Write the relation as an expression or equation (e.g. area: base*height; equation: 2x+3=11).\n3. Send the calculation.",
    gen_result: "Ready to compute as soon as I get an expression or an equation. 🧮",
    gen_check: "Valid examples: (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "average the values in a range", sum: "sum a range of cells", weighted: "compute a weighted average (grades × weights)", condif: "average only the values meeting a condition (e.g. grades ≥ 6)", vlookup: "look up a value in a table and return a matching item", percent: "apply a percentage (e.g. 22% VAT)", max: "find the maximum value", min: "find the minimum value" },
    exDetail: { avg: "computes the arithmetic mean of the range.", sum: "adds all numeric values in the range.", weighted: "multiplies grades and weights cell by cell and sums them; dividing by the sum of weights gives the weighted average.", condif: "averages only the values meeting the quoted criterion.", vlookup: "looks up the value in the first column and returns the chosen column (FALSE = exact match).", percent: "multiplies the value by (1 + percentage).", max: "returns the largest value in the range.", min: "returns the smallest value in the range." },
  },
  es: {
    h_recognized: "Ejercicio reconocido", h_method: "Método", h_steps: "Resolución paso a paso",
    h_result: "Resultado final", h_check: "Comprobación", h_excel: "Fórmula Excel",
    expr_recognized: "Cálculo de una expresión numérica:",
    expr_method_exact: "Se aplica el orden de las operaciones (paréntesis, potencias, luego ×÷, por último +−), manteniendo fracciones exactas.",
    expr_method_float: "Se aplica el orden de las operaciones evaluando funciones y constantes en forma decimal.",
    expr_steps: "1. Se respeta la precedencia de los operadores.\n2. Primero potencias y funciones, luego ×÷, por último +−.\n3. Combinando los términos se obtiene el valor final.",
    decimal_pre: "En forma decimal:", expr_check: "Recalculando de forma independiente se obtiene $\\approx {n}$: resultado verificado. ✅",
    eq_first: "Ecuación de primer grado", eq_second: "Ecuación de segundo grado", eq_identity: "Identidad / ecuación constante",
    in_unknown: "en la incógnita $x$", lin_method: "Se despeja la incógnita: $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "Se usa la fórmula $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ con $\\Delta = b^2 - 4ac$.",
    coefficients: "Coeficientes", discriminant: "Discriminante", sqrt_delta: "por lo que",
    no_real: "Como $\\Delta < 0$, no existen soluciones reales.", no_real_check: "El discriminante negativo confirma que no hay raíces reales. ✅",
    double_sol: "Como $\\Delta = 0$, hay una solución doble.",
    subst_check: "Sustituyendo $x = {x}$ en la ecuación original, ambos miembros son iguales. ✅",
    subst_check2: "Sustituyendo $x_1 = {x1}$ y $x_2 = {x2}$, ambas satisfacen la ecuación. ✅",
    vieta_check: "Por Vieta: $x_1 + x_2 \\approx {sum}$ y $x_1 \\cdot x_2 \\approx {prod}$, coherentes. ✅",
    identity_result: "$$\\text{Identidad: verdadera para todo } x \\in \\mathbb{R}$$", identity_check: "Ambos miembros coinciden para cualquier $x$. ✅",
    impossible_result: "$$\\text{Sin solución (ecuación imposible)}$$", impossible_check: "Los dos miembros nunca pueden ser iguales: sin solución. ✅",
    ex_recognized: "Solicitud de una fórmula de hoja de cálculo:", ex_method: "Se elige la función adecuada y el rango de celdas. Adapta los rangos (p. ej. B2:B10) a tus celdas.",
    ex_steps: "1. Identifica el rango de celdas con los datos.\n2. Elige la función adecuada.\n3. Escribe la fórmula en una celda y pulsa Intro.",
    ex_result: "Usa la fórmula indicada abajo.", ex_check: "Comprueba que los rangos coincidan con tus datos y que no haya celdas vacías o texto donde se esperan números. ✅",
    img: [
      "Has subido una imagen. El reconocimiento de texto de fotos (OCR) requiere el modelo de IA en la nube, desactivado en modo local.",
      "Escribe el ejercicio como texto: una expresión (p. ej. (1/2 + 3/4)*2^2 - 1/8) o una ecuación (p. ej. 2x^2 - 5x + 3 = 0).",
      "1. Lee el enunciado.\n2. Escríbelo en el chat.\n3. Envíalo: el motor local lo resolverá paso a paso.",
      "Esperando el texto del ejercicio. ✍️",
      "Consejo: usa ^ para potencias, / para fracciones y sqrt(...) para raíces.",
    ],
    gen_recognized: 'Solicitud: "{q}". No encontré una expresión o ecuación para calcular directamente.',
    gen_recognized_img: "Imagen recibida, pero el texto debe escribirse para el cálculo local.",
    gen_method: "El cálculo local maneja: expresiones numéricas (fracciones, potencias, raíces, funciones), ecuaciones de 1.º y 2.º grado y fórmulas de hoja de cálculo. Los problemas de palabras deben traducirse a una expresión o ecuación.",
    gen_steps: "1. Identifica los datos numéricos.\n2. Escribe la relación como expresión o ecuación (p. ej. área: base*altura; ecuación: 2x+3=11).\n3. Envía el cálculo.",
    gen_result: "Listo para calcular en cuanto reciba una expresión o una ecuación. 🧮",
    gen_check: "Ejemplos válidos: (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "calcular el promedio de un rango", sum: "sumar un rango de celdas", weighted: "calcular un promedio ponderado (notas × pesos)", condif: "promediar solo los valores que cumplen una condición (p. ej. notas ≥ 6)", vlookup: "buscar un valor en una tabla y devolver un dato", percent: "aplicar un porcentaje (p. ej. 22% de IVA)", max: "encontrar el valor máximo", min: "encontrar el valor mínimo" },
    exDetail: { avg: "calcula la media aritmética del rango.", sum: "suma todos los valores numéricos del rango.", weighted: "multiplica notas y pesos celda a celda y los suma; dividiendo por la suma de pesos se obtiene el promedio ponderado.", condif: "promedia solo los valores que cumplen el criterio entre comillas.", vlookup: "busca el valor en la primera columna y devuelve la columna indicada (FALSO = coincidencia exacta).", percent: "multiplica el valor por (1 + porcentaje).", max: "devuelve el mayor valor del rango.", min: "devuelve el menor valor del rango." },
  },
  fr: {
    h_recognized: "Exercice reconnu", h_method: "Méthode", h_steps: "Résolution pas à pas",
    h_result: "Résultat final", h_check: "Vérification", h_excel: "Formule Excel",
    expr_recognized: "Calcul d'une expression numérique :",
    expr_method_exact: "On applique l'ordre des opérations (parenthèses, puissances, puis ×÷, enfin +−), en gardant des fractions exactes.",
    expr_method_float: "On applique l'ordre des opérations en évaluant fonctions et constantes sous forme décimale.",
    expr_steps: "1. On respecte la priorité des opérateurs.\n2. D'abord puissances et fonctions, puis ×÷, enfin +−.\n3. En combinant les termes on obtient la valeur finale.",
    decimal_pre: "Sous forme décimale :", expr_check: "Un recalcul indépendant donne $\\approx {n}$ : résultat vérifié. ✅",
    eq_first: "Équation du premier degré", eq_second: "Équation du second degré", eq_identity: "Identité / équation constante",
    in_unknown: "d'inconnue $x$", lin_method: "On isole l'inconnue : $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "On utilise la formule $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ avec $\\Delta = b^2 - 4ac$.",
    coefficients: "Coefficients", discriminant: "Discriminant", sqrt_delta: "donc",
    no_real: "Comme $\\Delta < 0$, il n'y a pas de solutions réelles.", no_real_check: "Le discriminant négatif confirme l'absence de racines réelles. ✅",
    double_sol: "Comme $\\Delta = 0$, il y a une solution double.",
    subst_check: "En remplaçant $x = {x}$ dans l'équation de départ, les deux membres sont égaux. ✅",
    subst_check2: "En remplaçant $x_1 = {x1}$ et $x_2 = {x2}$, les deux satisfont l'équation. ✅",
    vieta_check: "Par Viète : $x_1 + x_2 \\approx {sum}$ et $x_1 \\cdot x_2 \\approx {prod}$, cohérents. ✅",
    identity_result: "$$\\text{Identité : vraie pour tout } x \\in \\mathbb{R}$$", identity_check: "Les deux membres coïncident pour tout $x$. ✅",
    impossible_result: "$$\\text{Aucune solution (équation impossible)}$$", impossible_check: "Les deux membres ne peuvent jamais être égaux : aucune solution. ✅",
    ex_recognized: "Demande d'une formule de tableur :", ex_method: "On choisit la bonne fonction et la plage de cellules. Adapte les plages (ex. B2:B10) à tes cellules.",
    ex_steps: "1. Repère la plage de cellules contenant les données.\n2. Choisis la bonne fonction.\n3. Saisis la formule dans une cellule et appuie sur Entrée.",
    ex_result: "Utilise la formule indiquée ci-dessous.", ex_check: "Vérifie que les plages correspondent à tes données et qu'il n'y a pas de cellules vides ou de texte là où des nombres sont attendus. ✅",
    img: [
      "Tu as téléversé une image. La reconnaissance de texte (OCR) nécessite le modèle IA en cloud, désactivé en mode local.",
      "Saisis l'exercice en texte : une expression (ex. (1/2 + 3/4)*2^2 - 1/8) ou une équation (ex. 2x^2 - 5x + 3 = 0).",
      "1. Lis l'énoncé.\n2. Écris-le dans le chat.\n3. Envoie : le moteur local le résoudra pas à pas.",
      "En attente du texte de l'exercice. ✍️",
      "Astuce : utilise ^ pour les puissances, / pour les fractions et sqrt(...) pour les racines.",
    ],
    gen_recognized: 'Demande : « {q} ». Je n\'ai pas trouvé d\'expression ou d\'équation à calculer directement.',
    gen_recognized_img: "Image reçue, mais le texte doit être saisi pour le calcul local.",
    gen_method: "Le calcul local gère : expressions numériques (fractions, puissances, racines, fonctions), équations du 1er et 2nd degré et formules de tableur. Les problèmes en mots doivent être traduits en expression ou équation.",
    gen_steps: "1. Repère les données numériques.\n2. Écris la relation en expression ou équation (ex. aire : base*hauteur ; équation : 2x+3=11).\n3. Envoie le calcul.",
    gen_result: "Prêt à calculer dès que je reçois une expression ou une équation. 🧮",
    gen_check: "Exemples valides : (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "faire la moyenne d'une plage", sum: "additionner une plage de cellules", weighted: "calculer une moyenne pondérée (notes × coefficients)", condif: "ne moyenner que les valeurs remplissant une condition (ex. notes ≥ 6)", vlookup: "rechercher une valeur dans un tableau et renvoyer une donnée", percent: "appliquer un pourcentage (ex. TVA 22%)", max: "trouver la valeur maximale", min: "trouver la valeur minimale" },
    exDetail: { avg: "calcule la moyenne arithmétique de la plage.", sum: "additionne toutes les valeurs numériques de la plage.", weighted: "multiplie notes et coefficients cellule par cellule et les somme ; en divisant par la somme des coefficients on obtient la moyenne pondérée.", condif: "ne moyenne que les valeurs remplissant le critère entre guillemets.", vlookup: "cherche la valeur dans la première colonne et renvoie la colonne choisie (FAUX = correspondance exacte).", percent: "multiplie la valeur par (1 + pourcentage).", max: "renvoie la plus grande valeur de la plage.", min: "renvoie la plus petite valeur de la plage." },
  },
  de: {
    h_recognized: "Erkannte Aufgabe", h_method: "Methode", h_steps: "Schritt-für-Schritt-Lösung",
    h_result: "Endergebnis", h_check: "Fehlerprüfung", h_excel: "Excel-Formel",
    expr_recognized: "Berechnung eines numerischen Ausdrucks:",
    expr_method_exact: "Es gilt die Operator-Rangfolge (Klammern, Potenzen, dann ×÷, zuletzt +−); Ergebnisse bleiben als exakte Brüche.",
    expr_method_float: "Es gilt die Operator-Rangfolge; Funktionen und Konstanten werden dezimal ausgewertet.",
    expr_steps: "1. Die Operator-Rangfolge wird beachtet.\n2. Zuerst Potenzen und Funktionen, dann ×÷, zuletzt +−.\n3. Durch Zusammenfassen der Terme ergibt sich der Endwert.",
    decimal_pre: "In Dezimalform:", expr_check: "Eine unabhängige Neuberechnung ergibt $\\approx {n}$: Ergebnis bestätigt. ✅",
    eq_first: "Lineare Gleichung (1. Grad)", eq_second: "Quadratische Gleichung (2. Grad)", eq_identity: "Identität / konstante Gleichung",
    in_unknown: "mit Unbekannter $x$", lin_method: "Die Unbekannte wird isoliert: $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "Es wird die Lösungsformel $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ mit $\\Delta = b^2 - 4ac$ verwendet.",
    coefficients: "Koeffizienten", discriminant: "Diskriminante", sqrt_delta: "also",
    no_real: "Da $\\Delta < 0$, gibt es keine reellen Lösungen.", no_real_check: "Die negative Diskriminante bestätigt: keine reellen Wurzeln. ✅",
    double_sol: "Da $\\Delta = 0$, gibt es eine doppelte Lösung.",
    subst_check: "Einsetzen von $x = {x}$ in die Ausgangsgleichung: beide Seiten sind gleich. ✅",
    subst_check2: "Einsetzen von $x_1 = {x1}$ und $x_2 = {x2}$: beide erfüllen die Gleichung. ✅",
    vieta_check: "Nach Vieta: $x_1 + x_2 \\approx {sum}$ und $x_1 \\cdot x_2 \\approx {prod}$, stimmig. ✅",
    identity_result: "$$\\text{Identität: wahr für alle } x \\in \\mathbb{R}$$", identity_check: "Beide Seiten stimmen für jedes $x$ überein. ✅",
    impossible_result: "$$\\text{Keine Lösung (unmögliche Gleichung)}$$", impossible_check: "Die beiden Seiten können nie gleich sein: keine Lösung. ✅",
    ex_recognized: "Anfrage nach einer Tabellenkalkulations-Formel:", ex_method: "Passende Funktion und Zellbereich wählen. Passe die Bereiche (z. B. B2:B10) an deine Zellen an.",
    ex_steps: "1. Bestimme den Zellbereich mit den Daten.\n2. Wähle die passende Funktion.\n3. Gib die Formel in eine Zelle ein und drücke Enter.",
    ex_result: "Verwende die unten angegebene Formel.", ex_check: "Prüfe, dass die Bereiche zu deinen Daten passen und keine leeren Zellen oder Text vorkommen, wo Zahlen erwartet werden. ✅",
    img: [
      "Du hast ein Bild hochgeladen. Texterkennung aus Fotos (OCR) braucht das Cloud-KI-Modell, das im lokalen Modus aus ist.",
      "Gib die Aufgabe als Text ein: einen Ausdruck (z. B. (1/2 + 3/4)*2^2 - 1/8) oder eine Gleichung (z. B. 2x^2 - 5x + 3 = 0).",
      "1. Lies die Aufgabe.\n2. Tippe sie in den Chat.\n3. Sende sie: die lokale Engine löst sie Schritt für Schritt.",
      "Warte auf den Aufgabentext. ✍️",
      "Tipp: ^ für Potenzen, / für Brüche und sqrt(...) für Wurzeln.",
    ],
    gen_recognized: 'Anfrage: „{q}". Ich habe keinen Ausdruck oder keine Gleichung zum direkten Berechnen gefunden.',
    gen_recognized_img: "Bild erhalten, aber der Text muss für die lokale Berechnung eingegeben werden.",
    gen_method: "Die lokale Berechnung kann: numerische Ausdrücke (Brüche, Potenzen, Wurzeln, Funktionen), Gleichungen 1. und 2. Grades und Tabellenformeln. Textaufgaben müssen in einen Ausdruck oder eine Gleichung übersetzt werden.",
    gen_steps: "1. Bestimme die Zahlenwerte.\n2. Schreibe die Beziehung als Ausdruck oder Gleichung (z. B. Fläche: Basis*Höhe; Gleichung: 2x+3=11).\n3. Sende die Berechnung.",
    gen_result: "Bereit zu rechnen, sobald ich einen Ausdruck oder eine Gleichung erhalte. 🧮",
    gen_check: "Gültige Beispiele: (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "den Mittelwert eines Bereichs berechnen", sum: "einen Zellbereich summieren", weighted: "einen gewichteten Mittelwert berechnen (Noten × Gewichte)", condif: "nur Werte mitteln, die eine Bedingung erfüllen (z. B. Noten ≥ 6)", vlookup: "einen Wert in einer Tabelle suchen und einen Eintrag zurückgeben", percent: "einen Prozentsatz anwenden (z. B. 22% MwSt.)", max: "den Maximalwert finden", min: "den Minimalwert finden" },
    exDetail: { avg: "berechnet das arithmetische Mittel des Bereichs.", sum: "addiert alle Zahlenwerte des Bereichs.", weighted: "multipliziert Noten und Gewichte zellenweise und summiert sie; geteilt durch die Summe der Gewichte ergibt den gewichteten Mittelwert.", condif: "mittelt nur die Werte, die das Kriterium in Anführungszeichen erfüllen.", vlookup: "sucht den Wert in der ersten Spalte und gibt die gewählte Spalte zurück (FALSCH = exakte Übereinstimmung).", percent: "multipliziert den Wert mit (1 + Prozentsatz).", max: "gibt den größten Wert des Bereichs zurück.", min: "gibt den kleinsten Wert des Bereichs zurück." },
  },
  pt: {
    h_recognized: "Exercício reconhecido", h_method: "Método", h_steps: "Resolução passo a passo",
    h_result: "Resultado final", h_check: "Verificação", h_excel: "Fórmula Excel",
    expr_recognized: "Cálculo de uma expressão numérica:",
    expr_method_exact: "Aplica-se a ordem das operações (parênteses, potências, depois ×÷, por fim +−), mantendo frações exatas.",
    expr_method_float: "Aplica-se a ordem das operações avaliando funções e constantes na forma decimal.",
    expr_steps: "1. Respeita-se a precedência dos operadores.\n2. Primeiro potências e funções, depois ×÷, por fim +−.\n3. Combinando os termos obtém-se o valor final.",
    decimal_pre: "Na forma decimal:", expr_check: "Recalculando de forma independente obtém-se $\\approx {n}$: resultado verificado. ✅",
    eq_first: "Equação do primeiro grau", eq_second: "Equação do segundo grau", eq_identity: "Identidade / equação constante",
    in_unknown: "na incógnita $x$", lin_method: "Isola-se a incógnita: $ax + b = 0 \\Rightarrow x = -\\dfrac{b}{a}$.",
    quad_method: "Usa-se a fórmula $x = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$ com $\\Delta = b^2 - 4ac$.",
    coefficients: "Coeficientes", discriminant: "Discriminante", sqrt_delta: "portanto",
    no_real: "Como $\\Delta < 0$, não existem soluções reais.", no_real_check: "O discriminante negativo confirma a ausência de raízes reais. ✅",
    double_sol: "Como $\\Delta = 0$, há uma solução dupla.",
    subst_check: "Substituindo $x = {x}$ na equação original, os dois membros são iguais. ✅",
    subst_check2: "Substituindo $x_1 = {x1}$ e $x_2 = {x2}$, ambas satisfazem a equação. ✅",
    vieta_check: "Por Vieta: $x_1 + x_2 \\approx {sum}$ e $x_1 \\cdot x_2 \\approx {prod}$, coerentes. ✅",
    identity_result: "$$\\text{Identidade: verdadeira para todo } x \\in \\mathbb{R}$$", identity_check: "Os dois membros coincidem para qualquer $x$. ✅",
    impossible_result: "$$\\text{Sem solução (equação impossível)}$$", impossible_check: "Os dois membros nunca podem ser iguais: sem solução. ✅",
    ex_recognized: "Pedido de uma fórmula de folha de cálculo:", ex_method: "Escolhe-se a função adequada e o intervalo de células. Adapta os intervalos (ex. B2:B10) às tuas células.",
    ex_steps: "1. Identifica o intervalo de células com os dados.\n2. Escolhe a função adequada.\n3. Escreve a fórmula numa célula e prime Enter.",
    ex_result: "Usa a fórmula indicada abaixo.", ex_check: "Verifica que os intervalos coincidem com os teus dados e que não há células vazias ou texto onde se esperam números. ✅",
    img: [
      "Carregaste uma imagem. O reconhecimento de texto de fotos (OCR) requer o modelo de IA na nuvem, desativado no modo local.",
      "Escreve o exercício como texto: uma expressão (ex. (1/2 + 3/4)*2^2 - 1/8) ou uma equação (ex. 2x^2 - 5x + 3 = 0).",
      "1. Lê o enunciado.\n2. Escreve-o no chat.\n3. Envia: o motor local resolve-o passo a passo.",
      "A aguardar o texto do exercício. ✍️",
      "Dica: usa ^ para potências, / para frações e sqrt(...) para raízes.",
    ],
    gen_recognized: 'Pedido: "{q}". Não encontrei uma expressão ou equação para calcular diretamente.',
    gen_recognized_img: "Imagem recebida, mas o texto deve ser escrito para o cálculo local.",
    gen_method: "O cálculo local trata: expressões numéricas (frações, potências, raízes, funções), equações do 1.º e 2.º grau e fórmulas de folha de cálculo. Os problemas por palavras devem ser traduzidos em expressão ou equação.",
    gen_steps: "1. Identifica os dados numéricos.\n2. Escreve a relação como expressão ou equação (ex. área: base*altura; equação: 2x+3=11).\n3. Envia o cálculo.",
    gen_result: "Pronto a calcular assim que receber uma expressão ou uma equação. 🧮",
    gen_check: "Exemplos válidos: (1/2 + 3/4)*2^2 - 1/8, 2x^2 - 5x + 3 = 0, sqrt(144) + 3^2.",
    exDescr: { avg: "calcular a média de um intervalo", sum: "somar um intervalo de células", weighted: "calcular uma média ponderada (notas × pesos)", condif: "calcular a média só dos valores que cumprem uma condição (ex. notas ≥ 6)", vlookup: "procurar um valor numa tabela e devolver um dado", percent: "aplicar uma percentagem (ex. IVA 22%)", max: "encontrar o valor máximo", min: "encontrar o valor mínimo" },
    exDetail: { avg: "calcula a média aritmética do intervalo.", sum: "soma todos os valores numéricos do intervalo.", weighted: "multiplica notas e pesos célula a célula e soma-os; dividindo pela soma dos pesos obtém-se a média ponderada.", condif: "calcula a média só dos valores que cumprem o critério entre aspas.", vlookup: "procura o valor na primeira coluna e devolve a coluna indicada (FALSO = correspondência exata).", percent: "multiplica o valor por (1 + percentagem).", max: "devolve o maior valor do intervalo.", min: "devolve o menor valor do intervalo." },
  },
};

type SectionKey = "h_recognized" | "h_method" | "h_steps" | "h_result" | "h_check" | "h_excel";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Alternanza regex delle intestazioni di UNA sezione in tutte le lingue. */
export function headingAlternation(section: SectionKey): string {
  const set = new Set<string>();
  (Object.keys(PACKS) as Lang[]).forEach((l) => set.add(PACKS[l][section]));
  return Array.from(set).map(escapeRe).join("|");
}

/** Alternanza regex di TUTTE le intestazioni in tutte le lingue (per il lookahead del parser). */
export function anyHeadingAlternation(): string {
  const sections: SectionKey[] = ["h_recognized", "h_method", "h_steps", "h_result", "h_check", "h_excel"];
  const set = new Set<string>();
  (Object.keys(PACKS) as Lang[]).forEach((l) => sections.forEach((s) => set.add(PACKS[l][s])));
  return Array.from(set).map(escapeRe).join("|");
}
