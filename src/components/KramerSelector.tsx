"use client";

/**
 * Zonas de Kramer da icterícia, usando as ilustrações fornecidas (public/kramer).
 * value 0 = sem icterícia (Padrão); 1..5 = extensão crescente.
 * Clicar numa faixa do corpo (ou nos botões) define a zona.
 */

const ZONAS_BT = [
  "",
  "Cabeça e pescoço (BT ~4–8 mg/dL)",
  "Tronco até a cicatriz umbilical (BT ~5–12)",
  "Até os joelhos (BT ~8–16)",
  "Braços e pernas (BT ~11–18)",
  "Mãos e pés, incl. palmas e plantas (BT ≥15)",
];

// limites verticais das 5 faixas (% da altura da imagem)
const BANDAS = [0, 30, 52, 73, 90, 100];

const src = (v: number) => (v >= 1 && v <= 5 ? `/kramer/k${v}.svg` : "/kramer/padrao.svg");

export function KramerSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <div className="relative w-40 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(value)} alt={`Zonas de Kramer — zona ${value}`} className="w-full select-none" draggable={false} />
        {[1, 2, 3, 4, 5].map((z) => (
          <button
            key={z}
            type="button"
            onClick={() => onChange(value === z ? z - 1 : z)}
            aria-label={`Kramer ${z}: ${ZONAS_BT[z]}`}
            title={`Kramer ${z}`}
            style={{
              position: "absolute",
              left: 0,
              top: `${BANDAS[z - 1]}%`,
              height: `${BANDAS[z] - BANDAS[z - 1]}%`,
              width: "100%",
            }}
            className="cursor-pointer rounded hover:bg-amber-300/20"
          />
        ))}
      </div>

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
