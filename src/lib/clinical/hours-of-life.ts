/**
 * Horas de vida — sempre calculadas até um horário de corte (padrão 08:00 do
 * dia da evolução), editável pelo usuário.
 */

export interface HorasDeVidaInput {
  /** Data e hora do nascimento (ISO ou Date). */
  nascimento: Date | string;
  /** Momento de corte. Default: 08:00 do dia da evolução. */
  corte?: Date | string;
  /** Dia da evolução (usado p/ montar o corte padrão). Default: hoje. */
  diaEvolucao?: Date | string;
  /** Hora de corte padrão (HH:mm). Default '08:00'. */
  horaCorte?: string;
}

function toDate(v: Date | string): Date {
  return v instanceof Date ? v : new Date(v);
}

export function horarioDeCortePadrao(
  diaEvolucao: Date | string = new Date(),
  horaCorte = '08:00',
): Date {
  const d = toDate(diaEvolucao);
  const [h, m] = horaCorte.split(':').map(Number);
  const corte = new Date(d);
  corte.setHours(h, m ?? 0, 0, 0);
  return corte;
}

export interface HorasDeVida {
  horas: number;
  texto: string; // ex.: "71h"
  corte: Date;
}

export function calcularHorasDeVida(input: HorasDeVidaInput): HorasDeVida {
  const nascimento = toDate(input.nascimento);
  const corte = input.corte
    ? toDate(input.corte)
    : horarioDeCortePadrao(input.diaEvolucao, input.horaCorte);

  const ms = corte.getTime() - nascimento.getTime();
  const horas = Math.max(0, Math.floor(ms / 3_600_000));
  return { horas, texto: `${horas}h`, corte };
}
