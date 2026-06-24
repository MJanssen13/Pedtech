"use client";

import { useState } from "react";
import { CAPURRO_SIGNS, calcularCapurroSomatico, type CapurroSign } from "@/lib/clinical/capurro";

export function CapurroCalculator({
  onClose,
  onResult,
}: {
  onClose: () => void;
  onResult: (sem: number, dias: number) => void;
}) {
  const [sel, setSel] = useState<Partial<Record<CapurroSign, number>>>({});
  const result = calcularCapurroSomatico(sel);
  const signs = Object.keys(CAPURRO_SIGNS) as CapurroSign[];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-6 w-full max-w-lg rounded-xl bg-card p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-primary">Capurro somático</h3>
          <button type="button" onClick={onClose} className="px-2 text-muted">✕</button>
        </div>

        <div className="space-y-3">
          {signs.map((s) => (
            <div key={s}>
              <p className="mb-1 text-xs font-medium">{CAPURRO_SIGNS[s].titulo}</p>
              <div className="flex flex-col gap-1">
                {CAPURRO_SIGNS[s].opcoes.map((o) => (
                  <button
                    key={o.pontos}
                    type="button"
                    onClick={() => setSel((prev) => ({ ...prev, [s]: o.pontos }))}
                    className={`rounded-md border px-2 py-1.5 text-left text-xs ${
                      sel[s] === o.pontos ? "border-primary bg-accent ring-1 ring-primary/30" : "border-border bg-white"
                    }`}
                  >
                    <span className="font-semibold text-primary">{o.pontos}</span> — {o.rotulo}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-sm">
            {result ? (
              <>
                IG: <strong>{result.semanas} sem {result.dias} d</strong> ({result.totalPontos} pts)
              </>
            ) : (
              "Selecione os 5 sinais"
            )}
          </span>
          <button
            type="button"
            disabled={!result}
            onClick={() => result && onResult(result.semanas, result.dias)}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Usar IG
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted">IG = 204 + Σ pontos. Confira contra fonte oficial antes do uso assistencial.</p>
      </div>
    </div>
  );
}
