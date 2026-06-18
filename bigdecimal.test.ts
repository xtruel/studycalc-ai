/**
 * Test del motore aritmetico a precisione arbitraria (BigDecimal).
 * Eseguire con:  npm test
 *
 * Verificano in particolare il requisito chiave: oltre 133 cifre decimali
 * ESATTE, niente errori di arrotondamento tipici di float/double, e nessun
 * crash su input estremi.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { BigDecimal } from "./bigdecimal.ts";

const D = (s: string) => BigDecimal.parse(s);

test("0.1 + 0.2 === 0.3 esatto (niente errore float)", () => {
  assert.equal(D("0.1").add(D("0.2")).toString(), "0.3");
});

test("parsing: notazione scientifica, underscore, segni, zeri", () => {
  assert.equal(D("1e-3").toString(), "0.001");
  assert.equal(D("2.5E10").toString(), "25000000000");
  assert.equal(D("1_000.250").toString(), "1000.25");
  assert.equal(D("+.5").toString(), "0.5");
  assert.equal(D("-0").toString(), "0");
});

test("input non valido lancia errore (no NaN silenzioso)", () => {
  assert.throws(() => D("abc"));
  assert.throws(() => D("1.2.3"));
  assert.throws(() => D(""));
});

test("divisione 1/3 con OLTRE 133 cifre decimali esatte", () => {
  const r = D("1").div(D("3"), 200);
  const frac = r.toString().split(".")[1];
  assert.ok(frac.length >= 200, `attese >=200 cifre, ottenute ${frac.length}`);
  // tutte le cifre devono essere '3'
  assert.ok(/^3+$/.test(frac), "1/3 deve essere 0.333... fino in fondo");
  // la 134ª cifra decimale esiste ed è 3 (requisito >133)
  assert.equal(frac[133], "3");
});

test("2/7 periodico: 150 cifre con periodo corretto 142857", () => {
  const r = D("2").div(D("7"), 150);
  const frac = r.toString().split(".")[1];
  assert.ok(frac.length >= 150);
  assert.equal(frac.slice(0, 12), "285714285714");
});

test("arrotondamento round-half-up nella divisione", () => {
  // 1/8 = 0.125 esatto
  assert.equal(D("1").div(D("8"), 10).toString(), "0.125");
  // 2/3 a 5 cifre -> 0.66667 (ultima cifra arrotondata per eccesso)
  assert.equal(D("2").div(D("3"), 5).toString(), "0.66667");
});

test("numeri MOLTO grandi: 10^200 * 10^200 esatto", () => {
  const big = D("1" + "0".repeat(200));
  const sq = big.mul(big);
  assert.equal(sq.toString(), "1" + "0".repeat(400));
});

test("numeri MOLTO piccoli mantenuti senza notazione scientifica", () => {
  const tiny = D("0." + "0".repeat(199) + "7"); // 7 alla 200ª cifra
  assert.equal(tiny.toString(), "0." + "0".repeat(199) + "7");
  assert.ok(!tiny.toString().includes("e"));
});

test("potenza intera esatta: 2^256", () => {
  const r = D("2").pow(256);
  assert.equal(r.toString(), (2n ** 256n).toString());
});

test("potenza negativa: 2^-10 = 0.0009765625 esatto", () => {
  assert.equal(D("2").pow(-10, 50).toString(), "0.0009765625");
});

test("sqrt(2) con >133 cifre: quadrato ~ 2 entro la precisione", () => {
  const s = D("2").sqrt(160);
  assert.equal(s.toString().slice(0, 15), "1.4142135623730");
  const frac = s.toString().split(".")[1];
  assert.ok(frac.length >= 150, `attese molte cifre, ottenute ${frac.length}`);
  // verifica: s*s differisce da 2 per meno di 10^-150
  const sq = s.mul(s);
  const diff = sq.sub(D("2")).abs();
  assert.equal(diff.cmp(D("1e-150")), -1);
});

test("sqrt esatta di quadrato perfetto grande", () => {
  const n = D("152415787532388367501905199875019052100"); // 12345678901234567890^2
  assert.equal(n.sqrt(0).toString(), "12345678901234567890");
});

test("sqrt di numero negativo -> errore (no NaN)", () => {
  assert.throws(() => D("-4").sqrt());
});

test("divisione per zero -> errore esplicito", () => {
  assert.throws(() => D("5").div(D("0")), /zero/i);
});

test("percentuali: 22% di 250 = 55 esatto", () => {
  assert.equal(D("22").percentOf(D("250")).toString(), "55");
});

test("confronti coerenti a precisione arbitraria", () => {
  assert.equal(D("0.1").add(D("0.2")).cmp(D("0.3")), 0);
  assert.equal(D("1e-200").cmp(BigDecimal.ZERO), 1);
  assert.equal(D("-5").cmp(D("-5.0000")), 0);
});

test("format(): valore leggibile ma esatto conservato", () => {
  const r = D("1").div(D("3"), 150);
  const f = r.format(8);
  assert.equal(f.display, "0.33333333");
  assert.equal(f.truncated, true);
  assert.ok(f.exact.length > 140); // valore esatto integrale conservato
});

test("format() con separatori migliaia non altera il valore", () => {
  const f = D("1234567.89").format(2, { grouping: true });
  assert.equal(f.display, "1 234 567.89");
  assert.equal(f.exact, "1234567.89");
});

test("catena lunga di operazioni resta esatta", () => {
  // ((0.1+0.2) * 3 - 0.9) deve essere esattamente 0
  const r = D("0.1").add(D("0.2")).mul(D("3")).sub(D("0.9"));
  assert.equal(r.toString(), "0");
  assert.ok(r.isZero());
});
