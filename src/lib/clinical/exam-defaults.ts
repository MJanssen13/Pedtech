/**
 * Frases padrão do exame físico (estado "Normal"), extraídas do
 * MODELO DE EVOLUÇÃO AC. Quando o sistema é marcado "Alterado", o usuário edita
 * o texto livremente; quando "Normal", usa-se a frase abaixo.
 */

import type { Sexo } from '@/lib/domain/types';

export const EXAME_GERAL_NORMAL =
  'BEG, corado, hidratado, anictérico e acianótico. Clavículas contínuas com ausência de crepitações. Dorso e palato íntegros.';

export const EXAME_ACV_NORMAL =
  'RCR em 2T sem sopros, boa perfusão periférica, pulsos centrais cheios e simétricos, TEC< 2 seg';

export const EXAME_AR_NORMAL =
  'MV+ bilateralmente sem RA, eupneico, sem sinais de desconforto respiratório';

export const EXAME_ABDOME_NORMAL =
  'semigloboso, flácido, RHA+, sem massas ou visceromegalias palpáveis.';

export const EXAME_COTO_NORMAL = 'gelatinoso, sem sinais flogísticos.';

export const EXAME_MEMBROS_NORMAL =
  'boa perfusão periférica, Ortolani e Barlow negativos.';

export function genitaliaNormal(sexo: Sexo | null | undefined): string {
  const tipo =
    sexo === 'masculino'
      ? 'masculina'
      : sexo === 'feminino'
        ? 'feminina'
        : 'típica';
  return `típica ${tipo}, sem alterações, ânus pérvio.`;
}

/** Reflexos avaliados em Neurológico (checkbox). */
export const REFLEXOS_NEURO = [
  'Preensão palmar',
  'Preensão plantar',
  'Cutâneo plantar em extensão',
  'Sucção',
  'Moro',
] as const;

/** Condutas padrão do modelo (editáveis). */
export const CONDUTAS_PADRAO = [
  'Rotina alojamento conjunto',
  'Orientações gerais à mãe',
  'Mantenho AME',
  'Aguardo testes de triagem, vacinação e tipagem sanguínea',
  'Mãe ciente de quadro clínico e programação',
  'Vigilância clínica',
];

/** Classificação de Kramer (zonas de icterícia). */
export const KRAMER_ZONAS = [
  { zona: 1, descricao: 'Cabeça e pescoço', bilirrubinaAprox: '~6 mg/dL' },
  { zona: 2, descricao: 'Tronco até umbigo', bilirrubinaAprox: '~9 mg/dL' },
  { zona: 3, descricao: 'Hipogástrio e coxas', bilirrubinaAprox: '~12 mg/dL' },
  { zona: 4, descricao: 'Braços, antebraços e pernas', bilirrubinaAprox: '~15 mg/dL' },
  { zona: 5, descricao: 'Mãos e pés (palmas/plantas)', bilirrubinaAprox: '>15 mg/dL' },
];
