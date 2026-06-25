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
  const [h, m] = horaCorte.split(':').map(Number);
  let y: number;
  let mo: number;
  let da: number;
  if (typeof diaEvolucao === 'string') {
    // 'YYYY-MM-DD' (date-only) deve ser interpretado em horário LOCAL, não UTC —
    // senão em fuso negativo o corte cai no dia anterior.
    const mt = diaEvolucao.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mt) {
      [y, mo, da] = [Number(mt[1]), Number(mt[2]) - 1, Number(mt[3])];
    } else {
      const d = new Date(diaEvolucao);
      [y, mo, da] = [d.getFullYear(), d.getMonth(), d.getDate()];
    }
  } else {
    [y, mo, da] = [diaEvolucao.getFullYear(), diaEvolucao.getMonth(), diaEvolucao.getDate()];
  }
  return new Date(y, mo, da, h, m || 0, 0, 0);
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
