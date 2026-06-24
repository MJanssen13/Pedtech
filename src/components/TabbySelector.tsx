"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * TABBY / Protocolo Bristol — avaliação de anquiloglossia.
 * 4 itens, cada um 0–2; soma 0–8 (resultado reportado como "Bristol X").
 * Mostra a imagem oficial enviada e deixa clicar na célula de cada linha.
 * Caixa recolhível.
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

// Geometria da grade na imagem (786×580): coluna de perguntas à esquerda + cabeçalho.
const G = { left: 26.1, top: 5.9, colW: (100 - 26.1) / 3, rowH: (100 - 5.9) / 4 };

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

  const pick = (r: number, c: number) => {
    const next = [...vals];
    next[r] = vals[r] === c ? null : c;
    onChange(next);
  };

  return (
    <div className="rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-t-lg bg-accent px-3 py-2 text-sm"
      >
        <span className="font-medium text-primary">
          Teste da Linguinha — {total != null ? `Bristol ${total}` : "(incompleto)"}
        </span>
        <span className="text-xs text-muted">{open ? "▲ recolher" : "▼ abrir"}</span>
      </button>

      {open && (
        <div className="p-2">
          <p className="mb-1 text-xs text-muted">Clique na imagem que corresponde a cada linha.</p>
          <div className="relative mx-auto w-full max-w-md">
            <Image
              src="/tabby/protocolo-bristol.webp"
              alt="Protocolo Bristol (TABBY)"
              width={786}
              height={580}
              className="h-auto w-full rounded"
            />
            {[0, 1, 2, 3].map((r) =>
              [0, 1, 2].map((c) => {
                const active = vals[r] === c;
                return (
                  <button
                    key={`${r}-${c}`}
                    type="button"
                    onClick={() => pick(r, c)}
                    aria-label={`${TABBY_ROWS[r].q}: ${c} — ${TABBY_ROWS[r].opts[c]}`}
                    style={{
                      position: "absolute",
                      left: `${G.left + c * G.colW}%`,
                      top: `${G.top + r * G.rowH}%`,
                      width: `${G.colW}%`,
                      height: `${G.rowH}%`,
                    }}
                    className={`rounded transition ${active ? "ring-4 ring-inset ring-primary" : "hover:bg-primary/10"}`}
                  />
                );
              }),
            )}
          </div>

          <div className="mt-2 space-y-0.5 text-xs">
            {TABBY_ROWS.map((row, i) => (
              <div key={i}>
                <span className="text-muted">{row.q}:</span>{" "}
                <strong>{vals[i] == null ? "—" : `${vals[i]} (${row.opts[vals[i] as number]})`}</strong>
              </div>
            ))}
          </div>
          <p className="mt-1 text-sm font-semibold text-primary">
            Resultado: {total == null ? "— (complete as 4 linhas)" : `Bristol ${total}`}
          </p>
        </div>
      )}
    </div>
  );
}
