/**
 * Renderiza o texto de evolução no formato do MODELO DE EVOLUÇÃO AC,
 * pronto para copiar e colar no prontuário.
 *
 * A plataforma não é obrigada a seguir a ordem do modelo na tela, mas o TEXTO
 * final segue o modelo enviado.
 */

import type { Patient, Evolution, BlocoEvolucao, Sexo } from '@/lib/domain/types';
import { calcularTendenciaPeso, type PesoRegistro } from '@/lib/clinical/weight';
import { formatarIG } from '@/lib/clinical/gestational-age';
import {
  EXAME_GERAL_NORMAL,
  EXAME_ACV_NORMAL,
  EXAME_AR_NORMAL,
  EXAME_ABDOME_NORMAL,
  EXAME_COTO_NORMAL,
  EXAME_MEMBROS_NORMAL,
  genitaliaNormal,
  REFLEXOS_NEURO,
} from '@/lib/clinical/exam-defaults';

const SEP =
  '==============================================================================';
const M = '۰'; // marcador do modelo

const fmtData = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return d.toLocaleDateString('pt-BR');
};
const dm = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

function apgarTexto(apgar: Patient['apgar']): string {
  if (!apgar?.length) return '';
  const a1 = apgar.find((a) => a.tempo === 1)?.valor;
  const a5 = apgar.find((a) => a.tempo === 5)?.valor;
  const base = [a1, a5].filter((v) => v != null).join('/');
  const extras = apgar
    .filter((a) => a.tempo !== 1 && a.tempo !== 5)
    .map((a) => `${a.valor} (${a.tempo}min)`);
  return [base, ...extras].filter(Boolean).join(' / ');
}

/** Compõe a frase de EVOLUÇÃO a partir dos botões. */
export function composeEvolucao(sexo: Sexo | null, b: BlocoEvolucao): string {
  const f = sexo === 'feminino';
  const acompMap: Record<string, string> = { mae: 'mãe', pai: 'pai', avo: 'avó', tia: 'tia', irma: 'irmã' };
  const acomp = (b.acompanhantes ?? []).map((a) =>
    a === 'outro' ? b.acompanhanteOutro?.trim() || 'acompanhante' : acompMap[a] ?? 'acompanhante',
  );
  const acompTxt =
    acomp.length > 0
      ? `acompanhad${f ? 'a' : 'o'} ${acomp.length > 1 ? 'por ' : ''}${listar(acomp)}`
      : '';
  const vincMap: Record<string, string> = {
    bom: 'em bom vínculo',
    moderado: 'em vínculo moderado',
    prejudicado: 'com vínculo prejudicado',
  };
  const vinc = b.vinculo ? vincMap[b.vinculo] : '';
  const vincJust =
    (b.vinculo === 'moderado' || b.vinculo === 'prejudicado') && b.vinculoJustificativa?.trim()
      ? ` (${b.vinculoJustificativa.trim()})`
      : '';
  const partes: string[] = [];
  partes.push(
    `Avalio RN em leito de alojamento conjunto${acompTxt ? ', ' + acompTxt : ''}${
      vinc ? ', ' + vinc + vincJust : ''
    }.`,
  );
  const achados: string[] = [];
  if (b.pega)
    achados.push(b.pega === 'boa' ? 'boa pega' : b.pega === 'dificultosa' ? 'pega dificultosa' : 'amamentação não realizada');
  if (b.pega !== 'nao_realizada' && b.succao)
    achados.push(
      b.succao === 'adequada' ? 'sucção adequada' : b.succao === 'ineficiente' ? 'sucção ineficiente' : 'sucção dolorosa',
    );
  if (b.producao) {
    const prodMap: Record<string, string> = {
      aumentada: 'aumentada',
      adequada: 'adequada',
      reduzida: 'reduzida',
      inexistente: 'inexistente',
    };
    achados.push(`produção láctea materna ${prodMap[b.producao] ?? b.producao}`);
  }
  if (achados.length) partes.push(`Apresenta ${listar(achados)}.`);

  const qMap: Record<string, string> = {
    desconforto_respiratorio: 'desconforto respiratório',
    colicas: 'cólicas',
    vomitos: 'vômitos',
  };
  const qs = (b.queixas ?? []).map((q) => qMap[q]).filter(Boolean);
  if (qs.length) partes.push(`Apresenta ${listar(qs)}.`);

  if (b.hipoglicemias?.length) {
    const hs = b.hipoglicemias
      .map((h) => {
        const corr = h.amamentacao
          ? 'corrigida com amamentação'
          : h.fmiMl != null
            ? `${h.fmiMl} ml de FMI`
            : '';
        return [h.hora ? `às ${h.hora}` : '', h.dtx != null ? `DTX ${h.dtx}` : '', corr]
          .filter(Boolean)
          .join(', ');
      })
      .filter(Boolean);
    if (hs.length) partes.push(`Episódio(s) de hipoglicemia: ${hs.join('; ')}.`);
  }

  partes.push(b.outrasQueixas?.trim() ? b.outrasQueixas.trim() : 'Nega demais queixas.');
  return partes.join(' ');
}

function listar(itens: string[], _e = false): string {
  if (itens.length <= 1) return itens.join('');
  return itens.slice(0, -1).join(', ') + ' e ' + itens.at(-1);
}

export interface RenderInput {
  patient: Patient;
  evolution: Evolution;
  pesos: PesoRegistro[]; // série de peso (inclui nascimento e atual)
  /** percentis opcionais (Intergrowth) já calculados: "(p67)" etc. */
  percentis?: { peso?: string; pc?: string; comprimento?: string };
  /** IG em texto livre (permite anotações). Tem prioridade sobre os dias. */
  ig?: { dum?: string; usg?: string; capurro?: string };
}

export function renderProntuario({ patient: p, evolution: e, pesos, percentis, ig }: RenderInput): string {
  const L: string[] = [];
  const push = (s = '') => L.push(s);

  push(`♦ EVOLUÇÃO ALOJAMENTO CONJUNTO RN - ${fmtData(e.data)} ♦`);
  push();
  push('IDENTIFICAÇÃO');
  push(`${M}Nome mãe: ${p.mae_nome ?? ''}`);
  push(`${M}RG mãe: ${p.mae_rg ?? ''}`);
  push(`${M}Leito: ${p.leito ?? ''}`);
  push(`${M}Procedência: ${p.procedencia ?? ''}`);
  push(`${M}Paridade (pós parto): ${p.paridade ?? ''}`);
  push(`${M}Nome RN: ${p.rn_nome ?? ''}`);
  push(`${M}RG RN: ${p.rn_rg ?? ''}`);
  push(`${M}Sexo: ${p.sexo ?? ''}`);
  push(`${M}DN: ${fmtData(p.nascimento_em ?? null)}`);
  push(`${M}HN: ${horaDe(p.nascimento_em)}`);
  push(`${M}Horas de vida (até as ${e.corte_horario ?? '08:00'} de hoje): ${e.horas_vida ?? ''}h`);
  push(SEP);

  push('SALA DE PARTO:');
  const via =
    p.nascimento_via === 'cesarea'
      ? `Cesárea${p.indicacao_cesarea ? ` (${p.indicacao_cesarea})` : ''}`
      : p.nascimento_via === 'vaginal'
        ? 'Vaginal'
        : '';
  const pPeso = p.peso_nascimento_g
    ? `${p.peso_nascimento_g}g${percentis?.peso ? ` ${percentis.peso}` : ''}`
    : '';
  const pPC = p.pc_nascimento_cm
    ? `${p.pc_nascimento_cm} cm${percentis?.pc ? ` ${percentis.pc}` : ''}`
    : '';
  const pComp = p.comprimento_nascimento_cm
    ? `${p.comprimento_nascimento_cm} cm${percentis?.comprimento ? ` ${percentis.comprimento}` : ''}`
    : '';
  push(
    `${M}Nascimento: ${via} ${M}P: ${pPeso} ${M}PC: ${pPC} ${M}Comprimento: ${pComp} ${M}Apgar: ${apgarTexto(p.apgar)}`,
  );
  push(`${M}Evolução do Nascimento: ${p.nascimento_descricao ?? ''}`);
  push(SEP);

  // Acompanhamento de peso
  const trend = calcularTendenciaPeso(pesos);
  const atual = trend[0];
  const pctTxt = (v: number | null) => (v != null ? ` (${sinalNum(v)}%)` : '');
  // Peso atual (com variação diária). No 1º dia (só nascimento + hoje, sem dia
  // intermediário) não mostra g/dia — não há tendência diária ainda.
  const prev = trend[1];
  const primeiroDia = !prev || prev.nascimento;
  const dailyAtual =
    !primeiroDia && atual?.gPorDia != null ? `  ${sinalNum(atual.gPorDia)}g/dia${pctTxt(atual.percentual)}` : '';
  push(`${M}Peso atual${atual ? ` (${dm(atual.data)})` : ''}: ${e.peso_atual_g ? `${e.peso_atual_g}g` : ''}${dailyAtual}`);
  // Dias intermediários (exclui o atual e o nascimento)
  for (const linha of trend.slice(1)) {
    if (linha.nascimento) continue;
    push(`${M}(${dm(linha.data)}): ${linha.gramas}g  Variação de ${sinalNum(linha.gPorDia)}g/dia${pctTxt(linha.percentual)}`);
  }
  // Variação desde o nascimento (sempre que houver peso de nascimento e atual) — usa atual vs nascimento
  const nascLinha = trend.find((l) => l.nascimento);
  if (p.peso_nascimento_g && e.peso_atual_g != null) {
    const d = e.peso_atual_g - p.peso_nascimento_g;
    const pct = Math.round((d / p.peso_nascimento_g) * 10000) / 100;
    const prefixo = nascLinha
      ? `Peso de nascimento (${dm(nascLinha.data)}): ${p.peso_nascimento_g}g  Variação desde o nascimento`
      : 'Variação de peso desde o nascimento:';
    push(`${M}${prefixo} ${sinalNum(d)}g (${sinalNum(pct)}%)`);
  } else if (nascLinha) {
    push(`${M}Peso de nascimento (${dm(nascLinha.data)}): ${nascLinha.gramas}g`);
  }
  push(SEP);

  const igDum = ig?.dum?.trim() || (p.ig_dum_dias != null ? formatarIG(p.ig_dum_dias) : 'incerta');
  const igUsg = ig?.usg?.trim() || (p.ig_usg_dias != null ? formatarIG(p.ig_usg_dias) : '');
  push(`${M}IG pela DUM: ${igDum}`);
  push(`${M}IG pelo USG: ${igUsg}`);
  if (ig?.capurro?.trim()) push(`${M}IG pelo Capurro: ${ig.capurro.trim()}`);
  push(SEP);

  push('RISCO INFECCIOSO:');
  const prof = p.risco?.profilaxia;
  const profTxt =
    prof?.modo === 'nao_se_aplica'
      ? 'Não se aplica'
      : prof?.modo === 'nao_realizado'
        ? 'Não realizada'
        : prof?.medicamento
          ? `${prof.medicamento}${prof.data ? ` (${fmtData(prof.data)}${prof.hora ? ` ${prof.hora}` : ''})` : ''}`
          : 'Não se aplica';
  push(`${M}Tempo de BR: ${p.risco?.tempoBR ?? ''} ${M}Profilaxia (data e hora): ${profTxt}`);
  push(SEP);

  push(`Tipagem sanguínea Mãe: ${tip(p.tipagem?.maeABO, p.tipagem?.maeRh)} / CI: ${p.tipagem?.ci ?? 'aguardo'}`);
  push(`Tipagem sanguínea RN: ${tip(p.tipagem?.rnABO, p.tipagem?.rnRh)} / CD: ${p.tipagem?.cd ?? 'aguardo'}`);
  push(SEP);

  push(`Sorologias Maternas: ${p.sorologias_maternas ?? ''}`);
  push(SEP);
  push(`DIAGNÓSTICOS: ${p.diagnosticos ?? ''}`);
  push(SEP);

  push(`EVOLUÇÃO: ${composeEvolucao(p.sexo, e.evolucao ?? {})}`);
  const alim = e.evolucao?.alimentacao;
  const relac = e.evolucao?.emRelactacao ? ' (em relactação)' : '';
  const alimTxt = alim?.tipo
    ? `${alim.tipo}${alim.quantidadeMl ? ` ${alim.quantidadeMl}ml` : ''}${alim.intervalo ? ` ${alim.intervalo}` : ''}${alim.detalhe ? ` (${alim.detalhe})` : ''}${relac}`
    : '';
  push(
    `Diurese: ${presAus(e.evolucao?.diurese)} / Mecônio: ${presAus(e.evolucao?.meconio)} / Alimentação: ${alimTxt}`,
  );
  push(SEP);
  push(`INTERCORRÊNCIAS: ${e.intercorrencias?.trim() || 'Nega'}`);
  push(SEP);

  push('GLUCOTESTES:');
  const g24 = e.gluco_primeiras_24h;
  if (g24?.modo === 'nao_indicado') {
    push(`${M}Primeiras 24h: Não indicado`);
  } else if (g24?.modo === 'sim') {
    push(`${M}Primeiras 24h:`);
    for (const v of g24.valores) push(`${v.rotulo}/ ${v.valor ?? ''}`);
  }
  const glucoHoje = e.glucotestes ?? [];
  if (glucoHoje.length) {
    push(`${M}Hoje:`);
    for (const g of glucoHoje) push(`${g.hora}: ${g.valor ?? ''}`);
  } else {
    push(`${M}Hoje: -`);
  }
  push(SEP);

  push('TESTES DE TRIAGEM:');
  push(`${M}Teste do Olhinho: ${triagemTxt(e.triagem?.olhinho)}`);
  const cor = e.triagem?.coracaozinho;
  const corSat =
    cor && (cor.satMSD != null || cor.satMembroInferior != null)
      ? ` MSD ${cor.satMSD ?? '-'}/ MID ${cor.satMembroInferior ?? '-'}`
      : '';
  push(
    `${M}Teste do Coraçãozinho: ${cor ? statusTxt(cor.status) + corSat + dataTxt(cor.data) : 'Aguardo'}`,
  );
  const ling = e.triagem?.linguinha;
  const lingTxt =
    ling?.tabby != null
      ? `Bristol ${ling.tabby}${dataTxt(ling.data)}`
      : ling?.bristol != null
        ? `Bristol ${ling.bristol}`
        : triagemTxt(ling);
  push(`${M}Teste da Linguinha: ${lingTxt}`);
  push(`${M}Teste da Orelhinha: ${triagemTxt(e.triagem?.orelhinha)}`);
  const pez = e.triagem?.pezinho;
  const pezTxt = pez?.status === 'coletado' ? `Coletado${pez.data ? ` (em ${fmtData(pez.data)})` : ''}` : 'Aguardo';
  push(`${M}Teste do Pezinho: ${pezTxt}`);
  push(SEP);

  push('VACINAÇÃO');
  push(`${M}Hepatite B: ${vacinaTxt(e.vacinacao?.hepB)}`);
  push(`${M}BCG: ${vacinaTxt(e.vacinacao?.bcg)}`);
  push(SEP);

  const foto = e.fototerapia;
  const fotoTxt =
    foto?.status === 'realizada'
      ? `Realizada${foto.inicio ? ` (início ${foto.inicio}${foto.fim ? `, fim ${foto.fim}` : ''})` : ''}`
      : 'Não realizada';
  push(`FOTOTERAPIA: ${fotoTxt}`);
  push(SEP);

  // Exame físico
  const ef = e.exame_fisico ?? {};
  push('EXAME FÍSICO:');
  push(
    `Peso: ${ef.peso_g ?? e.peso_atual_g ?? ''}g / FC: ${ef.fc ?? ''} bpm / FR: ${ef.fr ?? ''} irpm`,
  );
  push(sistema(ef.geral, EXAME_GERAL_NORMAL));
  const cab = ef.cabeca;
  push(
    `Cabeça: ${cab?.estado === 'alterado' && cab.texto ? cab.texto : `FANT ${cab?.fant ?? ''} / FPOST ${cab?.fpost ?? ''}`}`,
  );
  push(`ACV: ${sistemaInline(ef.acv, EXAME_ACV_NORMAL)}`);
  push(`AR: ${sistemaInline(ef.ar, EXAME_AR_NORMAL)}`);
  push(`Abdome: ${sistemaInline(ef.abdome, EXAME_ABDOME_NORMAL)}`);
  push(`Coto umbilical: ${sistemaInline(ef.coto, EXAME_COTO_NORMAL)}`);
  push(`Genitália: ${sistemaInline(ef.genitalia, genitaliaNormal(p.sexo))}`);
  push(`Membros: ${sistemaInline(ef.membros, EXAME_MEMBROS_NORMAL)}`);
  const reflexos = REFLEXOS_NEURO.map(
    (r) => `(${ef.neurologico?.reflexos?.[r] ? 'x' : ' '}) ${r}`,
  ).join(' ');
  push(`Neurológico: ${reflexos}${ef.neurologico?.texto ? ` — ${ef.neurologico.texto}` : ''}`);
  if (ef.ictericia?.presente)
    push(`Icterícia: Kramer ${ef.ictericia.kramer ?? '?'}`);
  if (ef.bilicheck)
    push(
      `Bilicheck: ${ef.bilicheck.valor} mg/dL${ef.bilicheck.data ? ` (${fmtData(ef.bilicheck.data)}${ef.bilicheck.hora ? ` ${ef.bilicheck.hora}` : ''})` : ''}`,
    );
  push(SEP);

  push(`EXAMES COMPLEMENTARES: ${e.exames_complementares?.trim() || '-'}`);
  push(SEP);
  push('CONDUTAS: Discutido com equipe do Alojamento Conjunto, que orienta:');
  push(e.condutas?.trim() || '');

  return L.join('\n');
}

// ───────────────────────── helpers ─────────────────────────
function horaDe(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function tip(abo?: string, rh?: string): string {
  if (!abo && !rh) return 'aguardo';
  return `${abo ?? ''}${rh ? ` ${rh}` : ''}`.trim() || 'aguardo';
}
function presAus(v?: string): string {
  return v === 'presente' ? 'presente' : v === 'ausente' ? 'ausente' : '';
}
function sinalNum(n: number | null): string {
  if (n == null) return '';
  return n > 0 ? `+${n}` : `${n}`;
}
function statusTxt(s?: string): string {
  return s === 'normal' ? 'Normal' : s === 'alterado' ? 'Alterado' : 'Aguardo';
}
function dataTxt(d?: string): string {
  return d ? ` (realizado em ${fmtData(d)})` : '';
}
function triagemTxt(t?: { status: string; data?: string }): string {
  if (!t) return 'Aguardo';
  return `${statusTxt(t.status)}${t.status !== 'aguardo' ? dataTxt(t.data) : ''}`;
}
function vacinaTxt(v?: { status: string; data?: string }): string {
  if (!v) return 'Aguardo';
  return v.status === 'realizada'
    ? `Realizada${v.data ? ` (${fmtData(v.data)})` : ''}`
    : 'Aguardo';
}
function sistema(s: { estado: string; texto?: string } | undefined, normal: string): string {
  return s?.estado === 'alterado' && s.texto ? s.texto : normal;
}
function sistemaInline(s: { estado: string; texto?: string } | undefined, normal: string): string {
  return s?.estado === 'alterado' && s.texto ? s.texto : normal;
}
