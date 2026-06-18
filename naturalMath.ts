/**
 * Convertitore "linguaggio naturale → matematica simbolica", multilingua.
 *
 * Capisce calcoli scritti a parole in IT / EN / ES / FR / DE / PT (con tolleranza
 * ai refusi tramite prefissi di parola), es.:
 *   "moltipca 4 per 4"        -> "4 * 4"
 *   "multiply 4 by 4"          -> "(4)*(4)"
 *   "3 alla terza"             -> "3 ^3"
 *   "3 to the power of 4"      -> "3 ^ 4"
 *   "quadrato di 2"            -> "(2)^2"
 *   "square root of 16"        -> "sqrt(16)"
 *   "racine de 16"             -> "sqrt(16)"
 *   "2 più 2 diviso 4"         -> "2 + 2 / 4"
 *
 * Il lessico è UNIFICATO: le parole di tutte le lingue mappano sugli stessi simboli,
 * quindi l'input viene capito in qualsiasi lingua supportata senza doverla impostare.
 */

export type Lang = "it" | "en" | "es" | "fr" | "de" | "pt";

// Numero/argomento: un numero (anche decimale, virgola o punto) oppure un gruppo tra parentesi.
const ARG = "(\\([^()]*\\)|\\d+(?:[.,]\\d+)?)";

// Ordinali → esponente (multilingua)
const ORDINALS: Record<string, number> = {
  // it
  seconda: 2, terza: 3, quarta: 4, quinta: 5, sesta: 6, settima: 7, ottava: 8, nona: 9, decima: 10,
  // en
  second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  // es
  segunda: 2, tercera: 3, cuarta: 4, quinta_es: 5,
  // fr
  deuxième: 2, troisième: 3, quatrième: 4, cinquième: 5, carré_ord: 2,
  // de
  zweite: 2, dritte: 3, vierte: 4,
  // pt
  terceira: 3, quarta_pt: 4,
};

// Numeri scritti a parole → cifre (multilingua, set essenziale 0–12)
const NUMBER_WORDS: Record<string, number> = {
  // it
  zero: 0, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12,
  // en
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  // es
  dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  // fr
  deux: 2, trois: 3, quatre: 4, cinq: 5, sept: 7, huit: 8, neuf: 9, dix: 10,
  // de
  eins: 1, zwei: 2, drei: 3, vier: 4, fünf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9, zehn: 10,
  // pt
  um: 1, dois: 2, três: 3, quatro_pt: 4, cinco_pt: 5,
};

// Confini di parola UNICODE-aware (il \b di JS è solo ASCII e rompe su ù, á, é...).
const WCH = "a-zà-ÿ0-9";
const L = `(?<![${WCH}])`; // niente lettera/cifra prima
const R = `(?![${WCH}])`; // niente lettera/cifra dopo
const re = (body: string, flags = "gi") => new RegExp(body, flags);
/** parola/alternanza con confini unicode-aware */
const w = (alt: string) => `${L}(?:${alt})${R}`;

/**
 * Applica le sostituzioni dal linguaggio naturale. Restituisce una stringa
 * che il parser simbolico può interpretare (numeri + operatori).
 */
export function naturalToSymbolic(input: string): string {
  let s = " " + input.toLowerCase() + " ";

  // 0) normalizza simboli matematici unicode usati al posto delle parole
  s = s.replace(/×|·|∙/g, "*").replace(/÷/g, "/").replace(/−|–|—/g, "-");

  // 1) verbi binari con due operandi espliciti: "moltiplica A per B", "multiply A by B"...
  s = s.replace(
    re(`${w("molt\\w*|multipl\\w*|multipli\\w*")}\\s+${ARG}\\s+${w("per|by|por|par|mit|times|vezes")}\\s+${ARG}`),
    " ($1)*($2) ",
  );
  s = s.replace(
    re(`${w("divid\\w*|divis\\w*|divus\\w*|teil\\w*|dividir\\w*")}\\s+${ARG}\\s+${w("per|by|por|par|durch|entre|sur|fratto")}\\s+${ARG}`),
    " ($1)/($2) ",
  );
  s = s.replace(
    re(`${w("somm\\w*|sum\\w*|add\\w*|adicion\\w*|addier\\w*|addition\\w*")}\\s+${ARG}\\s+${w("to|and|a|e|con|y|et|und|più|piu|plus|mas|más|mais")}\\s+${ARG}`),
    " ($1)+($2) ",
  );
  s = s.replace(
    re(`${w("sottra\\w*|subtract\\w*|resta\\w*|soustrai\\w*|subtrahier\\w*|subtrai\\w*")}\\s+${ARG}\\s+${w("from|da|de|von|a")}\\s+${ARG}`),
    " ($2)-($1) ",
  );

  // 2) radici e quadrati/cubi (forma prefissa "di/of/de/von X")
  const OF = "(?:di|of|de|von|del|della)";
  s = s.replace(re(`${w("radic\\w*|square\\s+root|root|ra[ií]z\\w*|racine\\w*|wurzel|quadratwurzel")}\\s+(?:quadrat\\w*\\s+)?${OF}\\s+${ARG}`), " sqrt($1) ");
  s = s.replace(re(`${w("quadrat\\w*|square|cuadrad\\w*|carr[ée]\\w*|quadrad\\w*")}\\s+${OF}\\s+${ARG}`), " ($1)^2 ");
  s = s.replace(re(`${w("cub\\w*|cube|kubik")}\\s+${OF}\\s+${ARG}`), " ($1)^3 ");

  // 3) forme postfisse: "X al quadrato", "X squared", "X au carré", ...
  s = s.replace(re(w("al\\s+quadrato|squared|al\\s+cuadrado|au\\s+carr[ée]|zum\\s+quadrat|ao\\s+quadrado|quadriert")), " ^2 ");
  s = s.replace(re(w("al\\s+cubo|cubed|au\\s+cube|ao\\s+cubo")), " ^3 ");

  // 4) potenza esplicita: "elevato a", "to the power of", "à la puissance", "hoch", ...
  s = s.replace(re(w("elevato\\s+alla\\s+potenza\\s+di|elevato\\s+a(?:lla)?|alla\\s+potenza\\s+di|elevado\\s+a(?:\\s+la\\s+potencia\\s+de)?|raised\\s+to\\s+the\\s+power\\s+of|to\\s+the\\s+power\\s+of|raised\\s+to|[àa]\\s+la\\s+puissance(?:\\s+de)?|puissance|hoch")), " ^ ");

  // 5) ordinali (alla terza/to the third...) -> cifra
  s = s.replace(re(`${L}[a-zà-ÿ]+${R}`), (m) => {
    const k = m.toLowerCase();
    return ORDINALS[k] != null ? String(ORDINALS[k]) : m;
  });
  // "alla 3" / "al" residuo prima di un numero -> "^"
  s = s.replace(re("(?:alla|allo|all'|al)\\s+(?=\\d)"), " ^ ");

  // 6) operatori infissi a parola (multi-parola prima)
  s = s.replace(re(w("multiplied\\s+by|moltiplicato\\s+per|multiplicado\\s+por|multipli[ée]\\s+par|multipliziert\\s+mit")), " * ");
  s = s.replace(re(w("divided\\s+by|diviso\\s+per|dividido\\s+por|dividido\\s+entre|divis[ée]\\s+par|geteilt\\s+durch")), " / ");
  s = s.replace(re(w("per|times|por|fois|mal|vezes")), " * ");
  s = s.replace(re(w("diviso|fratto|over|entre|durch|sur")), " / ");
  s = s.replace(re(w("più|piu|plus|más|mas|mais")), " + ");
  s = s.replace(re(w("meno|minus|menos|moins|weniger")), " - ");

  // 7) "x" tra due numeri (es. "4 x 4") -> moltiplicazione
  s = s.replace(/(\d)\s*[x]\s*(?=\d)/gi, "$1*");

  // 8) numeri a parole -> cifre
  s = s.replace(re(`${L}[a-zà-ÿ]+${R}`), (m) => {
    const k = m.toLowerCase();
    return NUMBER_WORDS[k] != null ? String(NUMBER_WORDS[k]) : m;
  });

  // 9) "uguale (a)" -> "="
  s = s.replace(re(w("uguale\\s+a|uguale|equals|equal\\s+to|igual\\s+a|égal\\s+[àa]|gleich")), " = ");

  // 10) parole di cortesia residue
  s = s.replace(re(w("per\\s+favore|please|por\\s+favor|s'il\\s+vous\\s+pla[îi]t|bitte")), " ");

  // pulizia spazi
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Rileva la lingua dell'input contando parole-spia distintive per lingua.
 * Restituisce null se non abbastanza segnali (così si usa la lingua corrente).
 */
export function detectLang(input: string): Lang | null {
  const s = " " + input.toLowerCase() + " ";
  const score: Record<Lang, number> = { it: 0, en: 0, es: 0, fr: 0, de: 0, pt: 0 };
  const hit = (lang: Lang, re: RegExp, w = 1) => {
    const m = s.match(re);
    if (m) score[lang] += m.length * w;
  };
  hit("it", /\b(calcola|risolvi|moltiplica|diviso|più|meno|quadrato|radice|equazione|alla|per favore|svolgi)\b/g, 2);
  hit("en", /\b(calculate|solve|multiply|divide|times|plus|minus|square|root|power|equation|please|what)\b/g, 2);
  hit("es", /\b(calcula|resuelve|multiplica|divide|más|menos|cuadrado|raíz|ecuación|por favor|cuánto)\b/g, 2);
  hit("fr", /\b(calcule|résous|multiplie|divise|plus|moins|carré|racine|équation|puissance|combien)\b/g, 2);
  hit("de", /\b(berechne|löse|multipliziere|geteilt|durch|hoch|wurzel|quadrat|gleichung|wie viel|bitte)\b/g, 2);
  hit("pt", /\b(calcula|resolva|multiplica|dividido|mais|menos|quadrado|raiz|equação|quanto|por favor)\b/g, 2);

  let best: Lang | null = null;
  let max = 0;
  (Object.keys(score) as Lang[]).forEach((l) => {
    if (score[l] > max) {
      max = score[l];
      best = l;
    }
  });
  return max >= 2 ? best : null;
}
