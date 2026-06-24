"use client";

/**
 * Seletor das zonas de Kramer da icterícia. Clicar numa zona preenche todas as
 * zonas até ela (1→N) em amarelo. value: 0 (nenhuma) a 5.
 */

const ZONAS_BT = [
  "",
  "Cabeça e pescoço (BT ~4–8 mg/dL)",
  "Tronco até a cicatriz umbilical (BT ~5–12)",
  "Abdome infraumbilical até joelhos (BT ~8–16)",
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
  const fill = (z: number) => (z <= value ? "#f59e0b" : "#eceff2");
  const stroke = "#9aa3ad";
  const zone = (z: number, children: React.ReactNode) => (
    <g
      onClick={() => onChange(value === z ? z - 1 : z)}
      style={{ cursor: "pointer" }}
      aria-label={`Zona ${z}`}
    >
      {children}
    </g>
  );

  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 140 210" className="h-56 w-auto select-none" role="img" aria-label="Zonas de Kramer">
        {/* Zona 4 — braços e pernas (desenhados atrás) */}
        {zone(4, (
          <g fill={fill(4)} stroke={stroke} strokeWidth={1.5}>
            <rect x="28" y="58" width="14" height="56" rx="7" />
            <rect x="98" y="58" width="14" height="56" rx="7" />
            <rect x="50" y="150" width="16" height="36" rx="7" />
            <rect x="74" y="150" width="16" height="36" rx="7" />
          </g>
        ))}
        {/* Zona 5 — mãos e pés */}
        {zone(5, (
          <g fill={fill(5)} stroke={stroke} strokeWidth={1.5}>
            <circle cx="35" cy="120" r="8" />
            <circle cx="105" cy="120" r="8" />
            <ellipse cx="58" cy="192" rx="11" ry="7.5" />
            <ellipse cx="82" cy="192" rx="11" ry="7.5" />
          </g>
        ))}
        {/* Zona 3 — abdome infraumbilical + coxas */}
        {zone(3, (
          <g fill={fill(3)} stroke={stroke} strokeWidth={1.5}>
            <rect x="46" y="88" width="48" height="30" rx="8" />
            <rect x="50" y="114" width="16" height="40" rx="7" />
            <rect x="74" y="114" width="16" height="40" rx="7" />
          </g>
        ))}
        {/* Zona 2 — tronco até cicatriz umbilical */}
        {zone(2, <rect x="46" y="54" width="48" height="36" rx="12" fill={fill(2)} stroke={stroke} strokeWidth={1.5} />)}
        {/* Zona 1 — cabeça e pescoço */}
        {zone(1, (
          <g fill={fill(1)} stroke={stroke} strokeWidth={1.5}>
            <rect x="62" y="44" width="16" height="12" />
            <circle cx="70" cy="26" r="20" />
          </g>
        ))}
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
        <p className="max-w-[200px] text-muted">
          {value > 0 ? <><strong className="text-foreground">Kramer {value}</strong> — {ZONAS_BT[value]}</> : "Clique até onde vai a icterícia."}
        </p>
      </div>
    </div>
  );
}
