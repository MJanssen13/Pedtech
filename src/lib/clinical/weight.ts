/**
 * Acompanhamento de peso — variação diária (g/dia e %) e variação acumulada
 * desde o nascimento.
 *
 * Modelo de saída (exemplo do serviço):
 *   - Peso atual (22/06): 3250g  -100g/dia (-3%)
 *   - (21/06): 3350g  Variação de -50g/dia (-1,4%)
 *   - Peso de nascimento (19/06): 3500g  Variação desde o nascimento -250g (-7,14%)
 */

export interface PesoRegistro {
  data: string; // ISO yyyy-mm-dd
  gramas: number;
  nascimento?: boolean;
}

export interface PesoLinha {
  data: string;
  gramas: number;
  nascimento: boolean;
  atual: boolean;
  /** Variação vs. registro anterior (mais recente → mais antigo). */
  deltaGramas: number | null;
  gPorDia: number | null;
  percentual: number | null; // delta / pesoAnterior * 100
  /** Para a linha de nascimento: variação acumulada desde o nascimento. */
  deltaDesdeNascimento: number | null;
  percentualDesdeNascimento: number | null;
}

function diffDias(aIso: string, bIso: string): number {
  const a = new Date(aIso + 'T00:00:00').getTime();
  const b = new Date(bIso + 'T00:00:00').getTime();
  return Math.round((a - b) / 86_400_000);
}

/**
 * Recebe registros em qualquer ordem; retorna linhas ordenadas do mais recente
 * (atual) para o mais antigo (nascimento), com as variações calculadas.
 */
export function calcularTendenciaPeso(registros: PesoRegistro[]): PesoLinha[] {
  const ordenados = [...registros].sort((a, b) => (a.data < b.data ? 1 : -1));
  const nascimento = registros.find((r) => r.nascimento) ?? ordenados.at(-1);
  const pesoNasc = nascimento?.gramas ?? null;

  return ordenados.map((r, i) => {
    const anterior = ordenados[i + 1]; // próximo é mais antigo
    let deltaGramas: number | null = null;
    let gPorDia: number | null = null;
    let percentual: number | null = null;

    if (anterior) {
      deltaGramas = r.gramas - anterior.gramas;
      const dias = Math.max(1, diffDias(r.data, anterior.data));
      gPorDia = Math.round(deltaGramas / dias);
      percentual = round1((deltaGramas / anterior.gramas) * 100);
    }

    const isNasc = r.nascimento === true || r === nascimento;
    let deltaDesdeNascimento: number | null = null;
    let percentualDesdeNascimento: number | null = null;
    if (pesoNasc != null) {
      deltaDesdeNascimento = r.gramas - pesoNasc;
      percentualDesdeNascimento = round2((deltaDesdeNascimento / pesoNasc) * 100);
    }

    return {
      data: r.data,
      gramas: r.gramas,
      nascimento: isNasc,
      atual: i === 0,
      deltaGramas,
      gPorDia,
      percentual,
      deltaDesdeNascimento,
      percentualDesdeNascimento,
    };
  });
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
