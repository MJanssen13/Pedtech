/** Estado do formulário de evolução e montagem para o renderizador. */

import type {
  Patient,
  Evolution,
  Sexo,
  ViaNascimento,
  Acompanhante,
  TipoAlimentacao,
  StatusTriagem,
  StatusVacina,
  Vinculo,
  Pega,
  Succao,
  Producao,
  Queixa,
  ProfilaxiaModo,
} from "@/lib/domain/types";
import type { RenderInput } from "@/lib/prontuario/render";
import type { PesoRegistro } from "@/lib/clinical/weight";
import { calcularHorasDeVida } from "@/lib/clinical/hours-of-life";
import { CONDUTAS_PADRAO, REFLEXOS_NEURO } from "@/lib/clinical/exam-defaults";
import { percentilNascimento, formatPercentil, parseIgToDays } from "@/lib/clinical/intergrowth";

export interface PesoLinhaForm {
  data: string;
  gramas: string;
  nascimento: boolean;
}
export interface GlucoForm {
  hora: string;
  valor: string;
}
export interface HipoForm {
  hora: string;
  dtx: string;
  correcao: "fmi" | "amamentacao";
  fmiMl: string;
}

export interface EvolucaoForm {
  // Identificação
  maeNome: string;
  maeRg: string;
  leito: string;
  procedencia: string;
  paridade: string;
  rnNome: string;
  rnRg: string;
  sexo?: Sexo;
  dn: string; // yyyy-mm-dd
  hn: string; // HH:mm
  dataEvolucao: string;
  corteHorario: string;

  // Sala de parto
  via?: ViaNascimento;
  indicacaoCesarea: string;
  pesoNascimentoG: string;
  pcCm: string;
  comprimentoCm: string;
  apgar1: string;
  apgar5: string;
  nascimentoDescricao: string;

  // Peso
  pesoAtualG: string;
  pesos: PesoLinhaForm[];

  // IG (texto livre)
  igDum: string;
  igDumIncerta: boolean;
  igUsg: string;
  percentilFonte: "usg" | "dum"; // qual IG usar no percentil Intergrowth

  // Risco
  tempoBR: string;
  profilaxiaModo?: ProfilaxiaModo; // undefined = preencher medicamento/data/hora
  profMedicamento: string;
  profData: string;
  profHora: string;

  // Tipagem
  maeABO: string;
  maeRh: string;
  ci: string;
  rnABO: string;
  rnRh: string;
  cd: string;

  sorologias: string;
  diagnosticos: string;

  // Evolução (botões)
  acompanhantes: Acompanhante[];
  acompanhanteOutro: string;
  vinculo?: Vinculo;
  vinculoJustificativa: string;
  pega?: Pega;
  succao?: Succao;
  producao?: Producao;
  queixas: Queixa[];
  hipoglicemias: HipoForm[];
  outrasQueixas: string;
  diurese?: "presente" | "ausente";
  meconio?: "presente" | "ausente";
  alimentacaoTipo?: TipoAlimentacao;
  alimentacaoMl: string;
  alimentacaoIntervalo: string;

  intercorrencias: string;
  glucotestes: GlucoForm[];

  // Triagem
  olhinho: StatusTriagem;
  olhinhoData: string;
  coracaozinho: StatusTriagem;
  coracaozinhoData: string;
  satMSD: string;
  satMI: string;
  linguinhaBristol: string;
  orelhinha: StatusTriagem;
  orelhinhaData: string;
  pezinho: StatusTriagem;
  pezinhoData: string;

  // Vacinação
  hepB: StatusVacina;
  hepBData: string;
  bcg: StatusVacina;
  bcgData: string;

  // Fototerapia
  fototerapia: "nao_realizada" | "realizada";
  fotoInicio: string;
  fotoFim: string;

  // Exame físico
  fc: string;
  fr: string;
  geralAlt: boolean;
  geralTexto: string;
  acvAlt: boolean;
  acvTexto: string;
  arAlt: boolean;
  arTexto: string;
  abdomeAlt: boolean;
  abdomeTexto: string;
  cotoAlt: boolean;
  cotoTexto: string;
  genitaliaAlt: boolean;
  genitaliaTexto: string;
  membrosAlt: boolean;
  membrosTexto: string;
  fant: string;
  fpost: string;
  reflexos: Record<string, boolean>;
  ictericia: boolean;
  kramer: string;

  examesComplementares: string;
  condutas: string;
}

const hoje = () => new Date().toISOString().slice(0, 10);

export function emptyForm(): EvolucaoForm {
  return {
    maeNome: "", maeRg: "", leito: "", procedencia: "", paridade: "",
    rnNome: "", rnRg: "", sexo: undefined, dn: "", hn: "",
    dataEvolucao: hoje(), corteHorario: "08:00",
    via: undefined, indicacaoCesarea: "", pesoNascimentoG: "", pcCm: "",
    comprimentoCm: "", apgar1: "", apgar5: "", nascimentoDescricao: "",
    pesoAtualG: "", pesos: [],
    igDum: "", igDumIncerta: false, igUsg: "", percentilFonte: "usg",
    tempoBR: "", profilaxiaModo: undefined, profMedicamento: "", profData: "", profHora: "",
    maeABO: "", maeRh: "", ci: "", rnABO: "", rnRh: "", cd: "",
    sorologias: "", diagnosticos: "",
    acompanhantes: [], acompanhanteOutro: "", vinculo: "bom", vinculoJustificativa: "",
    pega: undefined, succao: undefined, producao: undefined,
    queixas: [], hipoglicemias: [], outrasQueixas: "",
    diurese: "presente", meconio: "presente",
    alimentacaoTipo: "AME", alimentacaoMl: "", alimentacaoIntervalo: "",
    intercorrencias: "", glucotestes: [],
    olhinho: "aguardo", olhinhoData: "", coracaozinho: "aguardo", coracaozinhoData: "",
    satMSD: "", satMI: "", linguinhaBristol: "", orelhinha: "aguardo", orelhinhaData: "",
    pezinho: "aguardo", pezinhoData: "",
    hepB: "aguardo", hepBData: "", bcg: "aguardo", bcgData: "",
    fototerapia: "nao_realizada", fotoInicio: "", fotoFim: "",
    fc: "", fr: "",
    geralAlt: false, geralTexto: "", acvAlt: false, acvTexto: "",
    arAlt: false, arTexto: "", abdomeAlt: false, abdomeTexto: "",
    cotoAlt: false, cotoTexto: "", genitaliaAlt: false, genitaliaTexto: "",
    membrosAlt: false, membrosTexto: "", fant: "", fpost: "",
    reflexos: Object.fromEntries(REFLEXOS_NEURO.map((r) => [r, true])),
    ictericia: false, kramer: "",
    examesComplementares: "",
    condutas: CONDUTAS_PADRAO.join("\n"),
  };
}

const num = (s: string): number | null => {
  const n = Number(String(s).replace(",", ".").replace(/[^\d.-]/g, ""));
  return s.trim() === "" || Number.isNaN(n) ? null : n;
};

function sistema(alt: boolean, texto: string) {
  return { estado: alt ? ("alterado" as const) : ("normal" as const), texto };
}

export interface PercentisCalc {
  peso?: string;
  pc?: string;
  comprimento?: string;
  gaDias: number | null;
  fonte: "usg" | "dum";
}

/** Percentis INTERGROWTH-21st a partir do sexo e da IG (DUM ou USG) escolhida. */
export function computePercentis(f: EvolucaoForm): PercentisCalc {
  const fonte = f.percentilFonte;
  const gaDias = parseIgToDays(fonte === "dum" ? (f.igDumIncerta ? "" : f.igDum) : f.igUsg);
  const sexo = f.sexo === "feminino" ? "F" : f.sexo === "masculino" ? "M" : null;
  if (!sexo || gaDias == null) return { gaDias, fonte };
  const fmt = (anthro: "weight" | "length" | "hc", v: number | null) =>
    v != null ? formatPercentil(percentilNascimento(anthro, sexo, gaDias, v)) || undefined : undefined;
  return {
    peso: fmt("weight", num(f.pesoNascimentoG)),
    pc: fmt("hc", num(f.pcCm)),
    comprimento: fmt("length", num(f.comprimentoCm)),
    gaDias,
    fonte,
  };
}

export function buildRenderInput(f: EvolucaoForm): RenderInput {
  const nascimentoEm =
    f.dn && f.hn ? new Date(`${f.dn}T${f.hn}:00`).toISOString() : f.dn ? `${f.dn}T00:00:00` : null;

  const horas = nascimentoEm
    ? calcularHorasDeVida({
        nascimento: nascimentoEm,
        diaEvolucao: f.dataEvolucao,
        horaCorte: f.corteHorario,
      }).horas
    : null;

  const apgar = [
    ...(f.apgar1 ? [{ tempo: 1, valor: Number(f.apgar1) }] : []),
    ...(f.apgar5 ? [{ tempo: 5, valor: Number(f.apgar5) }] : []),
  ];

  const patient = {
    id: "draft",
    created_at: "",
    updated_at: "",
    discharged_at: null,
    mae_nome: f.maeNome,
    mae_rg: f.maeRg || null,
    mae_idade: null,
    leito: f.leito || null,
    procedencia: f.procedencia || null,
    paridade: f.paridade || null,
    rn_nome: f.rnNome || null,
    rn_rg: f.rnRg || null,
    sexo: f.sexo ?? null,
    nascimento_em: nascimentoEm,
    nascimento_via: f.via ?? null,
    indicacao_cesarea: f.indicacaoCesarea || null,
    clampeamento: null,
    liquido_amniotico: null,
    apresentacao: null,
    cordao: null,
    nascimento_descricao: f.nascimentoDescricao || null,
    peso_nascimento_g: num(f.pesoNascimentoG),
    pc_nascimento_cm: num(f.pcCm),
    comprimento_nascimento_cm: num(f.comprimentoCm),
    apgar,
    ig_dum_dias: null,
    ig_dum_data: null,
    ig_usg_dias: null,
    ig_usg_ref_data: null,
    ig_usg_ref_dias: null,
    tipagem: {
      maeABO: f.maeABO, maeRh: f.maeRh, ci: f.ci, rnABO: f.rnABO, rnRh: f.rnRh, cd: f.cd,
    },
    sorologias_maternas: f.sorologias || null,
    risco: {
      tempoBR: f.tempoBR,
      profilaxia: {
        modo: f.profilaxiaModo ?? (f.profMedicamento ? "realizado" : undefined),
        medicamento: f.profMedicamento,
        data: f.profData,
        hora: f.profHora,
      },
    },
    diagnosticos: f.diagnosticos || null,
    created_by: null,
  } satisfies Patient;

  const evolution = {
    id: "draft",
    patient_id: "draft",
    created_at: "",
    updated_at: "",
    data: f.dataEvolucao,
    horas_vida: horas,
    corte_horario: f.corteHorario,
    peso_atual_g: num(f.pesoAtualG),
    evolucao: {
      acompanhantes: f.acompanhantes,
      acompanhanteOutro: f.acompanhanteOutro,
      vinculo: f.vinculo,
      vinculoJustificativa: f.vinculoJustificativa,
      pega: f.pega,
      succao: f.pega === "nao_realizada" ? undefined : f.succao,
      producao: f.producao,
      queixas: f.queixas,
      hipoglicemias: f.hipoglicemias
        .filter((h) => h.hora || h.dtx || h.fmiMl || h.correcao === "amamentacao")
        .map((h) => ({
          hora: h.hora || undefined,
          dtx: num(h.dtx) ?? undefined,
          amamentacao: h.correcao === "amamentacao",
          fmiMl: h.correcao === "fmi" ? num(h.fmiMl) ?? undefined : undefined,
        })),
      outrasQueixas: f.outrasQueixas,
      diurese: f.diurese,
      meconio: f.meconio,
      alimentacao: {
        tipo: f.alimentacaoTipo,
        quantidadeMl: num(f.alimentacaoMl) ?? undefined,
        intervalo: f.alimentacaoIntervalo,
      },
    },
    intercorrencias: f.intercorrencias || null,
    glucotestes: f.glucotestes
      .filter((g) => g.hora || g.valor)
      .map((g) => ({ hora: g.hora, valor: num(g.valor) })),
    triagem: {
      olhinho: { status: f.olhinho, data: f.olhinhoData },
      coracaozinho: {
        status: f.coracaozinho,
        data: f.coracaozinhoData,
        satMSD: num(f.satMSD) ?? undefined,
        satMembroInferior: num(f.satMI) ?? undefined,
      },
      linguinha: { status: "aguardo", bristol: num(f.linguinhaBristol) ?? undefined },
      orelhinha: { status: f.orelhinha, data: f.orelhinhaData },
      pezinho: { status: f.pezinho, data: f.pezinhoData },
    },
    vacinacao: {
      hepB: { status: f.hepB, data: f.hepBData },
      bcg: { status: f.bcg, data: f.bcgData },
    },
    fototerapia: { status: f.fototerapia, inicio: f.fotoInicio, fim: f.fotoFim },
    bilirrubina: { dosagens: [] },
    exame_fisico: {
      peso_g: num(f.pesoAtualG) ?? undefined,
      fc: num(f.fc) ?? undefined,
      fr: num(f.fr) ?? undefined,
      geral: sistema(f.geralAlt, f.geralTexto),
      cabeca: { ...sistema(false, ""), fant: f.fant, fpost: f.fpost },
      acv: sistema(f.acvAlt, f.acvTexto),
      ar: sistema(f.arAlt, f.arTexto),
      abdome: sistema(f.abdomeAlt, f.abdomeTexto),
      coto: sistema(f.cotoAlt, f.cotoTexto),
      genitalia: sistema(f.genitaliaAlt, f.genitaliaTexto),
      membros: sistema(f.membrosAlt, f.membrosTexto),
      neurologico: { reflexos: f.reflexos },
      ictericia: { presente: f.ictericia, kramer: num(f.kramer) ?? undefined },
    },
    exames_complementares: f.examesComplementares || null,
    condutas: f.condutas || null,
    texto_prontuario: null,
    created_by: null,
  } satisfies Evolution;

  // Série de peso: históricos + peso atual de hoje
  const pesos: PesoRegistro[] = [
    ...f.pesos
      .filter((p) => p.gramas)
      .map((p) => ({ data: p.data, gramas: Number(p.gramas), nascimento: p.nascimento })),
  ];
  const atual = num(f.pesoAtualG);
  if (atual != null) pesos.push({ data: f.dataEvolucao, gramas: atual });

  const perc = computePercentis(f);

  return {
    patient,
    evolution,
    pesos,
    ig: { dum: f.igDumIncerta ? "incerta" : f.igDum, usg: f.igUsg },
    percentis: { peso: perc.peso, pc: perc.pc, comprimento: perc.comprimento },
  };
}
