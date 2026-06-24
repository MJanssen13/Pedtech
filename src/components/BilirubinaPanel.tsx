"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Field, TextInput, Checkbox, Grid } from "@/components/ui";
import type { BilitoolResult } from "@/lib/clinical/bilitool";

const FATORES = [
  "IG < 38 semanas",
  "Doença hemolítica isoimune, G6PD ou outra hemólise",
  "Albumina < 3,0 g/dL",
  "Sepse",
  "Instabilidade clínica nas últimas 24h",
];

interface Medicao {
  idadeHoras: string;
  valor: string;
  tipo: "TcB" | "TSB";
}

export function BilirubinaPanel({ semanasIniciais }: { semanasIniciais?: number }) {
  const [semanas, setSemanas] = useState(semanasIniciais ? String(semanasIniciais) : "");
  const [fatores, setFatores] = useState<boolean[]>(FATORES.map(() => false));
  const [medicoes, setMedicoes] = useState<Medicao[]>([{ idadeHoras: "", valor: "", tipo: "TcB" }]);
  const [result, setResult] = useState<BilitoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const calcular = async () => {
    setErro("");
    setLoading(true);
    try {
      const pares = medicoes
        .map((m) => ({ idadeHoras: Number(m.idadeHoras), tsb: Number(m.valor.replace(",", ".")) }))
        .filter((p) => Number.isFinite(p.idadeHoras) && Number.isFinite(p.tsb) && p.tsb > 0);
      const res = await fetch("/api/bilitool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pares, semanas: Number(semanas), fatoresRisco: fatores.some(Boolean) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha na consulta.");
      setResult(json);
    } catch (e) {
      setResult(null);
      setErro((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const maxX = useMemo(() => {
    const px = result?.paciente.map((p) => p.x) ?? [];
    return Math.min(336, Math.max(96, ...(px.length ? px.map((x) => x + 24) : [96])));
  }, [result]);

  const data = useMemo(() => {
    if (!result) return [];
    const map = (a: { x: number; y: number }[]) => Object.fromEntries(a.map((p) => [p.x, p.y]));
    const fm = map(result.curvas.fototerapia);
    const em = map(result.curvas.escalonamento);
    const xm = map(result.curvas.exsanguineo);
    const pm = map(result.paciente);
    const xs = new Set<number>();
    [result.curvas.fototerapia, result.curvas.escalonamento, result.curvas.exsanguineo, result.paciente].forEach((arr) =>
      arr.forEach((p) => p.x <= maxX && xs.add(p.x)),
    );
    return [...xs]
      .sort((a, b) => a - b)
      .map((x) => ({ x, foto: fm[x] ?? null, escal: em[x] ?? null, exch: xm[x] ?? null, pac: pm[x] ?? null }));
  }, [result, maxX]);

  const upd = (i: number, patch: Partial<Medicao>) => {
    const a = [...medicoes];
    a[i] = { ...a[i], ...patch };
    setMedicoes(a);
  };

  const semNum = Number(semanas);

  return (
    <div className="space-y-3">
      <Grid cols={2}>
        <Field label="IG (semanas, 35–40)" hint={semanas && (semNum < 35 || semNum > 40) ? "BiliTool cobre 35–40 sem" : undefined}>
          <TextInput inputMode="numeric" value={semanas} onChange={(e) => setSemanas(e.target.value)} placeholder="ex.: 39" />
        </Field>
      </Grid>

      <Field label="Fatores de risco de neurotoxicidade (AAP 2022)">
        <div className="flex flex-col gap-1.5">
          {FATORES.map((f, i) => (
            <Checkbox key={i} label={f} checked={fatores[i]} onChange={(v) => setFatores(fatores.map((x, j) => (j === i ? v : x)))} />
          ))}
        </div>
      </Field>

      <div className="rounded-lg border border-border p-2">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">Medições (hora de vida + BT)</span>
          <button type="button" className="text-xs text-primary underline" onClick={() => setMedicoes([...medicoes, { idadeHoras: "", valor: "", tipo: "TcB" }])}>
            + medição
          </button>
        </div>
        {medicoes.map((m, i) => (
          <Grid key={i} cols={3}>
            <Field label="Hora de vida"><TextInput inputMode="numeric" value={m.idadeHoras} onChange={(e) => upd(i, { idadeHoras: e.target.value })} placeholder="h" /></Field>
            <Field label="BT (mg/dL)"><TextInput inputMode="decimal" value={m.valor} onChange={(e) => upd(i, { valor: e.target.value })} /></Field>
            <div className="flex items-end gap-1">
              <Field label="Tipo">
                <select value={m.tipo} onChange={(e) => upd(i, { tipo: e.target.value as Medicao["tipo"] })} className="w-full rounded-lg border border-border bg-white px-2 py-2">
                  <option value="TcB">BiliChek (TcB)</option>
                  <option value="TSB">Sérica (TSB)</option>
                </select>
              </Field>
              {medicoes.length > 1 && (
                <button type="button" className="pb-2 text-xs text-red-500" onClick={() => setMedicoes(medicoes.filter((_, j) => j !== i))}>×</button>
              )}
            </div>
          </Grid>
        ))}
      </div>

      <button type="button" onClick={calcular} disabled={loading} className="rounded-md bg-primary px-3 py-1.5 text-sm text-white disabled:opacity-40">
        {loading ? "Consultando BiliTool…" : "Calcular (BiliTool / AAP 2022)"}
      </button>
      {erro && <p className="text-xs text-red-600">Erro: {erro}</p>}

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-2">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data} margin={{ top: 8, right: 10, left: -10, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f5" />
                <XAxis dataKey="x" type="number" domain={[0, maxX]} tickCount={7} fontSize={11} label={{ value: "Horas de vida", position: "insideBottom", offset: -8, fontSize: 11 }} />
                <YAxis fontSize={11} width={36} label={{ value: "BT (mg/dL)", angle: -90, position: "insideLeft", fontSize: 11 }} />
                <Tooltip formatter={(v) => `${v} mg/dL`} labelFormatter={(l) => `${l} h`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="exch" name="Exsanguíneo" stroke="#e06666" dot={false} connectNulls strokeWidth={2} />
                <Line type="monotone" dataKey="escal" name="Escalonar" stroke="#d4a017" dot={false} connectNulls strokeWidth={2} />
                <Line type="monotone" dataKey="foto" name="Fototerapia" stroke="#3b9ed6" dot={false} connectNulls strokeWidth={2} />
                <Scatter dataKey="pac" name="Paciente" fill="#16a34a" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {([
              ["Confirmar TSB", result.limiares.confirmarTSB],
              ["Fototerapia", result.limiares.fototerapia],
              ["Escalonar", result.limiares.escalonamento],
              ["Exsanguíneo", result.limiares.exsanguineo],
            ] as const).map(([nome, l]) => (
              <div key={nome} className="rounded-lg border border-border p-2">
                <div className="text-muted">{nome}</div>
                <div className="font-semibold text-foreground">{l.mgdl != null ? `${l.mgdl} mg/dL` : "—"}</div>
                {l.resposta && <div className={l.resposta === "Yes" ? "text-red-600" : "text-muted"}>{l.resposta === "Yes" ? "Indicado" : "Não indicado"}</div>}
              </div>
            ))}
          </div>

          {result.deltaTSB && (
            <p className="text-sm">
              <strong className="text-primary">Δ-TSB:</strong> {result.deltaTSB.valor} mg/dL{" "}
              {result.deltaTSB.direcao === "below" ? "abaixo" : "acima"} do limiar de fototerapia (às {result.deltaTSB.idadeHoras}h).
            </p>
          )}
          {result.seguimento && <p className="text-xs text-muted">{result.seguimento}</p>}
          <a href={result.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-xs text-primary underline">
            Abrir no BiliTool (página oficial) ↗
          </a>
        </div>
      )}
    </div>
  );
}
