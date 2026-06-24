/**
 * Percentis ao nascer pelo padrão INTERGROWTH-21st Newborn Size.
 * Distribuição skew-t tipo 3 (Fernández–Steel two-piece-t) com coeficientes
 * oficiais (µ, σ, ν, τ) por dia de IG e sexo. Faixa: 33+0 a 42+6 semanas
 * (231–300 dias). Abaixo de 33 sem usa-se a referência de muito prematuro (não
 * incluída aqui) → retorna null.
 *
 * Implementação validada contra as tabelas oficiais de z-score (GROW).
 */

import { IG_NBS, IG_GA_MIN, IG_GA_MAX, type IgAnthro, type IgSexo } from "./intergrowth-coeffs";

// ── log-gamma (Lanczos) ──
function gammaln(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

// ── beta incompleta regularizada I_x(a,b) (Numerical Recipes) ──
function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-300;
  let qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-12) break;
  }
  return h;
}

function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    gammaln(a + b) - gammaln(a) - gammaln(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  return x < (a + 1) / (a + b + 2)
    ? (bt * betacf(a, b, x)) / a
    : 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** CDF da t de Student com `df` graus de liberdade. */
function studentTcdf(t: number, df: number): number {
  const x = df / (df + t * t);
  const ib = 0.5 * betai(df / 2, 0.5, x);
  return t > 0 ? 1 - ib : ib;
}

/** CDF da skew-t tipo 3 (two-piece). Retorna probabilidade acumulada (0..1). */
function pST3(x: number, mu: number, sigma: number, nu: number, tau: number): number {
  const z = (x - mu) / sigma;
  if (z < 0) return (2 / (nu * nu + 1)) * studentTcdf(nu * z, tau);
  return 1 / (nu * nu + 1) + ((2 * nu * nu) / (nu * nu + 1)) * (studentTcdf(z / nu, tau) - 0.5);
}

/**
 * Percentil (0–100) da medida ao nascer pelo INTERGROWTH-21st.
 * @param valor peso em GRAMAS, comprimento/PC em CENTÍMETROS.
 * @returns percentil 0–100, ou null se IG fora de 33+0–42+6 sem.
 */
export function percentilNascimento(
  anthro: IgAnthro,
  sexo: IgSexo,
  gaDias: number,
  valor: number,
): number | null {
  if (!Number.isFinite(gaDias) || gaDias < IG_GA_MIN || gaDias > IG_GA_MAX) return null;
  if (!Number.isFinite(valor) || valor <= 0) return null;
  const [mu, sigma, nu, tau] = IG_NBS[anthro][sexo][Math.round(gaDias) - IG_GA_MIN];
  const v = anthro === "weight" ? valor / 1000 : valor; // peso em kg
  const p = pST3(v, mu, sigma, nu, tau) * 100;
  return Math.min(100, Math.max(0, p));
}

/** Formata o percentil como no modelo: "(p67)", "(p<1)", "(p>99)". */
export function formatPercentil(p: number | null): string {
  if (p == null) return "";
  if (p < 1) return "(p<1)";
  if (p > 99) return "(p>99)";
  return `(p${Math.round(p)})`;
}

/** Extrai a IG em DIAS de um texto livre ("39 semanas e 4 dias", "39s1d", "40s"). */
export function parseIgToDays(texto?: string | null): number | null {
  if (!texto) return null;
  const t = texto.replace(/,/g, ".");
  let m = t.match(/(\d{1,2})\s*(?:semanas?|sem|s)\b[^\d]{0,6}?(?:e\s*)?(\d{1,2})?\s*(?:dias?|d)?/i);
  if (!m) m = t.match(/(\d{1,2})\s*\+\s*(\d{1,2})/); // "39+4"
  if (!m) return null;
  const sem = parseInt(m[1], 10);
  const dias = m[2] ? parseInt(m[2], 10) : 0;
  if (sem < 20 || sem > 45 || dias > 6) return null;
  return sem * 7 + dias;
}
