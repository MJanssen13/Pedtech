"use client";

import { useState } from "react";
import { extrairFicha, type ExtractStage } from "@/lib/extract";
import type { EvolucaoForm } from "@/lib/prontuario/form";

export function ImportFicha({
  onApply,
}: {
  onApply: (fields: Partial<EvolucaoForm>) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [filled, setFilled] = useState<string[] | null>(null);
  const [erro, setErro] = useState("");
  const [rawOpen, setRawOpen] = useState(false);
  const [raw, setRaw] = useState("");

  const stageMsg = (s: ExtractStage): { text: string; pct: number | null } => {
    switch (s.stage) {
      case "lendo-pdf":
        return { text: "Lendo PDF…", pct: null };
      case "texto-ok":
        return { text: "Texto selecionável encontrado.", pct: null };
      case "ocr":
        return {
          text: `OCR (${s.status})…`,
          pct: Math.round((s.progress || 0) * 100),
        };
      case "parseando":
        return { text: "Extraindo campos…", pct: null };
      case "pronto":
        return { text: s.usouOcr ? "Concluído (OCR)." : "Concluído.", pct: 100 };
    }
  };

  const processar = async () => {
    if (!file) return;
    setBusy(true);
    setErro("");
    setFilled(null);
    setMsg("Iniciando…");
    setPct(null);
    try {
      const res = await extrairFicha(file, (s) => {
        const { text, pct } = stageMsg(s);
        setMsg(text);
        setPct(pct);
      });
      onApply(res.fields);
      setFilled(res.filled);
      setRaw(res.rawText);
      setMsg(
        res.filled.length
          ? `${res.filled.length} campo(s) preenchido(s).`
          : "Nenhum campo reconhecido — confira o PDF.",
      );
    } catch (e) {
      setErro((e as Error).message || "Falha na extração.");
      setMsg("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mb-3 rounded-xl border border-primary/30 bg-accent p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">
          Importar ficha de parto (PDF)
        </h2>
        <span className="text-xs text-muted">sem IA · no dispositivo</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        Lê o texto do PDF (ou roda OCR se for imagem) e pré-preenche os campos. Tudo
        revisável antes de salvar.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setFilled(null);
            setErro("");
            setMsg("");
          }}
          className="text-sm"
        />
        <button
          type="button"
          disabled={!file || busy}
          onClick={processar}
          className="rounded-md bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-40"
        >
          {busy ? "Processando…" : "Processar"}
        </button>
      </div>

      {(busy || msg) && (
        <div className="mt-2 text-xs text-foreground">
          {msg}
          {pct != null && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-white">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">Erro: {erro}</p>}

      {filled && filled.length > 0 && (
        <div className="mt-2 text-xs">
          <span className="font-medium text-primary">Preenchidos:</span>{" "}
          {filled.join(" · ")}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setRawOpen((v) => !v)}
          >
            {rawOpen ? "ocultar texto" : "ver texto extraído"}
          </button>
          {rawOpen && (
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] leading-snug">
              {raw}
            </pre>
          )}
        </div>
      )}
    </section>
  );
}
