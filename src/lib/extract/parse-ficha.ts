/**
 * Parser da FOLHA DE SALA DE PARTO (EBSERH/HC-UFTM) → campos do formulário.
 * Ancorado nos rótulos do template; tolerante a ruído de OCR.
 *
 * Retorna apenas os campos encontrados (para mesclar no formulário). Tudo é
 * revisado pelo usuário antes de salvar. Ver docs/ficha-mapping.md.
 */

import type { EvolucaoForm } from "@/lib/prontuario/form";
import type { Sexo, ViaNascimento } from "@/lib/domain/types";

export interface FichaParse {
  fields: Partial<EvolucaoForm>;
  filled: string[]; // rótulos preenchidos (para resumo na UI)
  rawText: string;
}

const grab = (re: RegExp, s: string, g = 1): string | undefined => {
  const m = s.match(re);
  const v = m?.[g]?.trim();
  return v && v.replace(/[_\s.]/g, "") !== "" ? v : undefined;
};

function isoDate(ddmmyyyy?: string): string | undefined {
  if (!ddmmyyyy) return undefined;
  const m = ddmmyyyy.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return undefined;
  const [, d, mo, y] = m;
  const ano = y.length === 2 ? `20${y}` : y;
  return `${ano}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function mapRh(v?: string): string | undefined {
  if (!v) return undefined;
  if (/pos|^\+/i.test(v)) return "+";
  if (/neg|^-/i.test(v)) return "-";
  return v;
}

function cleanABO(v?: string): string | undefined {
  if (!v) return undefined;
  const c = v.toUpperCase().replace(/0/g, "O").replace(/[^ABO]/g, "");
  return ["A", "B", "O", "AB"].includes(c) ? c : undefined;
}

export function parseFicha(text: string): FichaParse {
  const norm = text.replace(/\r/g, "").replace(/[ \t]+/g, " ");
  const flat = norm.replace(/\n/g, " ");
  const f: Partial<EvolucaoForm> = {};
  const filled: string[] = [];
  const put = <K extends keyof EvolucaoForm>(k: K, v: EvolucaoForm[K] | undefined, label: string) => {
    if (v !== undefined && v !== "") {
      f[k] = v;
      filled.push(label);
    }
  };

  put("maeNome", grab(/RN\s+de:?\s*(.+?)\s+Nome\s+do\s+beb/i, flat), "Nome da mãe");
  put("rnNome", grab(/Nome\s+do\s+beb[êe]:?\s*(.+?)\s+Prontu/i, flat), "Nome do RN");
  put("maeRg", grab(/RG\s+da\s+m[ãa]e:?\s*(\d{5,})/i, flat), "RG mãe");
  put("procedencia", grab(/Resid[êe]ncia\s+atual:?\s*(.+?)\s+(?:HIST|Idade|$)/i, flat), "Procedência");

  put("maeABO", cleanABO(grab(/\bGS:?\s*([ABO0]{1,2})\b/i, flat)), "Tipagem mãe (ABO)");
  put("maeRh", mapRh(grab(/\bRh:?\s*(POS\w*|NEG\w*|positiv\w*|negativ\w*|\+|-)/i, flat)), "Rh mãe");
  put("ci", grab(/Coombs\s+indireto:?\s*(NEG\w*|POS\w*|negativ\w*|positiv\w*|n[ãa]o\s+realizad\w*)/i, flat), "Coombs indireto");

  put("igUsg", grab(/IG:?\s*(\d+\s*semanas?[^()]*\([^)]*US[^)]*\))/i, flat), "IG pelo USG");
  const igDum = grab(/IG:?\s*(\d+\s*semanas?[^()]*\(\s*DUM[^)]*\))/i, flat);
  put("igDum", igDum, "IG pela DUM");

  put("pesoNascimentoG", grab(/\bPN\s*(?:\(g\))?\s*:?\s*(\d{3,4})/i, flat), "Peso de nascimento");

  // Nascimento: data + hora (par sob DADOS DO NASCIMENTO)
  const dh = flat.match(/Data:?\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\D{0,40}?Hora:?\s*(\d{1,2}:\d{2})/i);
  if (dh) {
    const dn = isoDate(dh[1]);
    if (dn) put("dn", dn, "Data de nascimento");
    put("hn", dh[2], "Hora de nascimento");
  }

  put("apgar1", grab(/1\s*[ºo°]\s*min\D{0,6}(\d{1,2})/i, flat), "Apgar 1º");
  put("apgar5", grab(/5\s*[ºo°]\s*min\D{0,6}(\d{1,2})/i, flat), "Apgar 5º");

  put(
    "nascimentoDescricao",
    grab(/Descri[çc][ãa]o\s+da\s+sala\s+de\s+parto:?\s*(.+?)\s+(?:APGAR|Pele\s+a\s+pele|1\s*[ºo°]\s*min)/i, flat),
    "Evolução do nascimento",
  );

  // Via de parto + indicação
  const indicacao = grab(/Indica[çc][ãa]o:?\s*(.+?)\s+(?:Analgesia|Anestesia|Rotura|Cord[ãa]o)/i, flat)?.replace(/[,;.]+$/, "").trim();
  const cesareaMark = /Ces[áa]rea\s*\(\s*[xX]/.test(flat);
  let via: ViaNascimento | undefined;
  if (indicacao || cesareaMark) via = "cesarea";
  else if (/vaginal/i.test(flat)) via = "vaginal";
  put("via", via, "Via de nascimento");
  if (via === "cesarea") put("indicacaoCesarea", indicacao, "Indicação da cesárea");

  put(
    "tempoBR",
    grab(/Tempo\s+de\s+BR\s*:?\s*(.+?)\s*(?:,|Cord[ãa]o|Clampeamento|Aspecto|$)/i, flat),
    "Tempo de BR",
  );

  // Sexo
  let sexo: Sexo | undefined;
  if (/\(\s*[xX]\s*\)\s*fem|genit[áa]lia[^.]*femin/i.test(flat) || /\bFEMININO\b/i.test(flat)) sexo = "feminino";
  else if (/\(\s*[xX]\s*\)\s*masc|genit[áa]lia[^.]*mascul/i.test(flat) || /\bMASCULINO\b/i.test(flat)) sexo = "masculino";
  put("sexo", sexo, "Sexo");

  put(
    "diagnosticos",
    grab(/DIAGN[ÓO]STICOS?:?\s*(.+?)\s+(?:EVOLU[ÇC][ÃA]O|\(\s*[xX]\s*\)\s*coletado|Encaminhado|$)/i, flat),
    "Diagnósticos",
  );

  // Sorologias (best-effort; OCR de tabela é ruidoso — usuário revisa)
  const soro = grab(/SOROLOGIAS\s*(.+?)\s+Tratamento\s+s[íi]filis/i, flat);
  if (soro && soro.length > 8 && soro.length < 600) put("sorologias", soro, "Sorologias (revisar)");

  return { fields: f, filled, rawText: text };
}
