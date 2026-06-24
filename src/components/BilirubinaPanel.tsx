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
import { parseBTExames, type BilitoolResult } from "@/lib/clinical/bilitool";

const FATORES = [
  "IG < 38 semanas",
  "Doença hemolítica isoimune, G6PD ou outra hemólise",
  "Albumina < 3,0 g/dL",
  "Sepse",
  "Instabilidade clínica nas últimas 24h",
];

interface Medicao {
  quando: string; // datetime-local
  valor: string;
  tipo: "TcB" | "TSB";
  rotulo?: string;
}

const dm = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export function BilirubinaPanel({
  semanasIniciais,
  nascimentoEm,
  bilicheck,
  examesComplementares,
}: {
  semanasIniciais?: number;
  nascimentoEm?: string; // "YYYY-MM-DDTHH:mm"
  bilicheck?: { valor: string; data: string; hora: string };
  examesComplementares?: string;
}) {
  const [semanas, setSemanas] = useState(semanasIniciais ? String(semanasIniciais) : "");
  const [fatores, setFatores] = useState<boolean[]>(FATORES.map(() => false));
  const [medicoes, setMedicoes] = useState<Medicao[]>([]);
  const [result, setResult] = useState<BilitoolResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  const horasDeVida = (quando: string): number | null => {
    if (!nascimentoEm || !quando) return null;
    const h = (new Date(quando).getTime() - new Date(nascimentoEm).getTime()) / 3_600_000;
    return Number.isFinite(h) ? Math.round(h) : null;
  };

  const importar = () => {
    const novos: Medicao[] = [];
    if (bilicheck?.valor && bilicheck.data) {
      novos.push({ quando: `${bilicheck.data}T${bilicheck.hora || "08:00"}`, valor: bilicheck.valor, tipo: "TcB", rotulo: "BiliChek" });
    }
    for (const bt of parseBTExames(examesComplementares)) {
      novos.push({
        quando: `${bt.data}T${bt.hora || "08:00"}`,
        valor: String(bt.valor),
        tipo: "TSB",
        rotulo: `Lab ${dm(bt.data)}${bt.hora ? "" : " — confirme a hora"}`,
      });
    }
    if (novos.length) setMedicoes(novos);
  };

  const calcular = async () => {
    setErro("");
    setLoading(true);
    try {
      const pares = medicoes
        .map((m) => ({ idadeHoras: horasDeVida(m.quando), tsb: Number(String(m.valor).replace(",", ".")) }))
        .filter((p): p is { idadeHoras: number; tsb: number } => p.idadeHoras != null && Number.isFinite(p.tsb) && p.tsb > 0);
      if (!pares.length) throw new Error("Sem medições válidas (informe DN/HN e hora da coleta).");
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
    return [...xs].sort((a, b) => a - b).map((x) => ({ x, foto: fm[x] ?? null, escal: em[x] ?? null, exch: xm[x] ?? null, pac: pm[x] ?? null }));
  }, [result, maxX]);

  const upd = (i: number, patch: Partial<Medicao>) => {
    const a = [...medicoes];
    a[i] = { ...a[i], ...patch };
    setMedicoes(a);
  };

  const semNum = Number(semanas);
  const semBirth = !nascimentoEm;

  return (
    <div className="space-y-3">
      <Grid cols={2}>
        <Field label="IG (semanas, 35–40)" hint={semanas && (semNum < 35 || semNum > 40) ? "BiliTool cobre 35–40 sem" : undefined}>
          <TextInput inputMode="numeric" value={semanas} onChange={(e) => setSemanas(e.target.value)} placeholder="ex.: 39" />
        </Field>
      </Grid>

      <Field label="Fatores de risco de neurotoxicidade (AAP 2022)">
        <div className="flex flex-col gap-1.5">
          {FATORES.map((ff, i) => (
            <Checkbox key={i} label={ff} checked={fatores[i]} onChange={(v) => setFatores(fatores.map((x, j) => (j === i ? v : x)))} />
          ))}
        </div>
      </Field>

      <div className="rounded-lg border border-border p-2">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted">Medições (data/hora + BT)</span>
          <div className="flex gap-2">
            <button type="button" className="text-xs text-primary underline" onClick={importar}>
              ⤓ Importar BiliChek + exames (BT)
            </button>
            <button type="button" className="text-xs text-primary underline" onClick={() => setMedicoes([...medicoes, { quando: "", valor: "", tipo: "TcB" }])}>
              + medição
            </button>
          </div>
        </div>
        {semBirth && <p className="mb-1 text-xs text-amber-600">Informe DN e HN (identificação) para calcular as horas de vida.</p>}
        {medicoes.length === 0 && <p className="text-xs text-muted">Use &quot;Importar&quot; para puxar o BiliChek e os BT dos exames, ou adicione manualmente.</p>}
        {medicoes.map((m, i) => {
          const hv = horasDeVida(m.quando);
          return (
            <div key={i} className="mb-1 rounded-md border border-border p-1.5">
              {m.rotulo && <div className="mb-1 text-[11px] font-medium text-primary">{m.rotulo}</div>}
              <Grid cols={3}>
                <Field label="Data/hora coleta"><TextInput type="datetime-local" value={m.quando} onChange={(e) => upd(i, { quando: e.target.value })} /></Field>
                <Field label="BT (mg/dL)"><TextInput inputMode="decimal" value={m.valor} onChange={(e) => upd(i, { valor: e.target.value })} /></Field>
                <div className="flex items-end gap-1">
                  <Field label="Tipo">
                    <select value={m.tipo} onChange={(e) => upd(i, { tipo: e.target.value as Medicao["tipo"] })} className="w-full rounded-lg border border-border bg-white px-2 py-2">
                      <option value="TcB">BiliChek</option>
                      <option value="TSB">Sérica</option>
                    </select>
                  </Field>
                  <button type="button" className="pb-2 text-xs text-red-500" onClick={() => setMedicoes(medicoes.filter((_, j) => j !== i))}>×</button>
                </div>
              </Grid>
              <div className="mt-0.5 text-[11px] text-muted">{hv != null ? `${hv} h de vida` : "—"}</div>
            </div>
          );
        })}
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
