"use client";

/**
 * Zonas de Kramer da icterícia sobre um RN. Clicar numa zona "amarela" todas as
 * zonas até ela (1→N). value: 0 (nenhuma) a 5.
 *   1 cabeça/pescoço · 2 tronco até cicatriz umbilical · 3 até os joelhos ·
 *   4 braços e pernas · 5 mãos e pés
 */

const SKIN = "#f9cfa9";
const LINE = "#e7a67e";
const JA = "#eec531"; // pele ictérica

const ZONAS_BT = [
  "",
  "Cabeça e pescoço (BT ~4–8 mg/dL)",
  "Tronco até a cicatriz umbilical (BT ~5–12)",
  "Até os joelhos (BT ~8–16)",
  "Braços e pernas (BT ~11–18)",
  "Mãos e pés, incl. palmas e plantas (BT ≥15)",
];

export function KramerSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const fz = (z: number) => (z <= value ? JA : SKIN);
  const zp = (z: number) => ({ onClick: () => onChange(value === z ? z - 1 : z), style: { cursor: "pointer" } });

  // membro = traço com contorno; recebe a zona p/ cor e clique
  const limb = (z: number, d: string, w: number) => (
    <g {...zp(z)}>
      <path d={d} fill="none" stroke={LINE} strokeWidth={w + 4} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={fz(z)} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 200 300" className="h-64 w-auto select-none" role="img" aria-label="Zonas de Kramer">
        {/* BRAÇOS (zona 4) + MÃOS (zona 5) — atrás do tronco */}
        {limb(4, "M70 122 Q52 104 36 116", 15)}
        {limb(4, "M130 122 Q148 104 164 116", 15)}
        <g {...zp(5)}>
          <circle cx="33" cy="118" r="10" fill={fz(5)} stroke={LINE} strokeWidth={2} />
          <circle cx="167" cy="118" r="10" fill={fz(5)} stroke={LINE} strokeWidth={2} />
        </g>

        {/* PERNAS: coxas (zona 3), canelas (zona 4), pés (zona 5) */}
        {limb(3, "M86 202 L83 244", 21)}
        {limb(3, "M114 202 L117 244", 21)}
        {limb(4, "M83 244 L82 283", 17)}
        {limb(4, "M117 244 L118 283", 17)}
        <g {...zp(5)}>
          <ellipse cx="78" cy="287" rx="14" ry="8" fill={fz(5)} stroke={LINE} strokeWidth={2} />
          <ellipse cx="122" cy="287" rx="14" ry="8" fill={fz(5)} stroke={LINE} strokeWidth={2} />
        </g>

        {/* TRONCO INFERIOR até joelhos (zona 3) */}
        <path
          {...zp(3)}
          d="M64 158 Q60 198 86 204 L114 204 Q140 198 136 158 Z"
          fill={fz(3)}
          stroke={LINE}
          strokeWidth={2}
        />
        {/* FRALDA (branca, por cima da zona 3) */}
        <path d="M66 170 Q64 202 100 208 Q136 202 134 170 Q100 186 66 170 Z" fill="#ffffff" stroke="#dfe3e8" strokeWidth={2} />
        <path d="M66 170 Q100 182 134 170" fill="none" stroke="#dfe3e8" strokeWidth={2} />

        {/* TRONCO SUPERIOR até cicatriz umbilical (zona 2) */}
        <path
          {...zp(2)}
          d="M60 122 Q60 110 74 110 L126 110 Q140 110 140 122 L138 158 Q138 168 126 168 L74 168 Q62 168 62 158 Z"
          fill={fz(2)}
          stroke={LINE}
          strokeWidth={2}
        />
        <circle cx="84" cy="138" r="2.4" fill={LINE} />
        <circle cx="116" cy="138" r="2.4" fill={LINE} />
        <path d="M97 160 Q100 164 103 160" fill="none" stroke={LINE} strokeWidth={1.6} />

        {/* PESCOÇO + CABEÇA + ORELHAS (zona 1) */}
        <g {...zp(1)}>
          <rect x="88" y="98" width="24" height="20" rx="9" fill={fz(1)} stroke={LINE} strokeWidth={2} />
          <ellipse cx="57" cy="62" rx="8" ry="12" fill={fz(1)} stroke={LINE} strokeWidth={2} />
          <ellipse cx="143" cy="62" rx="8" ry="12" fill={fz(1)} stroke={LINE} strokeWidth={2} />
          <ellipse cx="100" cy="58" rx="44" ry="46" fill={fz(1)} stroke={LINE} strokeWidth={2} />
        </g>

        {/* Cabelinho */}
        <path d="M104 16 q10 -2 8 8 q-2 7 -9 4" fill="none" stroke="#7a5235" strokeWidth={3} strokeLinecap="round" />

        {/* Rosto (constante) */}
        <path d="M76 46 q8 -6 16 -1" fill="none" stroke="#7a5235" strokeWidth={3} strokeLinecap="round" />
        <path d="M108 45 q8 -5 16 1" fill="none" stroke="#7a5235" strokeWidth={3} strokeLinecap="round" />
        <ellipse cx="84" cy="60" rx="5.5" ry="7" fill="#4a3526" />
        <ellipse cx="116" cy="60" rx="5.5" ry="7" fill="#4a3526" />
        <circle cx="86" cy="57" r="1.6" fill="#fff" />
        <circle cx="118" cy="57" r="1.6" fill="#fff" />
        <ellipse cx="72" cy="72" rx="8" ry="5" fill="#f3a89f" opacity="0.75" />
        <ellipse cx="128" cy="72" rx="8" ry="5" fill="#f3a89f" opacity="0.75" />
        <path d="M100 64 q4 4 0 7" fill="none" stroke={LINE} strokeWidth={2} strokeLinecap="round" />
        <path d="M88 80 q12 10 24 0" fill="none" stroke="#b9534c" strokeWidth={3} strokeLinecap="round" />
      </svg>

      <div className="text-xs">
        <div className="mb-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => onChange(z)}
              className={`h-7 w-7 rounded-full border text-sm ${
                z <= value ? "border-amber-500 bg-amber-400 text-white" : "border-border bg-white"
              }`}
            >
              {z}
            </button>
          ))}
          <button type="button" onClick={() => onChange(0)} className="ml-1 text-muted underline">
            limpar
          </button>
        </div>
        <p className="max-w-[210px] text-muted">
          {value > 0 ? (
            <>
              <strong className="text-foreground">Kramer {value}</strong> — {ZONAS_BT[value]}
            </>
          ) : (
            "Clique no corpo até onde vai a icterícia."
          )}
        </p>
      </div>
    </div>
  );
}
