"use client";

import { useState } from "react";

/**
 * TABBY — Tongue Assessment Tool for Breastfed Babies.
 * 4 itens, cada um 0–2; soma 0–8 (quanto MENOR, maior a restrição lingual).
 * Caixa recolhível (abre/fecha) com ícones esquemáticos da língua por opção.
 */

export const TABBY_ROWS: { q: string; opts: [string, string, string] }[] = [
  { q: "Aparência da ponta da língua", opts: ["Em coração", "Leve fenda / entalhe", "Arredondada"] },
  { q: "Fixação do frênulo na gengiva inferior", opts: ["No topo da gengiva", "Logo abaixo da gengiva", "No assoalho da boca"] },
  { q: "Elevação da língua (no choro)", opts: ["Mínima", "Bordas / moderada", "Boa (meio da boca)"] },
  { q: "Extensão da língua para frente", opts: ["Não passa da gengiva", "Sobre a gengiva", "Sobre o lábio inferior"] },
];

export function tabbyTotal(v: (number | null)[] | undefined): number | null {
  if (!v || v.length < 4 || v.some((x) => x == null)) return null;
  return v.reduce((s, x) => (s as number) + (x as number), 0) as number;
}

const PINK = "#e58a9a";
const PINKL = "#f0b6bf";
const LINE = "#c25b6b";
const MOUTH = "#b9534c";
const GUM = "#eab8b0";

function TongueIcon({ row, score }: { row: number; score: number }) {
  const wrap = (children: React.ReactNode) => (
    <svg viewBox="0 0 44 32" width="40" height="29" aria-hidden>
      {children}
    </svg>
  );
  if (row === 0) {
    const tip =
      score === 2
        ? "M13 14 Q22 6 31 14 L31 27 Q22 31 13 27 Z"
        : score === 1
          ? "M13 14 Q17 8 22 12 Q27 8 31 14 L31 27 Q22 31 13 27 Z"
          : "M13 15 Q17 6 22 14 Q27 6 31 15 L31 27 Q22 31 13 27 Z";
    return wrap(
      <>
        <path d={tip} fill={PINK} stroke={LINE} strokeWidth={1.5} strokeLinejoin="round" />
        <path d="M22 13 L22 26" stroke={LINE} strokeWidth={1} opacity={0.5} />
      </>,
    );
  }
  if (row === 1) {
    const attach = score === 0 ? 20 : score === 1 ? 25 : 29;
    return wrap(
      <>
        <line x1="8" y1="29" x2="36" y2="29" stroke={GUM} strokeWidth={3} strokeLinecap="round" />
        <line x1="22" y1="17" x2="22" y2={attach} stroke={PINKL} strokeWidth={2.5} />
        <circle cx="22" cy={attach} r="2" fill={LINE} />
        <ellipse cx="22" cy="11" rx="12" ry="8" fill={PINK} stroke={LINE} strokeWidth={1.5} />
      </>,
    );
  }
  if (row === 2) {
    const ty = score === 0 ? 25 : score === 1 ? 21 : 16;
    const tr = score === 0 ? 4 : score === 1 ? 5.5 : 7;
    return wrap(
      <>
        <ellipse cx="22" cy="16" rx="15" ry="12" fill="#fff" stroke={MOUTH} strokeWidth={2} />
        <ellipse cx="22" cy={ty} rx="10" ry={tr} fill={PINK} stroke={LINE} strokeWidth={1.2} />
      </>,
    );
  }
  // row 3 — extensão (perfil)
  const len = score === 0 ? 19 : score === 1 ? 27 : 38;
  return wrap(
    <>
      <line x1="13" y1="6" x2="13" y2="27" stroke={MOUTH} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M9 11 Q13 14 9 17" fill={GUM} stroke={MOUTH} strokeWidth={1.5} />
      <rect x="12" y="13" width={len - 12} height="7" rx="3.5" fill={PINK} stroke={LINE} strokeWidth={1.4} />
    </>,
  );
}

export function TabbySelector({
  value,
  onChange,
}: {
  value: (number | null)[] | undefined;
  onChange: (v: (number | null)[]) => void;
}) {
  const vals = value && value.length === 4 ? value : [null, null, null, null];
  const total = tabbyTotal(vals);
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-t-lg bg-accent px-3 py-2 text-sm"
      >
        <span className="font-medium text-primary">
          TABBY {total != null ? `${total}/8` : "(incompleto)"}
        </span>
        <span className="text-xs text-muted">{open ? "▲ recolher" : "▼ abrir"}</span>
      </button>

      {open && (
        <div className="space-y-2 p-2">
          {TABBY_ROWS.map((row, i) => (
            <div key={i} className="rounded-lg border border-border p-2">
              <p className="mb-1.5 text-xs font-medium">{row.q}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {row.opts.map((opt, score) => {
                  const active = vals[i] === score;
                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => {
                        const next = [...vals];
                        next[i] = active ? null : score;
                        onChange(next);
                      }}
                      className={`flex flex-col items-center rounded-md border px-1 py-1.5 text-center transition ${
                        active ? "border-primary bg-accent ring-2 ring-primary/30" : "border-border bg-white hover:border-primary/50"
                      }`}
                    >
                      <TongueIcon row={i} score={score} />
                      <span className="mt-0.5 text-[10px] font-semibold">{score}</span>
                      <span className="block text-[10px] leading-tight text-muted">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <p className="text-sm font-semibold text-primary">
            Total TABBY: {total == null ? "— (complete as 4 linhas)" : `${total}/8`}
          </p>
        </div>
      )}
    </div>
  );
}
