"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from "recharts";
import type { PesoLinha } from "@/lib/clinical/weight";

const dm = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

export function WeightChart({ linhas }: { linhas: PesoLinha[] }) {
  const data = [...linhas].reverse().map((l) => ({
    data: dm(l.data),
    peso: l.gramas,
    gdia: l.gPorDia ?? 0,
    pct: l.percentualDesdeNascimento,
  }));

  if (data.length < 2) {
    return <p className="text-xs text-muted">Adicione ao menos 2 pesos para ver os gráficos.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-1 text-xs font-medium text-muted">Peso (g)</p>
        <div className="h-48 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={["dataMin - 100", "dataMax + 100"]} />
              <Tooltip formatter={(v, n) => (n === "peso" ? [`${v} g`, "Peso"] : [String(v), String(n)])} />
              <Line type="monotone" dataKey="peso" stroke="#0e6e6e" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted">Velocidade (g/dia)</p>
        <div className="h-40 w-full">
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
              <XAxis dataKey="data" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} g/dia`, "Variação"]} />
              <ReferenceLine y={0} stroke="#6b7480" />
              <Bar dataKey="gdia">
                {data.map((d, i) => (
                  <Cell key={i} fill={d.gdia >= 0 ? "#0e6e6e" : "#c2410c"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
