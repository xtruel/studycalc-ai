/**
 * Test del motore di calcolo (solver) — verifica precisione e stabilità.
 * Eseguire con:  npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { solveLocally } from "./solver.ts";

test("espressione esatta con frazioni e potenze", () => {
  const out = solveLocally("(1/2 + 3/4) * 2^2 - 1/8", false, "it");
  // (1/2+3/4)=5/4; *4 = 5; -1/8 = 39/8
  assert.match(out, /39/);
  assert.match(out, /8/);
});

test("frazione periodica mostra >133 cifre decimali", () => {
  const out = solveLocally("1/3", false, "it");
  const m = out.match(/0\.(3+)/);
  assert.ok(m, "deve comparire l'espansione decimale di 1/3");
  assert.ok(m![1].length >= 133, `attese >=133 cifre, ottenute ${m![1].length}`);
});

test("priorità operatori e parentesi", () => {
  const out = solveLocally("2 + 3 * 4", false, "it");
  assert.match(out, /14/);
  const out2 = solveLocally("(2 + 3) * 4", false, "it");
  assert.match(out2, /20/);
});

test("numeri molto grandi senza overflow (BigInt)", () => {
  const out = solveLocally("2^100", false, "it");
  assert.match(out, /1267650600228229401496703205376/);
});

test("equazione di 1° grado esatta", () => {
  const out = solveLocally("2x + 4 = 0", false, "it");
  assert.match(out, /x\s*=\s*-?2/);
});

test("equazione di 2° grado con soluzioni razionali", () => {
  const out = solveLocally("2x^2 - 5x + 3 = 0", false, "it");
  // soluzioni x=1 e x=3/2
  assert.match(out, /1/);
  assert.match(out, /frac\{3\}\{2\}|3\/2|1\.5/);
});

test("equazione di 2° grado irrazionale ad alta precisione (x^2-2=0)", () => {
  const out = solveLocally("x^2 - 2 = 0", false, "it");
  // sqrt(2) ~ 1.41421356...
  assert.match(out, /1\.41421356/);
});

test("divisione per zero non fa crashare (fallback gestito)", () => {
  assert.doesNotThrow(() => solveLocally("5/0", false, "it"));
});

test("input non valido non fa crashare", () => {
  assert.doesNotThrow(() => solveLocally("###@@@", false, "it"));
  assert.doesNotThrow(() => solveLocally("", false, "it"));
});

test("linguaggio naturale italiano", () => {
  const out = solveLocally("quanto fa 7 per 8", false, "it");
  assert.match(out, /56/);
});

test("virgola decimale italiana", () => {
  const out = solveLocally("0,1 + 0,2", false, "it");
  // deve dare 3/10 = 0.3 esatto, non 0.30000000000000004
  assert.match(out, /0\.3\b/);
  assert.doesNotMatch(out, /0\.30000000000000004/);
});

test("risposta sempre nelle sezioni attese", () => {
  const out = solveLocally("2+2", false, "it");
  assert.match(out, /\*\*/); // contiene intestazioni markdown
});
