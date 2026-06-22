/**
 * StudyCalc AI — Motore di calcolo LOCALE (assistente offline, nessuna chiave API).
 *
 * Risolve in locale, direttamente nel codice:
 *  - espressioni aritmetiche con frazioni esatte, potenze, radici, funzioni (sin/cos/tan/log/ln/sqrt), π, e
 *  - equazioni di 1° e 2° grado nell'incognita x
 *  - suggerimenti di formule Excel/fogli di calcolo
 *
 * Produce SEMPRE una risposta nel formato Markdown a sezioni che la UI sa interpretare:
 *   **Esercizio riconosciuto** / **Metodo** / **Svolgimento passo passo**
 *   / **Risultato finale** / **Controllo errori** / **Formula Excel** (opzionale)
 *
 * Multilingua: capisce input in IT/EN/ES/FR/DE/PT (vedi naturalMath) e risponde
 * nella lingua scelta (vedi solverI18n).
 */
import { Lang, naturalToSymbolic } from "./naturalMath";
import { PACKS, Labels, FN } from "./solverI18n";
import { BigDecimal } from "./bigdecimal";

// Quante cifre decimali calcolare/mostrare nelle approssimazioni decimali.
// Ben oltre le 133 richieste; il valore esatto resta sempre la frazione.
export const DECIMAL_DIGITS = 150;

// ----------------------------------------------------------------------------
// Aritmetica razionale esatta (con BigInt per evitare overflow)
// ----------------------------------------------------------------------------

function babs(a: bigint): bigint {
  return a < 0n ? -a : a;
}
function bgcd(a: bigint, b: bigint): bigint {
  a = babs(a);
  b = babs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1n;
}

class Frac {
  n: bigint;
  d: bigint;
  constructor(n: bigint, d: bigint = 1n) {
    if (d === 0n) throw new Error("Divisione per zero");
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    const g = bgcd(n, d);
    this.n = n / g;
    this.d = d / g;
  }
  static fromInt(i: number | bigint): Frac {
    return new Frac(BigInt(i));
  }
  /** Costruisce una frazione da una stringa decimale tipo "3.5" oppure "12". */
  static fromDecimal(s: string): Frac {
    s = s.trim();
    if (!/^-?\d+(\.\d+)?$/.test(s)) throw new Error(`Numero non valido: ${s}`);
    const neg = s.startsWith("-");
    if (neg) s = s.slice(1);
    const [intPart, decPart = ""] = s.split(".");
    const den = 10n ** BigInt(decPart.length);
    const num = BigInt(intPart + decPart);
    return new Frac(neg ? -num : num, den);
  }
  add(o: Frac): Frac {
    return new Frac(this.n * o.d + o.n * this.d, this.d * o.d);
  }
  sub(o: Frac): Frac {
    return new Frac(this.n * o.d - o.n * this.d, this.d * o.d);
  }
  mul(o: Frac): Frac {
    return new Frac(this.n * o.n, this.d * o.d);
  }
  div(o: Frac): Frac {
    if (o.n === 0n) throw new Error("Divisione per zero");
    return new Frac(this.n * o.d, this.d * o.n);
  }
  powInt(e: bigint): Frac {
    if (e < 0n) return new Frac(this.d ** -e, this.n ** -e);
    return new Frac(this.n ** e, this.d ** e);
  }
  neg(): Frac {
    return new Frac(-this.n, this.d);
  }
  isInt(): boolean {
    return this.d === 1n;
  }
  isZero(): boolean {
    return this.n === 0n;
  }
  cmp(o: Frac): number {
    const l = this.n * o.d;
    const r = o.n * this.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  toNumber(): number {
    return Number(this.n) / Number(this.d);
  }
  /** Converte in BigDecimal esatto (divisione lunga a precisione arbitraria). */
  toBigDecimal(digits: number = DECIMAL_DIGITS): BigDecimal {
    return BigDecimal.fromBigInt(this.n).div(BigDecimal.fromBigInt(this.d), digits);
  }
  /** Stringa decimale ad alta precisione (es. 0.3333...150 cifre). */
  toDecimalString(digits: number = DECIMAL_DIGITS): string {
    return this.toBigDecimal(digits).toString();
  }
  /** true se la frazione ha rappresentazione decimale finita (denominatore = 2^a·5^b). */
  isTerminating(): boolean {
    let d = this.d;
    while (d % 2n === 0n) d /= 2n;
    while (d % 5n === 0n) d /= 5n;
    return d === 1n;
  }
  /** Rappresentazione testuale "a/b" oppure intero. */
  toString(): string {
    return this.isInt() ? this.n.toString() : `${this.n}/${this.d}`;
  }
  /** Rappresentazione LaTeX: \frac{a}{b} oppure intero. */
  toLatex(): string {
    if (this.isInt()) return this.n.toString();
    const sign = this.n < 0n ? "-" : "";
    return `${sign}\\frac{${babs(this.n)}}{${this.d}}`;
  }
}

// ----------------------------------------------------------------------------
// Tokenizer + parser (discesa ricorsiva) → AST
// ----------------------------------------------------------------------------

type Node =
  | { t: "num"; v: string }
  | { t: "const"; v: "pi" | "e" }
  | { t: "var"; v: string }
  | { t: "neg"; a: Node }
  | { t: "bin"; op: "+" | "-" | "*" | "/" | "^"; a: Node; b: Node }
  | { t: "func"; name: string; a: Node };

const FUNCS = ["sqrt", "sin", "cos", "tan", "log", "ln"];

/** Normalizza i simboli matematici unicode in ASCII gestibile dal parser. */
function normalizeMath(input: string): string {
  let s = input;
  s = s.replace(/×|·|∙/g, "*");
  s = s.replace(/÷|:/g, "/");
  s = s.replace(/−|–|—/g, "-");
  s = s.replace(/√/g, "sqrt");
  s = s.replace(/π/g, "pi");
  s = s.replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4");
  s = s.replace(/[{\[]/g, "(").replace(/[}\]]/g, ")");
  // virgola decimale italiana tra cifre → punto
  s = s.replace(/(\d),(\d)/g, "$1.$2");
  return s;
}

class Parser {
  private pos = 0;
  constructor(private readonly s: string) {}

  parse(): Node {
    const node = this.parseExpr();
    this.skipWs();
    if (this.pos < this.s.length) {
      throw new Error(`Carattere inatteso: "${this.s[this.pos]}"`);
    }
    return node;
  }

  private skipWs() {
    while (this.pos < this.s.length && /\s/.test(this.s[this.pos])) this.pos++;
  }
  private peek(): string {
    this.skipWs();
    return this.s[this.pos] ?? "";
  }

  private parseExpr(): Node {
    let left = this.parseTerm();
    for (;;) {
      const c = this.peek();
      if (c === "+" || c === "-") {
        this.pos++;
        const right = this.parseTerm();
        left = { t: "bin", op: c, a: left, b: right };
      } else break;
    }
    return left;
  }

  private parseTerm(): Node {
    let left = this.parseFactor();
    for (;;) {
      const c = this.peek();
      if (c === "*" || c === "/") {
        this.pos++;
        const right = this.parseFactor();
        left = { t: "bin", op: c, a: left, b: right };
      } else if (c === "(" || /[a-zA-Z]/.test(c)) {
        // moltiplicazione implicita: 2(3+1), 2x, 3pi
        const right = this.parseFactor();
        left = { t: "bin", op: "*", a: left, b: right };
      } else break;
    }
    return left;
  }

  private parseFactor(): Node {
    const c = this.peek();
    if (c === "-") {
      this.pos++;
      return { t: "neg", a: this.parseFactor() };
    }
    if (c === "+") {
      this.pos++;
      return this.parseFactor();
    }
    const base = this.parseBase();
    if (this.peek() === "^") {
      this.pos++;
      const exp = this.parseFactor(); // right-assoc
      return { t: "bin", op: "^", a: base, b: exp };
    }
    return base;
  }

  private parseBase(): Node {
    this.skipWs();
    const c = this.s[this.pos] ?? "";
    if (c === "(") {
      this.pos++;
      const e = this.parseExpr();
      if (this.peek() !== ")") throw new Error("Parentesi ) mancante");
      this.pos++;
      return e;
    }
    if (/[0-9.]/.test(c)) {
      let num = "";
      while (this.pos < this.s.length && /[0-9.]/.test(this.s[this.pos])) {
        num += this.s[this.pos++];
      }
      return { t: "num", v: num };
    }
    if (/[a-zA-Z]/.test(c)) {
      let name = "";
      while (this.pos < this.s.length && /[a-zA-Z]/.test(this.s[this.pos])) {
        name += this.s[this.pos++];
      }
      const lname = name.toLowerCase();
      if (FUNCS.includes(lname)) {
        if (this.peek() !== "(") throw new Error(`Manca "(" dopo ${lname}`);
        this.pos++;
        const arg = this.parseExpr();
        if (this.peek() !== ")") throw new Error("Parentesi ) mancante");
        this.pos++;
        return { t: "func", name: lname, a: arg };
      }
      if (lname === "pi") return { t: "const", v: "pi" };
      if (lname === "e") return { t: "const", v: "e" };
      if (lname.length === 1) return { t: "var", v: lname };
      throw new Error(`Simbolo non riconosciuto: ${name}`);
    }
    throw new Error(`Espressione non valida vicino a "${c}"`);
  }
}

// ----------------------------------------------------------------------------
// Valutatori
// ----------------------------------------------------------------------------

/** Valuta esattamente in razionali. Lancia se incontra funzioni/variabili/esponenti non interi. */
function evalRational(n: Node): Frac {
  switch (n.t) {
    case "num":
      return Frac.fromDecimal(n.v);
    case "const":
      throw new Error("Costante irrazionale: serve valutazione decimale");
    case "var":
      throw new Error("Variabile presente");
    case "func":
      throw new Error("Funzione presente: serve valutazione decimale");
    case "neg":
      return evalRational(n.a).neg();
    case "bin": {
      if (n.op === "^") {
        const exp = evalRational(n.b);
        if (!exp.isInt()) throw new Error("Esponente non intero");
        return evalRational(n.a).powInt(exp.n);
      }
      const a = evalRational(n.a);
      const b = evalRational(n.b);
      if (n.op === "+") return a.add(b);
      if (n.op === "-") return a.sub(b);
      if (n.op === "*") return a.mul(b);
      return a.div(b);
    }
  }
}

/** Valuta in virgola mobile (gestisce funzioni, π, e, radici, ecc.). */
function evalFloat(n: Node): number {
  switch (n.t) {
    case "num":
      return parseFloat(n.v);
    case "const":
      return n.v === "pi" ? Math.PI : Math.E;
    case "var":
      throw new Error("Variabile non valutabile numericamente");
    case "neg":
      return -evalFloat(n.a);
    case "func": {
      const x = evalFloat(n.a);
      switch (n.name) {
        case "sqrt":
          if (x < 0) throw new Error("Radice di un numero negativo");
          return Math.sqrt(x);
        case "sin":
          return Math.sin(x);
        case "cos":
          return Math.cos(x);
        case "tan":
          return Math.tan(x);
        case "log":
          return Math.log10(x);
        case "ln":
          return Math.log(x);
        default:
          throw new Error(`Funzione sconosciuta: ${n.name}`);
      }
    }
    case "bin": {
      const a = evalFloat(n.a);
      const b = evalFloat(n.b);
      switch (n.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return a / b;
        case "^":
          return Math.pow(a, b);
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Valutazione come polinomio in x (per le equazioni)
// ----------------------------------------------------------------------------

class Poly {
  // coeff[i] = coefficiente di x^i
  constructor(public coeff: Frac[]) {
    this.trim();
  }
  static const(f: Frac): Poly {
    return new Poly([f]);
  }
  static x(): Poly {
    return new Poly([new Frac(0n), new Frac(1n)]);
  }
  private trim() {
    while (this.coeff.length > 1 && this.coeff[this.coeff.length - 1].isZero()) {
      this.coeff.pop();
    }
    if (this.coeff.length === 0) this.coeff = [new Frac(0n)];
  }
  degree(): number {
    return this.coeff.length - 1;
  }
  get(i: number): Frac {
    return this.coeff[i] ?? new Frac(0n);
  }
  add(o: Poly): Poly {
    const len = Math.max(this.coeff.length, o.coeff.length);
    const r: Frac[] = [];
    for (let i = 0; i < len; i++) r.push(this.get(i).add(o.get(i)));
    return new Poly(r);
  }
  sub(o: Poly): Poly {
    const len = Math.max(this.coeff.length, o.coeff.length);
    const r: Frac[] = [];
    for (let i = 0; i < len; i++) r.push(this.get(i).sub(o.get(i)));
    return new Poly(r);
  }
  mul(o: Poly): Poly {
    const r: Frac[] = Array.from(
      { length: this.coeff.length + o.coeff.length - 1 },
      () => new Frac(0n),
    );
    for (let i = 0; i < this.coeff.length; i++)
      for (let j = 0; j < o.coeff.length; j++)
        r[i + j] = r[i + j].add(this.coeff[i].mul(o.coeff[j]));
    return new Poly(r);
  }
  divConst(o: Poly): Poly {
    if (o.degree() !== 0) throw new Error("Divisione per un'espressione con incognita non supportata");
    return new Poly(this.coeff.map((c) => c.div(o.get(0))));
  }
  powInt(e: number): Poly {
    if (e < 0) throw new Error("Esponente negativo dell'incognita non supportato");
    let r = Poly.const(new Frac(1n));
    for (let i = 0; i < e; i++) r = r.mul(this);
    return r;
  }
}

function evalPoly(n: Node): Poly {
  switch (n.t) {
    case "num":
      return Poly.const(Frac.fromDecimal(n.v));
    case "const":
      throw new Error("Costante irrazionale non supportata nelle equazioni");
    case "var":
      return Poly.x();
    case "func":
      throw new Error("Funzioni non supportate nelle equazioni polinomiali");
    case "neg":
      return evalPoly(n.a).mul(Poly.const(new Frac(-1n)));
    case "bin": {
      if (n.op === "^") {
        const exp = evalRational(n.b);
        if (!exp.isInt() || exp.n < 0n) throw new Error("Esponente non intero positivo");
        return evalPoly(n.a).powInt(Number(exp.n));
      }
      const a = evalPoly(n.a);
      const b = evalPoly(n.b);
      if (n.op === "+") return a.add(b);
      if (n.op === "-") return a.sub(b);
      if (n.op === "*") return a.mul(b);
      return a.divConst(b);
    }
  }
}

// ----------------------------------------------------------------------------
// Helper di formattazione
// ----------------------------------------------------------------------------

function fmtNum(x: number, dec = 4): string {
  if (Number.isInteger(x)) return x.toString();
  const r = Number(x.toFixed(dec));
  return r.toString();
}

/** Prova a riconoscere un decimale come frazione semplice per il controllo. */
function approxEqual(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) < eps;
}

// ----------------------------------------------------------------------------
// Risolutori specifici
// ----------------------------------------------------------------------------

/** Comodo helper: blocco intestazione + corpo. */
function H(label: string): string {
  return `**${label}**`;
}

function solveExpression(raw: string, T: Labels): string {
  const norm = normalizeMath(raw);
  const ast = new Parser(norm).parse();

  let resultStr: string;
  let resultLatex: string;
  let resultNum: number;
  let exact = false;
  let fracResult: Frac | null = null;

  try {
    const f = evalRational(ast);
    exact = true;
    fracResult = f;
    resultStr = f.toString();
    resultLatex = f.toLatex();
    resultNum = f.toNumber();
  } catch {
    resultNum = evalFloat(ast);
    if (!Number.isFinite(resultNum)) throw new Error("Risultato non definito");
    resultStr = fmtNum(resultNum);
    resultLatex = fmtNum(resultNum);
  }

  // Riga decimale ad ALTA PRECISIONE per le frazioni esatte:
  //  - se il decimale è finito, lo mostriamo ESATTO (= …)
  //  - se è periodico/infinito, mostriamo 150 cifre esatte (≈ …, valore vero = frazione)
  let decimalLine = "";
  if (exact && fracResult && resultStr.includes("/")) {
    const terminating = fracResult.isTerminating();
    const dec = fracResult.toDecimalString(DECIMAL_DIGITS);
    const sym = terminating ? "=" : "\\approx";
    decimalLine = `\n${T.decimal_pre} $${sym} ${dec}$`;
  }

  return [
    H(T.h_recognized),
    `${T.expr_recognized} $${toLatexExpr(norm)}$`,
    "",
    H(T.h_method),
    exact ? T.expr_method_exact : T.expr_method_float,
    "",
    H(T.h_steps),
    T.expr_steps,
    "",
    H(T.h_result),
    `$$${resultLatex}$$${decimalLine}`,
    "",
    H(T.h_check),
    T.expr_check.replace("{n}", fmtNum(resultNum)),
  ].join("\n");
}

/** Conversione molto leggera dell'espressione normalizzata in LaTeX leggibile. */
function toLatexExpr(s: string): string {
  return s
    .replace(/sqrt\(([^()]*)\)/g, "\\sqrt{$1}")
    .replace(/\^(\d+)/g, "^{$1}")
    .replace(/\*/g, " \\cdot ")
    .replace(/\bpi\b/g, "\\pi ");
}

function solveEquation(raw: string, T: Labels): string {
  const norm = normalizeMath(raw);
  const sides = norm.split("=");
  if (sides.length !== 2) throw new Error("Un'equazione deve contenere un solo segno =");

  const left = evalPoly(new Parser(sides[0]).parse());
  const right = evalPoly(new Parser(sides[1]).parse());
  const p = left.sub(right); // P(x) = 0
  const deg = p.degree();

  const head = (kind: string) =>
    [
      H(T.h_recognized),
      `${kind}: $${sides[0].trim()} = ${sides[1].trim()}$, ${T.in_unknown}.`,
      "",
    ].join("\n");

  if (deg <= 0) {
    const isIdentity = p.get(0).isZero();
    return [
      head(T.eq_identity),
      H(T.h_steps),
      `1. $${p.get(0).toLatex()} = 0$.`,
      "",
      H(T.h_result),
      isIdentity ? T.identity_result : T.impossible_result,
      "",
      H(T.h_check),
      isIdentity ? T.identity_check : T.impossible_check,
    ].join("\n");
  }

  if (deg === 1) {
    const a = p.get(1); // a x + b = 0
    const b = p.get(0);
    const x = b.neg().div(a);
    return [
      head(T.eq_first),
      H(T.h_method),
      T.lin_method,
      "",
      H(T.h_steps),
      `1. $${a.toLatex()}\\,x + (${b.toLatex()}) = 0$.`,
      `2. $${a.toLatex()}\\,x = ${b.neg().toLatex()}$.`,
      `3. $x = \\dfrac{${b.neg().toLatex()}}{${a.toLatex()}} = ${x.toLatex()}$.`,
      "",
      H(T.h_result),
      `$$x = ${x.toLatex()}${x.isInt() ? "" : ` \\approx ${fmtNum(x.toNumber())}`}$$`,
      "",
      H(T.h_check),
      T.subst_check.replace("{x}", x.toString()),
    ].join("\n");
  }

  if (deg === 2) {
    const a = p.get(2);
    const b = p.get(1);
    const c = p.get(0);
    // Δ = b² - 4ac
    const disc = b.mul(b).sub(a.mul(c).mul(new Frac(4n)));
    const discNum = disc.toNumber();
    const lines: string[] = [
      head(T.eq_second),
      H(T.h_method),
      T.quad_method,
      "",
      H(T.h_steps),
      `1. ${T.coefficients}: $a = ${a.toLatex()}$, $b = ${b.toLatex()}$, $c = ${c.toLatex()}$.`,
      `2. ${T.discriminant}: $\\Delta = (${b.toLatex()})^2 - 4(${a.toLatex()})(${c.toLatex()}) = ${disc.toLatex()}$.`,
    ];

    let finalLine: string;
    let checkLine: string;
    if (discNum < 0) {
      lines.push(`3. ${T.no_real}`);
      finalLine = `$$\\Delta = ${disc.toLatex()} < 0 \\;\\Rightarrow\\; \\nexists\\, x \\in \\mathbb{R}$$`;
      checkLine = T.no_real_check;
    } else if (discNum === 0) {
      const x = b.neg().div(a.mul(new Frac(2n)));
      lines.push(`3. ${T.double_sol} $x = \\dfrac{-b}{2a} = ${x.toLatex()}$.`);
      finalLine = `$$x_1 = x_2 = ${x.toLatex()}${x.isInt() ? "" : ` \\approx ${fmtNum(x.toNumber())}`}$$`;
      checkLine = T.subst_check.replace("{x}", x.toString());
    } else {
      // radice esatta se Δ è quadrato perfetto razionale
      const exactRoot = perfectSqrtFrac(disc);
      if (exactRoot) {
        const x1f = b.neg().add(exactRoot).div(a.mul(new Frac(2n)));
        const x2f = b.neg().sub(exactRoot).div(a.mul(new Frac(2n)));
        lines.push(
          `3. $\\sqrt{\\Delta} = ${exactRoot.toLatex()}$, ${T.sqrt_delta} $x = \\dfrac{${b.neg().toLatex()} \\pm ${exactRoot.toLatex()}}{${a.mul(new Frac(2n)).toLatex()}}$.`,
        );
        finalLine = `$$x_1 = ${x1f.toLatex()}, \\quad x_2 = ${x2f.toLatex()}$$`;
        checkLine = T.subst_check2.replace("{x1}", x1f.toString()).replace("{x2}", x2f.toString());
      } else {
        // Δ irrazionale: radici ad ALTA PRECISIONE con BigDecimal (no float/Math.sqrt).
        const sqrtDisc = disc.toBigDecimal(DECIMAL_DIGITS).sqrt(DECIMAL_DIGITS);
        const twoA = a.mul(new Frac(2n)).toBigDecimal(DECIMAL_DIGITS);
        const negB = b.neg().toBigDecimal(DECIMAL_DIGITS);
        const x1 = negB.add(sqrtDisc).div(twoA, DECIMAL_DIGITS);
        const x2 = negB.sub(sqrtDisc).div(twoA, DECIMAL_DIGITS);
        const sd = sqrtDisc.format(6).display;
        lines.push(
          `3. $\\sqrt{\\Delta} \\approx ${sd}$, ${T.sqrt_delta} $x = \\dfrac{${b.neg().toLatex()} \\pm \\sqrt{${disc.toLatex()}}}{${a.mul(new Frac(2n)).toLatex()}}$.`,
        );
        finalLine = `$$x_1 \\approx ${x1.format(50).display}, \\quad x_2 \\approx ${x2.format(50).display}$$`;
        checkLine = T.vieta_check
          .replace("{sum}", x1.add(x2).format(8).display)
          .replace("{prod}", x1.mul(x2).format(8).display);
      }
    }
    lines.push("", H(T.h_result), finalLine, "", H(T.h_check), checkLine);
    return lines.join("\n");
  }

  throw new Error(`Equazione di grado ${deg}: il motore locale gestisce 1° e 2° grado.`);
}

/** Se Δ è il quadrato di un razionale, restituisce la radice esatta, altrimenti null. */
function perfectSqrtFrac(f: Frac): Frac | null {
  if (f.n < 0n) return null;
  const sn = bigintSqrt(f.n);
  const sd = bigintSqrt(f.d);
  if (sn * sn === f.n && sd * sd === f.d) return new Frac(sn, sd);
  return null;
}
function bigintSqrt(v: bigint): bigint {
  if (v < 0n) return -1n;
  if (v < 2n) return v;
  let x = v;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + v / x) / 2n;
  }
  return x;
}

// ----------------------------------------------------------------------------
// Excel / fogli di calcolo (euristica)
// ----------------------------------------------------------------------------

function solveExcel(raw: string, T: Labels, lang: Lang): string {
  const lower = raw.toLowerCase();
  const fn = (k: string) => FN[k][lang];
  let key = "avg";
  let formula = `=${fn("AVERAGE")}(B2:B10)`;
  let fname = fn("AVERAGE");

  if (/somma|totale|addizion|\bsum\b|suma|somme|summe|soma|total/.test(lower)) {
    key = "sum"; formula = `=${fn("SUM")}(B2:B10)`; fname = fn("SUM");
  } else if (/ponderat|weighted|ponderad|pond[ée]r|gewichtet/.test(lower)) {
    key = "weighted"; formula = `=${fn("SUMPRODUCT")}(B2:B5;C2:C5)/${fn("SUM")}(C2:C5)`; fname = fn("SUMPRODUCT");
  } else if (/esclud|insuffic|maggiore|condizion|\bse\b|exclud|condition|\bif\b|mayor|condici|sauf|bedingung|\bwenn\b|excluir|maior/.test(lower)) {
    key = "condif"; formula = `=${fn("AVERAGEIF")}(B2:B5;">=6")`; fname = fn("AVERAGEIF");
  } else if (/cerca|vert|lookup|buscar|recherche|verweis|procv|busca/.test(lower)) {
    key = "vlookup"; formula = `=${fn("VLOOKUP")}(valore; A2:C100; 2; FALSE)`; fname = fn("VLOOKUP");
  } else if (/percentual|\biva\b|sconto|percent|\bvat\b|\btax\b|porcent|pourcent|prozent|rabatt|imposto/.test(lower)) {
    key = "percent"; formula = "=B2*(1+22%)"; fname = "";
  } else if (/massim|\bmax\b|highest|m[áa]xim|h[öo]chst|gr[öo]sste|maior/.test(lower)) {
    key = "max"; formula = `=${fn("MAX")}(B2:B10)`; fname = fn("MAX");
  } else if (/minim|\bmin\b|lowest|m[íi]nim|niedrigst|kleinste|menor/.test(lower)) {
    key = "min"; formula = `=${fn("MIN")}(B2:B10)`; fname = fn("MIN");
  }

  const detail = (fname ? "`" + fname + "` " : "") + T.exDetail[key];

  return [
    H(T.h_recognized),
    `${T.ex_recognized} ${T.exDescr[key]}.`,
    "",
    H(T.h_method),
    T.ex_method,
    "",
    H(T.h_steps),
    T.ex_steps,
    "",
    H(T.h_result),
    T.ex_result,
    "",
    H(T.h_check),
    T.ex_check,
    "",
    H(T.h_excel),
    "`" + formula + "`",
    detail,
  ].join("\n");
}

// ----------------------------------------------------------------------------
// Router principale
// ----------------------------------------------------------------------------

/** Rimuove il suffisso di livello scolastico e le richieste discorsive comuni. */
function cleanMessage(message: string): string {
  let m = message;
  // rimuove "(Adatta la risposta al livello scolastico: ...)" e tutto ciò che segue
  m = m.replace(/\(adatta la risposta[^]*$/i, "");
  // rimuove i verbi introduttivi a inizio frase (multilingua)
  m = m.replace(
    /^\s*(calcola(?:re)?|risolv[ie](?:re)?|quanto fa|trova le soluzioni( reali)? di|semplifica|svolgi|risultato di|calculate|compute|solve|what(?:'s| is)|calcula(?:r)?|resuelve|cu[áa]nto es|calcule(?:r)?|r[ée]sous|combien font|berechne|l[öo]se|wie viel ist|resolva|quanto [ée])\b[:\s]*/i,
    "",
  );
  // rimuove "la seguente espressione/equazione:"
  m = m.replace(/^(la seguente|il seguente|questa|questo)\s+(espressione|equazione)[:\s]*/i, "");
  // se resta un'etichetta tipo "...grado:" con dei numeri dopo, tiene solo la parte numerica
  const colon = m.lastIndexOf(":");
  if (colon !== -1 && /[a-zA-Z]/.test(m.slice(0, colon)) && /\d/.test(m.slice(colon + 1))) {
    m = m.slice(colon + 1);
  }
  m = m.replace(/[?.!]+\s*$/g, "");
  return m.trim();
}

const FUNC_WORDS = new Set([...FUNCS, "pi", "e", "x", "y", "z"]);

/** Conta le parole "discorsive" (non matematiche) — utile per riconoscere i problemi a parole. */
function countProseWords(text: string): number {
  const words = text.toLowerCase().match(/[a-zà-ù]{2,}/g) || [];
  return words.filter((w) => !FUNC_WORDS.has(w)).length;
}

/** Estrae la sotto-stringa più lunga che assomiglia a un'espressione/equazione (funzioni incluse). */
function extractMathSnippet(text: string): string | null {
  const norm = normalizeMath(text);
  const atom = "(?:sqrt|sin|cos|tan|log|ln|pi|[0-9xy().])";
  const re = new RegExp(`${atom}(?:[0-9xy().+\\-*/^=\\s]|sqrt|sin|cos|tan|log|ln|pi)*`, "gi");
  const matches = norm.match(re);
  if (!matches) return null;
  const cand = matches
    .map((s) => s.trim())
    .filter((s) => /\d/.test(s) && /[+\-*/^=]/.test(s))
    .sort((a, b) => b.length - a.length)[0];
  return cand || null;
}

/** Prova a interpretare un testo come equazione o espressione; null se non riesce. */
function tryParseAndSolve(text: string, T: Labels): string | null {
  if (!text) return null;
  const norm = normalizeMath(text);
  if (!/\d/.test(norm)) return null;
  if (/=/.test(norm) && /[a-z]/i.test(norm)) {
    try {
      return solveEquation(text, T);
    } catch {
      /* prova come espressione */
    }
  }
  try {
    return solveExpression(text, T);
  } catch {
    return null;
  }
}

// Parole-chiave foglio di calcolo, multilingua.
const EXCEL_KEYWORDS = /excel|foglio di calcolo|google (fogli|sheets)|spreadsheet|hoja de c[áa]lculo|tableur|tabellenkalkulation|folha de c[áa]lculo|cella|celle|\bcell\b|\bcelda\b|\bcellule\b|\bzelle\b|c[ée]lula|colonn[ae]|\bcolumn\b|columna|colonne|spalte|coluna|cerca\.vert|vlookup|tabella|\btable\b|\btabla\b|tabelle|tabela/i;

/**
 * Punto d'ingresso del motore locale.
 * Capisce input multilingua e risponde nella lingua scelta (default: it).
 * Restituisce SEMPRE testo Markdown nel formato a sezioni atteso dalla UI.
 */
export function solveLocally(message: string, hasImage: boolean, lang: Lang = "it"): string {
  const T = PACKS[lang] || PACKS.it;
  const original = (message || "").trim();
  // pulizia + conversione linguaggio naturale → simbolico (parole nelle 6 lingue → operatori)
  const clean = naturalToSymbolic(cleanMessage(original));

  // 1) Foto inviata ma l'OCR on-device non ha estratto numeri/matematica leggibile:
  //    chiediamo una foto migliore o di scrivere l'esercizio (nessun cloud, tutto locale).
  if (hasImage && !/[0-9]/.test(clean)) {
    return imageFallback(T);
  }

  // 2) Tenta di risolvere l'intero testo pulito (espressione o equazione).
  const direct = tryParseAndSolve(clean, T);
  if (direct) return direct;

  // 3) Excel / fogli di calcolo (prima dell'estrazione, per non risolvere numeri sparsi).
  if (EXCEL_KEYWORDS.test(original)) {
    return solveExcel(original, T, lang);
  }

  // 4) Se NON è un problema a parole, prova a estrarre un frammento matematico dal testo.
  if (countProseWords(clean) <= 2) {
    const snippet = extractMathSnippet(clean);
    if (snippet) {
      const r = tryParseAndSolve(snippet, T);
      if (r) return r;
    }
  }

  // 5) Fallback generico (problemi a parole, geometria descrittiva, ecc.)
  return genericFallback(original, hasImage, T);
}

function imageFallback(T: Labels): string {
  return [
    H(T.h_recognized), T.img[0], "",
    H(T.h_method), T.img[1], "",
    H(T.h_steps), T.img[2], "",
    H(T.h_result), T.img[3], "",
    H(T.h_check), T.img[4],
  ].join("\n");
}

function genericFallback(text: string, hasImage: boolean, T: Labels): string {
  return [
    H(T.h_recognized),
    hasImage ? T.gen_recognized_img : T.gen_recognized.replace("{q}", text.slice(0, 160)),
    "",
    H(T.h_method), T.gen_method, "",
    H(T.h_steps), T.gen_steps, "",
    H(T.h_result), T.gen_result, "",
    H(T.h_check), T.gen_check,
  ].join("\n");
}
