/**
 * Idade gestacional (IG) — utilidades de cálculo e formatação.
 * IG é representada internamente em DIAS completos.
 */

export interface IG {
  semanas: number;
  dias: number;
  totalDias: number;
}

export function diasParaIG(totalDias: number): IG {
  const t = Math.max(0, Math.round(totalDias));
  return { semanas: Math.floor(t / 7), dias: t % 7, totalDias: t };
}

export function igParaDias(semanas: number, dias: number): number {
  return semanas * 7 + dias;
}

export function formatarIG(totalDias: number): string {
  const { semanas, dias } = diasParaIG(totalDias);
  return dias === 0
    ? `${semanas} semanas`
    : `${semanas} semanas e ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Aceita "38 semanas e 4 dias", "38s4d", "38+4", "39 sem". Retorna dias ou null. */
export function parseIG(texto: string): number | null {
  if (!texto) return null;
  const t = texto.toLowerCase().replace(',', '.');
  const sem = t.match(/(\d+)\s*(?:semanas?|sem|s)\b/);
  const dia = t.match(/(?:e\s*)?(\d+)\s*(?:dias?|d)\b/);
  const mais = t.match(/(\d+)\s*\+\s*(\d+)/);
  if (mais) return igParaDias(Number(mais[1]), Number(mais[2]));
  if (sem) return igParaDias(Number(sem[1]), dia ? Number(dia[1]) : 0);
  return null;
}

function diffDias(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00').getTime();
  const b = new Date(bIso + 'T00:00:00').getTime();
  return Math.round((a - b) / 86_400_000);
}

/** IG pela DUM em uma data alvo (default: data de nascimento). */
export function igPorDUM(dumIso: string, dataAlvoIso: string): number | null {
  if (!dumIso || !dataAlvoIso) return null;
  return diffDias(dataAlvoIso, dumIso);
}

/**
 * IG por USG numa data alvo, a partir de um US realizado em `usIso` que mostrou
 * IG = `usSemanas/usDias` naquele momento.
 * Ex.: US em 16/12/2025 com 13s3d → IG no nascimento = 13s3d + (DN − 16/12).
 */
export function igPorUSG(
  usIso: string,
  usSemanas: number,
  usDias: number,
  dataAlvoIso: string,
): number | null {
  if (!usIso || !dataAlvoIso) return null;
  return igParaDias(usSemanas, usDias) + diffDias(dataAlvoIso, usIso);
}
