/**
 * Capurro somático — estimativa de idade gestacional por 5 sinais somáticos.
 *
 * IG (dias) = 204 + Σ(pontos);  IG (semanas) = (204 + Σ) / 7
 *
 * ⚠️ VALIDAÇÃO CLÍNICA: os valores de pontuação seguem o método de Capurro
 * somático clássico. Conferir contra fonte oficial antes de uso assistencial.
 *
 * Uso recomendado quando IG por DUM e por USG divergem ≥ 7 dias
 * (ver `divergenciaIndicaCapurro`).
 */

export type CapurroSign =
  | 'texturaPele'
  | 'formaOrelha'
  | 'glandulaMamaria'
  | 'pregasPlantares'
  | 'formacaoMamilo';

export interface CapurroOption {
  pontos: number;
  rotulo: string;
}

export const CAPURRO_SIGNS: Record<
  CapurroSign,
  { titulo: string; opcoes: CapurroOption[] }
> = {
  texturaPele: {
    titulo: 'Textura da pele',
    opcoes: [
      { pontos: 0, rotulo: 'Muito fina, gelatinosa' },
      { pontos: 5, rotulo: 'Fina e lisa' },
      { pontos: 10, rotulo: 'Mais grossa, discreta descamação superficial' },
      { pontos: 15, rotulo: 'Grossa, sulcos superficiais, descamação em mãos/pés' },
      { pontos: 20, rotulo: 'Grossa, apergaminhada, sulcos profundos' },
    ],
  },
  formaOrelha: {
    titulo: 'Forma da orelha',
    opcoes: [
      { pontos: 0, rotulo: 'Chata, disforme, pavilhão não encurvado' },
      { pontos: 8, rotulo: 'Pavilhão parcialmente encurvado na borda' },
      { pontos: 16, rotulo: 'Pavilhão parcialmente encurvado em toda parte superior' },
      { pontos: 24, rotulo: 'Pavilhão totalmente encurvado' },
    ],
  },
  glandulaMamaria: {
    titulo: 'Glândula mamária',
    opcoes: [
      { pontos: 0, rotulo: 'Não palpável' },
      { pontos: 5, rotulo: 'Palpável, < 5 mm' },
      { pontos: 10, rotulo: 'Palpável, 5–10 mm' },
      { pontos: 15, rotulo: 'Palpável, > 10 mm' },
    ],
  },
  pregasPlantares: {
    titulo: 'Pregas plantares',
    opcoes: [
      { pontos: 0, rotulo: 'Sem pregas' },
      { pontos: 5, rotulo: 'Marcas mal definidas na metade anterior' },
      { pontos: 10, rotulo: 'Marcas bem definidas; sulcos no terço anterior' },
      { pontos: 15, rotulo: 'Sulcos na metade anterior' },
      { pontos: 20, rotulo: 'Sulcos em mais da metade anterior' },
    ],
  },
  formacaoMamilo: {
    titulo: 'Formação do mamilo',
    opcoes: [
      { pontos: 0, rotulo: 'Apenas visível, sem aréola' },
      { pontos: 5, rotulo: 'Aréola pigmentada, Ø < 7,5 mm, borda não elevada' },
      { pontos: 10, rotulo: 'Aréola pigmentada, Ø > 7,5 mm, borda não elevada' },
      { pontos: 15, rotulo: 'Borda elevada, Ø > 7,5 mm' },
    ],
  },
};

const CAPURRO_CONSTANT_DAYS = 204;

export interface CapurroResult {
  totalPontos: number;
  idadeDias: number;
  semanas: number;
  dias: number;
  texto: string; // ex.: "39 semanas e 2 dias"
}

export function calcularCapurroSomatico(
  selecao: Partial<Record<CapurroSign, number>>,
): CapurroResult | null {
  const signs = Object.keys(CAPURRO_SIGNS) as CapurroSign[];
  const completo = signs.every((s) => typeof selecao[s] === 'number');
  if (!completo) return null;

  const totalPontos = signs.reduce((acc, s) => acc + (selecao[s] ?? 0), 0);
  const idadeDias = CAPURRO_CONSTANT_DAYS + totalPontos;
  const semanas = Math.floor(idadeDias / 7);
  const dias = idadeDias % 7;
  return {
    totalPontos,
    idadeDias,
    semanas,
    dias,
    texto: `${semanas} semanas e ${dias} dias`,
  };
}

/** Diferença ≥ 7 dias entre IGs indica realizar Capurro. */
export function divergenciaIndicaCapurro(
  igDumDias: number | null,
  igUsgDias: number | null,
): boolean {
  if (igDumDias == null || igUsgDias == null) return false;
  return Math.abs(igDumDias - igUsgDias) >= 7;
}
