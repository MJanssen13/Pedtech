/**
 * Parser da FOLHA DE SALA DE PARTO (EBSERH/HC-UFTM) → campos do formulário.
 * Ancorado nos rótulos do template; tolerante a ruído de OCR (ex.: "IG" lido como
 * "1G", "Cesárea:" com dois-pontos, milhar "3,455"). Ver docs/ficha-mapping.md.
 *
 * Em PDFs imagem, algumas linhas densas (Idade/G/GS/Rh e a tabela do Apgar) não
 * sobrevivem ao OCR; ficam vazias para preenchimento manual. Em PDFs com camada de
 * texto, esses campos também são extraídos.
 */

import type { EvolucaoForm } from "@/lib/prontuario/form";
import type { Sexo, ViaNascimento } from "@/lib/domain/types";

export interface FichaParse {
  fields: Partial<EvolucaoForm>;
  filled: string[];
  rawText: string;
}

/** Limpa: tira espaços/pontuação nas bordas; vira undefined se sobrar só ruído. */
function clean(v?: string): string | undefined {
  if (!v) return undefined;
  let s = v.replace(/\s+/g, " ").trim();
  s = s.replace(/^[\s:|.,;\-–—]+/, "").replace(/[\s:|.,;\-–—]+$/, "").trim();
  return s.replace(/[\s_]/g, "") === "" ? undefined : s;
}

function isoDate(d?: string): string | undefined {
  const m = d?.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return undefined;
  const ano = m[3].length === 2 ? `20${m[3]}` : m[3];
  return `${ano}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function mapRh(v?: string): string | undefined {
  if (!v) return undefined;
  if (/pos|^\+/i.test(v)) return "positivo";
  if (/neg|^-/i.test(v)) return "negativo";
  return undefined;
}

function cleanABO(v?: string): string | undefined {
  if (!v) return undefined;
  const c = v.toUpperCase().replace(/0/g, "O").replace(/[^ABO]/g, "");
  return ["A", "B", "O", "AB"].includes(c) ? c : undefined;
}

function normCoombs(v?: string): string | undefined {
  if (!v) return undefined;
  if (/^neg|negativ/i.test(v)) return "negativo";
  if (/^pos|positiv/i.test(v)) return "positivo";
  if (/n[ãa]o\s*realiz/i.test(v)) return "não realizado";
  return v.toLowerCase();
}

/** Remove a tabela do Apgar intercalada na descrição (template fixo). */
function cleanDescricao(raw?: string): string | undefined {
  if (!raw) return undefined;
  let s = raw.replace(/\s+/g, " ");
  s = s.replace(/\[?\s*APGAR[\s\S]*?(?=\bber[çc]o\b|\bManteve\b|\bAspirado\b)/gi, " ");
  s = s.replace(/\b\d?\s*emin[o0][\s\S]*?(?=\bde\s+l[íi]quido\b|\bLavado\b)/gi, " ");
  s = s.replace(/\bAPGAR\s+com\s+minutos\s+de\s+vida\b/gi, " ");
  s = s.replace(/\bAPGAR\b/gi, " "); // a descrição não contém "Apgar" (campo próprio)
  s = s.replace(/[|\[\]]/g, " ").replace(/\s+/g, " ").trim();
  // corta lixo de OCR no fim (células de tabela): corrida de letras isoladas...
  s = s.replace(/\s+[A-ZÀ-Ú](?:\s+[A-ZÀ-Ú])+\b[\s\S]*$/u, "").trim();
  // ...e corrida final de tokens curtos em maiúsculas
  s = s.replace(/(?:\s+[A-ZÀ-Ú]{1,4}\b){3,}\s*$/u, "").trim();
  return clean(s);
}

/** Sorologias organizadas por data; mantém o cabeçalho de colunas quando existe. */
function parseSorologias(flat: string): string | undefined {
  const region = flat.match(/SOROLOGIAS\s*(.+?)\s+Tratamento\s+s[íi]filis/i)?.[1];
  if (!region) return undefined;
  const TESTE = /VDRL|HIV|HBS|TOXO|RUB[ÉE]?OLA|RUBE|CMV|HTLV|HCV|HEPATITE|S[ÍI]FILIS|FTA/gi;
  const RESULT = /\b(NR|REAG|REAGENTE|NEG|POS|IMUNE|SUSCEPT|IND|INDETERMINAD)\b|1:\d/i;
  const re = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
  const idx: { date: string; at: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(region))) idx.push({ date: m[1], at: m.index });
  if (!idx.length) return undefined;
  const linhas: string[] = [];
  for (let i = 0; i < idx.length; i++) {
    const ini = idx[i].at + idx[i].date.length;
    const fim = i + 1 < idx.length ? idx[i + 1].at : region.length;
    const corpo = region.slice(ini, fim).replace(/\s+/g, " ").trim().replace(/^[:\-\s]+/, "");
    if (corpo && (RESULT.test(corpo) || corpo.match(TESTE))) linhas.push(`${idx[i].date}: ${corpo}`);
  }
  if (!linhas.length) return undefined;
  // cabeçalho de colunas (antes da 1ª data), se tiver ≥2 nomes de testes
  const header = region.slice(0, idx[0].at).replace(/\bData\b/i, "").replace(/\s+/g, " ").trim();
  const headOk = header.length > 0 && header.length <= 120 && (header.match(TESTE) ?? []).length >= 2;
  return (headOk ? `${header}\n` : "") + linhas.join("\n");
}

export function parseFicha(text: string): FichaParse {
  const norm = text.replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{2,}/g, "\n").trim();
  const lines = norm.split("\n");
  const flat = norm.replace(/\n/g, " ");
  const f: Partial<EvolucaoForm> = {};
  const filled: string[] = [];
  const put = <K extends keyof EvolucaoForm>(k: K, v: EvolucaoForm[K] | undefined, label: string) => {
    if (v !== undefined && v !== "") {
      f[k] = v;
      filled.push(label);
    }
  };
  const find = (re: RegExp) => lines.find((l) => re.test(l)) ?? "";

  // ── Cabeçalho (cada rótulo pode estar na mesma linha OU em linhas separadas) ──
  const rnDeLine = find(/RN\s+de\s*:/i);
  put("maeNome", clean(rnDeLine.match(/RN\s+de\s*:?\s*(.+?)(?:\s+Nome\s+do\s+beb.*)?$/i)?.[1]), "Nome da mãe");
  const bebeLine = find(/Nome\s+do\s+beb/i);
  put("rnNome", clean(bebeLine.match(/Nome\s+do\s+beb[êe]?\s*:?\s*(.*)$/i)?.[1]), "Nome do RN");
  const rgLine = find(/RG\s+da\s+m[ãa]e/i);
  put("maeRg", rgLine.match(/RG\s+da\s+m[ãa]e\s*:?\s*(\d{4,})/i)?.[1], "RG mãe");
  const procLine = find(/Resid[êe]ncia\s+atual/i);
  put("procedencia", clean(procLine.match(/Resid[êe]ncia\s+atual\s*:?\s*(.+)$/i)?.[1]), "Procedência");

  // ── História materna (G/P/A independentes; dois-pontos obrigatório p/ evitar
  //    falsos como "P74"/"PC"; "IG"/"GS" não casam pois exigem dígito após ":") ──
  const g = flat.match(/\bG\s*:\s*(\d+)/i)?.[1];
  if (g) {
    const p = flat.match(/\bP\s*:\s*(\d+)/i)?.[1];
    const a = flat.match(/\bA\s*:\s*(\d+)/i)?.[1];
    put("paridade", `G${g}${p ? `P${p}` : ""}${a ? `A${a}` : ""}`, "Paridade");
  }
  put("maeABO", cleanABO(flat.match(/\bGS\s*:?\s*([ABO0]{1,2})\b/i)?.[1]), "Tipagem mãe (ABO)");
  put("maeRh", mapRh(flat.match(/\bRh\s*:?\s*(POS\w*|NEG\w*|positiv\w*|negativ\w*|\+|-)/i)?.[1]), "Rh mãe");
  put("ci", normCoombs(flat.match(/Coombs\s+indireto\s*:?\s*([A-Za-zÀ-ú]+)/i)?.[1]), "Coombs indireto");

  // ── Idade gestacional (tolera "1G"/"lG") ──
  put("igUsg", clean(flat.match(/\b[I1l]G\s*:?\s*(\d{1,2}\s*semanas?[^()\n]*\([^)]*\bUS\b[^)]*\))/i)?.[1]), "IG pelo USG");
  // DUM: só conta se houver uma data ou nº de semanas associado (campo costuma vir vazio).
  const dumData = flat.match(/\(\s*DUM\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})/i)?.[1];
  const dumSem = flat.match(/\b[I1l]G\s*:?\s*(\d{1,2})\s*semanas?[^()\n]{0,20}\(\s*DUM/i)?.[1];
  if (dumData || dumSem) {
    let s = dumSem ? `${dumSem} semanas` : "";
    if (dumData) s += `${s ? " " : ""}(DUM ${dumData})`;
    put("igDum", clean(s), "IG pela DUM");
  }

  // ── Dados do nascimento ──
  let pn = flat.match(/\bPN\b\s*(?:\(g\))?\s*:?\s*([\d.,]{3,7})/i)?.[1];
  if (pn) {
    pn = pn.replace(/[.,]/g, "");
    if (/^\d{3,4}$/.test(pn)) put("pesoNascimentoG", pn, "Peso de nascimento");
  }
  const pc = flat.match(/\bPC\b\s*:?\s*(\d{1,2}(?:[.,]\d)?)\s*(?:cm|\(z)/i)?.[1];
  put("pcCm", pc?.replace(",", "."), "PC");

  const dh = flat.match(/Data\s*:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\D{0,30}?Hora\s*:?\s*(\d{1,2}:\d{2})/i);
  if (dh) {
    put("dn", isoDate(dh[1]), "Data de nascimento");
    put("hn", dh[2], "Hora de nascimento");
  }

  const a1 = flat.match(/1\s*[ºo°]\s*min\D{0,4}(\d{1,2})/i)?.[1];
  const a5 = flat.match(/5\s*[ºo°]\s*min\D{0,4}(\d{1,2})/i)?.[1];
  if (a1 && +a1 <= 10) put("apgar1", a1, "Apgar 1º");
  if (a5 && +a5 <= 10) put("apgar5", a5, "Apgar 5º");

  // ── Via de parto + indicação ──
  const indicacao = clean(flat.match(/Indica[çc][ãa]o\s*:?\s*(.+?)\s+(?:Ana[il]gesia|Anestesia|Raqui|Peridural|Rotura|Cord[ãa]o)/i)?.[1]);
  const cesareaMark = /Ces[áa]rea\s*:?\s*\(\s*[xX]/i.test(flat);
  let via: ViaNascimento | undefined;
  if (indicacao || cesareaMark) via = "cesarea";
  else if (/vaginal/i.test(flat)) via = "vaginal";
  put("via", via, "Via de nascimento");
  if (via === "cesarea") put("indicacaoCesarea", indicacao, "Indicação da cesárea");

  put("tempoBR", clean(flat.match(/Tempo\s+de\s+BR\s*:?\s*(.+?)\s*(?:,|Cord[ãa]o|Clampeamento|Aspecto)/i)?.[1]), "Tempo de BR");

  // ── Descrição da sala de parto ──
  const regiao = norm.match(
    /Descri[çc][ãa]o\s+da\s+sala\s+de\s+parto\s*:?\s*([\s\S]+?)(?:\bAPGAR\s+(?:FC|MR|COR|com)\b|Pele\s+a\s+pele|Se\s+Apgar|EXAME\s+SUM|Tax\s+m[ãa]e\s+15|$)/i,
  )?.[1];
  put("nascimentoDescricao", cleanDescricao(regiao), "Evolução do nascimento");

  // ── Sexo ──
  let sexo: Sexo | undefined;
  if (/\(\s*[xX]\s*\)\s*fem|genit[áa]lia[^.]*femin/i.test(flat) || /\bFEMININO\b/i.test(flat)) sexo = "feminino";
  else if (/\(\s*[xX]\s*\)\s*masc|genit[áa]lia[^.]*mascul/i.test(flat) || /\bMASCULINO\b/i.test(flat)) sexo = "masculino";
  put("sexo", sexo, "Sexo");

  // ── Diagnósticos (linha após DIAGNÓSTICOS) ──
  // Cabeçalho plural "DIAGNÓSTICOS" (evita casar "Diagnóstico HIV:"); se o cabeçalho
  // não sobreviveu ao OCR, cai para a linha que começa com RN/RNT/RNPT + "+".
  let diag = norm.match(
    /\bDIAGN[ÓO]STICOS\b\s*:?\s*\n?\s*([\s\S]+?)(?:EVOLU|Rotina\s+de|Encaminhad|=====|\(\s*[xX]?\s*\)\s*coletad|$)/i,
  )?.[1];
  if (!clean(diag)) diag = norm.match(/^\s*(RN[PT]{0,2}\s*\+[^\n]*)/im)?.[1];
  put("diagnosticos", clean(diag), "Diagnósticos");

  // ── Sorologias por data ──
  put("sorologias", parseSorologias(flat), "Sorologias (por data)");

  return { fields: f, filled, rawText: text };
}
