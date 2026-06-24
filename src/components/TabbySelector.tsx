"use client";

/**
 * TABBY — Tongue Assessment Tool for Breastfed Babies.
 * 4 itens, cada um 0–2; soma 0–8 (quanto MENOR, maior a restrição lingual).
 */

export const TABBY_ROWS: { q: string; opts: [string, string, string] }[] = [
  {
    q: "Aparência da ponta da língua",
    opts: ["Em coração", "Leve fenda / entalhe", "Arredondada"],
  },
  {
    q: "Fixação do frênulo na gengiva inferior",
    opts: ["No topo da gengiva", "Logo abaixo da gengiva", "No assoalho da boca"],
  },
  {
    q: "Elevação da língua (durante o choro)",
    opts: ["Mínima", "Bordas / moderada", "Boa (até o meio da boca)"],
  },
  {
    q: "Extensão da língua para frente",
    opts: ["Não passa da gengiva", "Sobre a gengiva", "Sobre o lábio inferior"],
  },
];

export function tabbyTotal(v: (number | null)[] | undefined): number | null {
  if (!v || v.length < 4 || v.some((x) => x == null)) return null;
  return v.reduce((s, x) => (s as number) + (x as number), 0) as number;
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
  return (
    <div className="space-y-2">
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
                  className={`rounded-md border px-2 py-1.5 text-left text-[11px] leading-tight transition ${
                    active ? "border-primary bg-primary text-white" : "border-border bg-white hover:border-primary/50"
                  }`}
                >
                  <span className="font-semibold">{score}</span>
                  <span className="block">{opt}</span>
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
  );
}
