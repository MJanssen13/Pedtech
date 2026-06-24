/** Tipos de domínio — espelham o schema do Supabase (supabase/migrations). */

export type Sexo = 'feminino' | 'masculino' | 'indeterminada';
export type ViaNascimento = 'vaginal' | 'cesarea';
export type StatusTriagem = 'aguardo' | 'normal' | 'alterado';
export type StatusVacina = 'aguardo' | 'realizada';

export interface Apgar {
  tempo: number; // minutos
  valor: number;
}

export interface Tipagem {
  maeABO?: string;
  maeRh?: string;
  ci?: string; // Coombs indireto
  rnABO?: string;
  rnRh?: string;
  cd?: string; // Coombs direto
}

export type ProfilaxiaModo = 'nao_se_aplica' | 'nao_realizado' | 'realizado';
export interface Profilaxia {
  modo?: ProfilaxiaModo;
  medicamento?: string; // ex.: Penicilina G benzatina
  data?: string;
  hora?: string;
}

export interface Risco {
  tempoBR?: string; // ex.: "no ato", "36 horas"
  gbs?: string; // negativo | positivo | não realizada
  profilaxia?: Profilaxia;
}

export interface Patient {
  id: string;
  created_at: string;
  updated_at: string;
  discharged_at: string | null;

  mae_nome: string;
  mae_rg: string | null;
  mae_idade: number | null;
  leito: string | null;
  procedencia: string | null;
  paridade: string | null;
  rn_nome: string | null;
  rn_rg: string | null;
  sexo: Sexo | null;
  nascimento_em: string | null;

  nascimento_via: ViaNascimento | null;
  indicacao_cesarea: string | null;
  clampeamento: string | null;
  liquido_amniotico: string | null;
  apresentacao: string | null;
  cordao: string | null;
  nascimento_descricao: string | null;
  peso_nascimento_g: number | null;
  pc_nascimento_cm: number | null;
  comprimento_nascimento_cm: number | null;
  apgar: Apgar[];

  ig_dum_dias: number | null;
  ig_dum_data: string | null;
  ig_usg_dias: number | null;
  ig_usg_ref_data: string | null;
  ig_usg_ref_dias: number | null;

  tipagem: Tipagem;
  sorologias_maternas: string | null;
  risco: Risco;
  diagnosticos: string | null;
  created_by: string | null;
}

// ───────────────────────────── Evolução ─────────────────────────────
export type Acompanhante = 'mae' | 'pai' | 'avo' | 'tia' | 'irma' | 'outro';
export type TipoAlimentacao = 'AME' | 'FMI' | 'AMM' | 'AMP' | 'AMC';
export type Vinculo = 'bom' | 'moderado' | 'prejudicado';
export type Pega = 'boa' | 'dificultosa' | 'nao_realizada';
export type Succao = 'adequada' | 'ineficiente' | 'dolorosa';
export type Producao = 'aumentada' | 'adequada' | 'reduzida';
export type Queixa = 'desconforto_respiratorio' | 'colicas' | 'vomitos';

/** Momento de hipoglicemia: DTX/quantidade de FMI OU amamentação realizada. */
export interface Hipoglicemia {
  hora?: string;
  dtx?: number;
  fmiMl?: number;
  amamentacao?: boolean; // true = corrigida com amamentação, sem FMI
}

export interface BlocoEvolucao {
  acompanhantes?: Acompanhante[];
  acompanhanteOutro?: string; // parentesco quando "outro"
  vinculo?: Vinculo;
  vinculoJustificativa?: string; // quando moderado
  pega?: Pega;
  succao?: Succao;
  producao?: Producao;
  queixas?: Queixa[];
  hipoglicemias?: Hipoglicemia[];
  outrasQueixas?: string;
  diurese?: 'presente' | 'ausente';
  meconio?: 'presente' | 'ausente';
  alimentacao?: { tipo?: TipoAlimentacao; quantidadeMl?: number; intervalo?: string; detalhe?: string };
}

export interface Glucoteste {
  hora: string; // ex.: "08h"
  valor: number | null;
}

/** Glucotestes das primeiras 24h (esquema fixo 1ª/3ª/6ª/9ª/12ª/18ª/24ª). */
export interface GlucoPrimeiras24h {
  modo?: 'sim' | 'nao_indicado';
  valores: { rotulo: string; valor: number | null }[];
}

export interface TriagemCoracaozinho {
  status: StatusTriagem;
  data?: string;
  satMSD?: number;
  satMembroInferior?: number;
}

export interface Triagem {
  olhinho?: { status: StatusTriagem; data?: string };
  coracaozinho?: TriagemCoracaozinho;
  linguinha?: { status: StatusTriagem; data?: string; bristol?: number; tabby?: number };
  orelhinha?: { status: StatusTriagem; data?: string };
  pezinho?: { status: StatusTriagem; data?: string };
}

export interface Vacinacao {
  hepB?: { status: StatusVacina; data?: string };
  bcg?: { status: StatusVacina; data?: string };
}

export interface Fototerapia {
  status: 'nao_realizada' | 'realizada';
  inicio?: string;
  fim?: string;
}

export interface DosagemBili {
  data: string;
  horas?: number; // horas de vida no momento da dosagem
  valor: number; // mg/dL
  tipo: 'bilicheck' | 'serica';
}

export interface Bilirrubina {
  dosagens: DosagemBili[];
  bt?: number;
  bd?: number;
  bi?: number;
}

export type EstadoSistema = 'normal' | 'alterado';
export interface SistemaExame {
  estado: EstadoSistema;
  texto?: string; // usado quando "alterado"
}

export interface ExameFisico {
  peso_g?: number;
  fc?: number;
  fr?: number;
  geral?: SistemaExame;
  cabeca?: SistemaExame & { fant?: string; fpost?: string };
  acv?: SistemaExame;
  ar?: SistemaExame;
  abdome?: SistemaExame;
  coto?: SistemaExame;
  genitalia?: SistemaExame;
  membros?: SistemaExame;
  neurologico?: { reflexos: Record<string, boolean>; texto?: string };
  ictericia?: { presente: boolean; kramer?: number };
  bilicheck?: { valor: number; data?: string; hora?: string };
}

export interface Evolution {
  id: string;
  patient_id: string;
  created_at: string;
  updated_at: string;
  data: string;
  horas_vida: number | null;
  corte_horario: string;
  peso_atual_g: number | null;
  evolucao: BlocoEvolucao;
  intercorrencias: string | null;
  glucotestes: Glucoteste[]; // últimas 24h / hoje
  gluco_primeiras_24h?: GlucoPrimeiras24h;
  triagem: Triagem;
  vacinacao: Vacinacao;
  fototerapia: Fototerapia;
  bilirrubina: Bilirrubina;
  exame_fisico: ExameFisico;
  exames_complementares: string | null;
  condutas: string | null;
  texto_prontuario: string | null;
  created_by: string | null;
}

export interface Weight {
  id: string;
  patient_id: string;
  data: string;
  gramas: number;
  nascimento: boolean;
}
