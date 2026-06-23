"use client";

import { useState } from "react";
import { extrairFicha, type ExtractStage } from "@/lib/extract";
import { parseFicha } from "@/lib/extract/parse-ficha";
import type { EvolucaoForm } from "@/lib/prontuario/form";

export function ImportFicha({
  onApply,
}: {
  onApply: (fields: Partial<EvolucaoForm>) => void;
}) {
  const [modo, setModo] = useState<"texto" | "pdf">("texto");
  const [texto, setTexto] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const [filled, setFilled] = useState<string[] | null>(null);
  const [erro, setErro] = useState("");
  const [rawOpen, setRawOpen] = useState(false);
  const [raw, setRaw] = useState("");

  const aplicar = (fields: Partial<EvolucaoForm>, lista: string[], rawText: string) => {
    onApply(fields);
    setFilled(lista);
    setRaw(rawText);
    setMsg(lista.length ? `${lista.length} campo(s) preenchido(s).` : "Nenhum campo reconhecido.");
  };

  const stageMsg = (s: ExtractStage): { text: string; pct: number | null } => {
    switch (s.stage) {
      case "lendo-pdf":
        return { text: "Lendo PDF…", pct: null };
      case "texto-ok":
        return { text: "Texto selecionável encontrado.", pct: null };
      case "ocr":
        return { text: `OCR (${s.status})…`, pct: Math.round((s.progress || 0) * 100) };
      case "parseando":
        return { text: "Extraindo campos…", pct: null };
      case "pronto":
        return { text: s.usouOcr ? "Concluído (OCR)." : "Concluído.", pct: 100 };
    }
  };

  const reset = () => {
    setFilled(null);
    setErro("");
    setMsg("");
    setPct(null);
  };

  const processarTexto = () => {
    reset();
    if (!texto.trim()) return;
    try {
      const res = parseFicha(texto);
      aplicar(res.fields, res.filled, res.rawText);
    } catch (e) {
      setErro((e as Error).message || "Falha ao analisar o texto.");
    }
  };

  const processarPdf = async () => {
    if (!file) return;
    setBusy(true);
    reset();
    setMsg("Iniciando…");
    try {
      const res = await extrairFicha(file, (s) => {
        const { text, pct } = stageMsg(s);
        setMsg(text);
        setPct(pct);
      });
      aplicar(res.fields, res.filled, res.rawText);
    } catch (e) {
      setErro((e as Error).message || "Falha na extração.");
      setMsg("");
    } finally {
      setBusy(false);
    }
  };

  const Tab = ({ id, label }: { id: "texto" | "pdf"; label: string }) => (
    <button
      type="button"
      onClick={() => { setModo(id); reset(); }}
      className={`rounded-md px-3 py-1.5 text-sm transition ${
        modo === id ? "bg-primary text-white" : "bg-white text-foreground border border-border"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="mb-3 rounded-xl border border-primary/30 bg-accent p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-primary">Importar ficha de parto</h2>
        <span className="text-xs text-muted">sem IA · no dispositivo</span>
      </div>

      <div className="mt-3 flex gap-1.5">
        <Tab id="texto" label="Colar texto" />
        <Tab id="pdf" label="Enviar PDF (OCR)" />
      </div>

      {modo === "texto" ? (
        <div className="mt-3">
          <p className="mb-1 text-xs text-muted">
            No seu leitor de PDF, selecione tudo (Ctrl+A), copie e cole aqui. É o caminho
            mais fiel — pega inclusive paridade, tipagem e Apgar.
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cole o texto da ficha…"
            className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            disabled={!texto.trim()}
            onClick={processarTexto}
            className="mt-2 rounded-md bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Processar texto
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <p className="mb-2 text-xs text-muted">
            Use quando o PDF não for selecionável. Roda OCR no aparelho (pode levar alguns
            segundos por página). Linhas muito densas podem não ser lidas.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); reset(); }}
              className="text-sm"
            />
            <button
              type="button"
              disabled={!file || busy}
              onClick={processarPdf}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-40"
            >
              {busy ? "Processando…" : "Processar"}
            </button>
          </div>
        </div>
      )}

      {(busy || msg) && (
        <div className="mt-2 text-xs text-foreground">
          {msg}
          {pct != null && (
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded bg-white">
              <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">Erro: {erro}</p>}

      {filled && filled.length > 0 && (
        <div className="mt-2 text-xs">
          <span className="font-medium text-primary">Preenchidos:</span> {filled.join(" · ")}
          <button type="button" className="ml-2 underline" onClick={() => setRawOpen((v) => !v)}>
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
