/**
 * BigDecimal — aritmetica decimale a precisione arbitraria basata su BigInt.
 *
 * Perché esiste questo modulo?
 *   I tipi `number` di JavaScript sono float IEEE-754 a 64 bit: hanno solo ~15-17
 *   cifre significative e introducono errori di arrotondamento (il classico
 *   `0.1 + 0.2 === 0.30000000000000004`). Per una calcolatrice che deve mostrare
 *   ">133 cifre dopo la virgola" senza errori, i float non bastano.
 *
 * Come funziona?
 *   Ogni numero è rappresentato come   value = coeff × 10^(-scale)
 *   dove `coeff` è un BigInt (mantissa intera, precisione illimitata) e `scale`
 *   è il numero di cifre decimali. Tutte le operazioni restano ESATTE finché
 *   possibile; solo la divisione e la radice — che possono dare infinite cifre —
 *   vengono troncate a una precisione configurabile (default 200 cifre, ben oltre
 *   le 133 richieste).
 *
 * Niente `Number()`, niente `Math.*`, niente float: solo BigInt.
 */

/** Precisione di default (cifre decimali) per divisioni e radici non esatte. */
export const DEFAULT_PRECISION = 200;

function abs(a: bigint): bigint {
  return a < 0n ? -a : a;
}

/** 10^n come BigInt (n >= 0). */
function pow10(n: number): bigint {
  return 10n ** BigInt(n);
}

export class BigDecimal {
  /** mantissa intera con segno */
  readonly coeff: bigint;
  /** numero di cifre decimali: value = coeff / 10^scale */
  readonly scale: number;

  constructor(coeff: bigint, scale: number) {
    if (scale < 0) {
      // normalizza scale negativa moltiplicando la mantissa
      coeff = coeff * pow10(-scale);
      scale = 0;
    }
    this.coeff = coeff;
    this.scale = scale;
  }

  // ---- Costruttori ---------------------------------------------------------

  /**
   * Crea un BigDecimal da una stringa. Accetta:
   *   "123", "-0.5", "+12.000", ".5", "1_000.25", "1e-3", "2.5E10"
   * Lancia un Error se la stringa non è un numero valido (input non valido).
   */
  static parse(input: string): BigDecimal {
    if (input == null) throw new Error("Input non valido (vuoto)");
    let s = String(input).trim().replace(/_/g, "").replace(/\s/g, "");
    if (s === "") throw new Error("Input non valido (vuoto)");

    // notazione scientifica: separa la mantissa dall'esponente
    let exp = 0;
    const eIdx = s.search(/[eE]/);
    if (eIdx !== -1) {
      const expPart = s.slice(eIdx + 1);
      if (!/^[+-]?\d+$/.test(expPart)) throw new Error(`Input non valido: ${input}`);
      exp = parseInt(expPart, 10);
      s = s.slice(0, eIdx);
    }

    if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) {
      throw new Error(`Input non valido: ${input}`);
    }

    let neg = false;
    if (s[0] === "+") s = s.slice(1);
    else if (s[0] === "-") {
      neg = true;
      s = s.slice(1);
    }

    const [intPart, fracPart = ""] = s.split(".");
    const digits = (intPart + fracPart) || "0";
    let coeff = BigInt(digits);
    if (neg) coeff = -coeff;
    let scale = fracPart.length;

    // applica l'esponente decimale spostando lo scale
    scale -= exp;
    if (scale < 0) {
      coeff = coeff * pow10(-scale);
      scale = 0;
    }
    return new BigDecimal(coeff, scale);
  }

  static fromBigInt(v: bigint): BigDecimal {
    return new BigDecimal(v, 0);
  }

  static readonly ZERO = new BigDecimal(0n, 0);
  static readonly ONE = new BigDecimal(1n, 0);

  // ---- Helper interni ------------------------------------------------------

  /** Riporta due numeri allo stesso scale, restituendo le mantisse allineate. */
  private static align(a: BigDecimal, b: BigDecimal): [bigint, bigint, number] {
    if (a.scale === b.scale) return [a.coeff, b.coeff, a.scale];
    if (a.scale > b.scale) {
      return [a.coeff, b.coeff * pow10(a.scale - b.scale), a.scale];
    }
    return [a.coeff * pow10(b.scale - a.scale), b.coeff, b.scale];
  }

  // ---- Operazioni ----------------------------------------------------------

  add(o: BigDecimal): BigDecimal {
    const [ca, cb, sc] = BigDecimal.align(this, o);
    return new BigDecimal(ca + cb, sc).strip();
  }

  sub(o: BigDecimal): BigDecimal {
    const [ca, cb, sc] = BigDecimal.align(this, o);
    return new BigDecimal(ca - cb, sc).strip();
  }

  mul(o: BigDecimal): BigDecimal {
    return new BigDecimal(this.coeff * o.coeff, this.scale + o.scale).strip();
  }

  /**
   * Divisione lunga a precisione arbitraria.
   * @param precision cifre decimali da calcolare (default DEFAULT_PRECISION).
   * Il risultato è troncato+arrotondato (round-half-up) a `precision` cifre.
   */
  div(o: BigDecimal, precision: number = DEFAULT_PRECISION): BigDecimal {
    if (o.coeff === 0n) throw new Error("Divisione per zero");
    if (this.coeff === 0n) return BigDecimal.ZERO;

    // value = (this.coeff / 10^this.scale) / (o.coeff / 10^o.scale)
    //       =  this.coeff * 10^o.scale / (o.coeff * 10^this.scale)
    // Vogliamo `precision` cifre decimali: scaliamo il numeratore di 10^(precision+1)
    // per poter arrotondare l'ultima cifra.
    const guard = precision + 1;
    let num = this.coeff * pow10(o.scale + guard);
    const den = o.coeff * pow10(this.scale);

    const neg = (num < 0n) !== (den < 0n);
    num = abs(num);
    const aden = abs(den);

    let q = num / aden;
    const r = num % aden;
    // arrotondamento round-half-up sull'ultima (guard) cifra
    if (r * 2n >= aden) q += 1n;

    let result = new BigDecimal(neg ? -q : q, guard);
    // rimuovi la cifra di guardia arrotondando
    result = result.roundTo(precision);
    return result.strip();
  }

  /** Potenza con esponente intero (anche negativo). */
  pow(exp: number, precision: number = DEFAULT_PRECISION): BigDecimal {
    if (!Number.isInteger(exp)) {
      throw new Error("Esponente non intero non supportato da pow()");
    }
    if (exp === 0) return BigDecimal.ONE;
    const neg = exp < 0;
    let e = Math.abs(exp);
    // esponenziazione veloce (square-and-multiply), tutto esatto
    let base: BigDecimal = this;
    let acc = BigDecimal.ONE;
    while (e > 0) {
      if (e & 1) acc = acc.mul(base);
      e >>= 1;
      if (e > 0) base = base.mul(base);
    }
    if (neg) return BigDecimal.ONE.div(acc, precision);
    return acc.strip();
  }

  /**
   * Radice quadrata a precisione arbitraria (metodo di Newton su interi scalati).
   * Lancia se il numero è negativo.
   */
  sqrt(precision: number = DEFAULT_PRECISION): BigDecimal {
    if (this.coeff < 0n) throw new Error("Radice quadrata di un numero negativo");
    if (this.coeff === 0n) return BigDecimal.ZERO;

    // Lavoriamo sull'intero  N = coeff * 10^(2*precision - scale)  e calcoliamo isqrt(N).
    // Il risultato avrà `precision` cifre decimali: sqrt(value)*10^precision = isqrt(N).
    let shift = 2 * precision - this.scale;
    let N = this.coeff;
    if (shift >= 0) {
      N = N * pow10(shift);
    } else {
      // scale dispari/grande: riduci N (perdita oltre la precisione richiesta)
      N = N / pow10(-shift);
    }
    const root = BigDecimal.isqrt(N);
    return new BigDecimal(root, precision).strip();
  }

  /** Radice quadrata intera (floor) via Newton, su BigInt. */
  static isqrt(n: bigint): bigint {
    if (n < 0n) throw new Error("isqrt di un numero negativo");
    if (n < 2n) return n;
    // stima iniziale basata sul numero di bit
    let x = 1n << (BigInt(n.toString(2).length) >> 1n) + 1n;
    for (;;) {
      const y = (x + n / x) >> 1n;
      if (y >= x) break;
      x = y;
    }
    while (x * x > n) x -= 1n;
    return x;
  }

  /** Percentuale: questo% di `of` (es. 22.percentOf(50) = 11). */
  percentOf(of: BigDecimal, precision: number = DEFAULT_PRECISION): BigDecimal {
    return this.div(new BigDecimal(100n, 0), precision).mul(of);
  }

  /** Converte il numero in percentuale (×100). */
  toPercent(): BigDecimal {
    return this.mul(new BigDecimal(100n, 0));
  }

  neg(): BigDecimal {
    return new BigDecimal(-this.coeff, this.scale);
  }

  abs(): BigDecimal {
    return this.coeff < 0n ? this.neg() : this;
  }

  // ---- Confronti -----------------------------------------------------------

  cmp(o: BigDecimal): number {
    const [ca, cb] = BigDecimal.align(this, o);
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  }
  eq(o: BigDecimal): boolean {
    return this.cmp(o) === 0;
  }
  isZero(): boolean {
    return this.coeff === 0n;
  }
  isNegative(): boolean {
    return this.coeff < 0n;
  }

  // ---- Arrotondamento / formattazione -------------------------------------

  /** Arrotonda a `dp` cifre decimali (round-half-up). */
  roundTo(dp: number): BigDecimal {
    if (dp >= this.scale) return this;
    const drop = this.scale - dp;
    const factor = pow10(drop);
    const neg = this.coeff < 0n;
    let q = abs(this.coeff) / factor;
    const r = abs(this.coeff) % factor;
    if (r * 2n >= factor) q += 1n;
    return new BigDecimal(neg ? -q : q, dp);
  }

  /** Rimuove gli zeri decimali finali superflui senza alterare il valore. */
  strip(): BigDecimal {
    if (this.scale === 0 || this.coeff === 0n) {
      return this.coeff === 0n ? new BigDecimal(0n, 0) : this;
    }
    let c = this.coeff;
    let s = this.scale;
    while (s > 0 && c % 10n === 0n) {
      c /= 10n;
      s--;
    }
    return new BigDecimal(c, s);
  }

  /**
   * Stringa decimale ESATTA e completa (mai notazione scientifica).
   * È il "valore vero" da conservare internamente.
   */
  toString(): string {
    const neg = this.coeff < 0n;
    let digits = abs(this.coeff).toString();
    if (this.scale === 0) return (neg ? "-" : "") + digits;
    if (digits.length <= this.scale) {
      digits = "0".repeat(this.scale - digits.length + 1) + digits;
    }
    const intPart = digits.slice(0, digits.length - this.scale);
    const fracPart = digits.slice(digits.length - this.scale).replace(/0+$/, "");
    const sign = neg ? "-" : "";
    return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
  }

  /**
   * Formattazione leggibile per la UI, SENZA perdere il valore reale.
   * @param maxDecimals numero massimo di cifre decimali da mostrare (default 12).
   *   Il valore esatto resta disponibile via toString(); questa funzione serve
   *   solo alla visualizzazione.
   * @param opts.grouping inserisce i separatori delle migliaia (default false).
   * @returns { display, exact, truncated }
   */
  format(
    maxDecimals = 12,
    opts: { grouping?: boolean } = {},
  ): { display: string; exact: string; truncated: boolean } {
    const exact = this.toString();
    const rounded = this.roundTo(maxDecimals).strip();
    const truncated = rounded.scale < this.scale || this.cmp(rounded) !== 0;

    let str = rounded.toString();
    if (opts.grouping) {
      const neg = str.startsWith("-");
      if (neg) str = str.slice(1);
      const [ip, fp] = str.split(".");
      const grouped = ip.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
      str = (neg ? "-" : "") + (fp ? `${grouped}.${fp}` : grouped);
    }
    return { display: str, exact, truncated };
  }
}
