"use client";

import { useMemo, useState } from "react";
import {
  Section,
  Field,
  TextInput,
  TextArea,
  Select,
  SegGroup,
  MultiGroup,
  Checkbox,
  Grid,
} from "@/components/ui";
import {
  emptyForm,
  buildRenderInput,
  computePercentis,
  GLUCO_24H,
  type EvolucaoForm,
} from "@/lib/prontuario/form";
import { calcularHorasDeVida } from "@/lib/clinical/hours-of-life";
import { calcularTendenciaPeso } from "@/lib/clinical/weight";
import { WeightChart } from "@/components/WeightChart";
import { TabbySelector } from "@/components/TabbySelector";
import { KramerSelector } from "@/components/KramerSelector";
import { renderProntuario } from "@/lib/prontuario/render";
import { ImportFicha } from "@/components/ImportFicha";
import type {
  Sexo,
  ViaNascimento,
  Acompanhante,
  TipoAlimentacao,
  StatusTriagem,
  StatusVacina,
  Vinculo,
  Pega,
  Succao,
  Producao,
  Queixa,
  ProfilaxiaModo,
} from "@/lib/domain/types";
import {
  REFLEXOS_NEURO,
  EXAME_GERAL_NORMAL,
  EXAME_ACV_NORMAL,
  EXAME_AR_NORMAL,
  EXAME_ABDOME_NORMAL,
  EXAME_COTO_NORMAL,
  EXAME_MEMBROS_NORMAL,
  genitaliaNormal,
} from "@/lib/clinical/exam-defaults";

const triagemOpts: { value: StatusTriagem; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "alterado", label: "Alterado" },
  { value: "aguardo", label: "Aguardo" },
];
const rhOpts = [
  { value: "positivo", label: "Positivo" },
  { value: "negativo", label: "Negativo" },
];
const aboOpts = ["A", "B", "O", "AB"].map((v) => ({ value: v, label: v }));
const hojeStr = () => new Date().toISOString().slice(0, 10);
const vacinaOpts: { value: StatusVacina; label: string }[] = [
  { value: "realizada", label: "Realizada" },
  { value: "aguardo", label: "Aguardo" },
];

export default function EvolucaoPage() {
  const [f, setForm] = useState<EvolucaoForm>(emptyForm);
  const set = <K extends keyof EvolucaoForm>(k: K, v: EvolucaoForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const texto = useMemo(() => {
    try {
      return renderProntuario(buildRenderInput(f));
    } catch (e) {
      return `Erro ao gerar: ${(e as Error).message}`;
    }
  }, [f]);

  const triagem =
    (
      statusKey: "olhinho" | "coracaozinho" | "orelhinha" | "pezinho",
      dataKey: "olhinhoData" | "coracaozinhoData" | "orelhinhaData" | "pezinhoData",
    ) =>
    (v?: StatusTriagem) =>
      setForm((prev) => {
        const next = { ...prev, [statusKey]: v ?? "aguardo" } as EvolucaoForm;
        if ((v === "normal" || v === "alterado") && !prev[dataKey]) next[dataKey] = hojeStr();
        if (!v || v === "aguardo") next[dataKey] = "";
        return next;
      });

  const horasVida = useMemo(() => {
    if (!f.dn) return null;
    const nasc = f.hn ? `${f.dn}T${f.hn}:00` : `${f.dn}T00:00:00`;
    try {
      return calcularHorasDeVida({
        nascimento: new Date(nasc).toISOString(),
        diaEvolucao: f.dataEvolucao,
        horaCorte: f.corteHorario,
      }).horas;
    } catch {
      return null;
    }
  }, [f.dn, f.hn, f.dataEvolucao, f.corteHorario]);

  const trendPeso = useMemo(() => {
    const serie = f.pesos
      .filter((p) => p.gramas)
      .map((p) => ({ data: p.data, gramas: Number(p.gramas), nascimento: p.nascimento }));
    const atual = Number(String(f.pesoAtualG).replace(",", "."));
    if (f.pesoAtualG.trim() && !Number.isNaN(atual)) serie.push({ data: f.dataEvolucao, gramas: atual, nascimento: false });
    return calcularTendenciaPeso(serie);
  }, [f.pesos, f.pesoAtualG, f.dataEvolucao]);

  const perc = useMemo(() => computePercentis(f), [f]);
  const percHint = (s?: string) =>
    s
      ? `Percentil ${s.replace(/[()]/g, "")}`
      : !f.sexo || perc.gaDias == null
        ? "defina sexo e IG (33–42+6 sem) p/ percentil"
        : undefined;

  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_minmax(320px,440px)]">
      {/* ─────────────── FORMULÁRIO ─────────────── */}
      <div>
        <h1 className="mb-3 text-lg font-semibold">Nova evolução</h1>

        <ImportFicha
          onApply={(fields) =>
            setForm((prev) => {
              const merged = { ...prev };
              for (const [k, v] of Object.entries(fields)) {
                if (v !== undefined && v !== "") {
                  (merged as Record<string, unknown>)[k] = v;
                }
              }
              return merged;
            })
          }
        />

        <Section title="Identificação">
          <Grid>
            <Field label="Nome da mãe">
              <TextInput value={f.maeNome} onChange={(e) => set("maeNome", e.target.value)} />
            </Field>
            <Field label="RG mãe">
              <TextInput value={f.maeRg} onChange={(e) => set("maeRg", e.target.value)} />
            </Field>
            <Field label="Leito">
              <TextInput value={f.leito} onChange={(e) => set("leito", e.target.value)} />
            </Field>
            <Field label="Procedência">
              <TextInput value={f.procedencia} onChange={(e) => set("procedencia", e.target.value)} />
            </Field>
            <Field label="Paridade (pós-parto)">
              <TextInput value={f.paridade} onChange={(e) => set("paridade", e.target.value)} placeholder="G_P_A_" />
            </Field>
            <Field label="Nome do RN">
              <TextInput value={f.rnNome} onChange={(e) => set("rnNome", e.target.value)} />
            </Field>
            <Field label="RG RN">
              <TextInput value={f.rnRg} onChange={(e) => set("rnRg", e.target.value)} />
            </Field>
            <Field label="Sexo">
              <SegGroup<Sexo>
                options={[
                  { value: "feminino", label: "Feminino" },
                  { value: "masculino", label: "Masculino" },
                ]}
                value={f.sexo}
                onChange={(v) => set("sexo", v)}
              />
            </Field>
            <Field label="Data de nascimento">
              <TextInput type="date" value={f.dn} onChange={(e) => set("dn", e.target.value)} />
            </Field>
            <Field label="Hora de nascimento">
              <TextInput type="time" value={f.hn} onChange={(e) => set("hn", e.target.value)} />
            </Field>
            <Field label="Data da evolução">
              <TextInput type="date" value={f.dataEvolucao} onChange={(e) => set("dataEvolucao", e.target.value)} />
            </Field>
            <Field label="Horas de vida até as (corte)">
              <TextInput type="time" value={f.corteHorario} onChange={(e) => set("corteHorario", e.target.value)} />
            </Field>
          </Grid>
        </Section>

        <Section title="Sala de parto">
          <Field label="Nascimento">
            <SegGroup<ViaNascimento>
              options={[
                { value: "vaginal", label: "Vaginal" },
                { value: "cesarea", label: "Cesárea" },
              ]}
              value={f.via}
              onChange={(v) => set("via", v)}
            />
          </Field>
          {f.via === "cesarea" && (
            <Field label="Indicação da cesárea">
              <TextInput value={f.indicacaoCesarea} onChange={(e) => set("indicacaoCesarea", e.target.value)} />
            </Field>
          )}
          <Grid cols={3}>
            <Field label="Peso (g)" hint={percHint(perc.peso)}>
              <TextInput inputMode="numeric" value={f.pesoNascimentoG} onChange={(e) => set("pesoNascimentoG", e.target.value)} />
            </Field>
            <Field label="PC (cm)" hint={percHint(perc.pc)}>
              <TextInput inputMode="decimal" value={f.pcCm} onChange={(e) => set("pcCm", e.target.value)} />
            </Field>
            <Field label="Comprimento (cm)" hint={percHint(perc.comprimento)}>
              <TextInput inputMode="decimal" value={f.comprimentoCm} onChange={(e) => set("comprimentoCm", e.target.value)} />
            </Field>
            <Field label="Apgar 1º min">
              <TextInput inputMode="numeric" value={f.apgar1} onChange={(e) => set("apgar1", e.target.value)} />
            </Field>
            <Field label="Apgar 5º min">
              <TextInput inputMode="numeric" value={f.apgar5} onChange={(e) => set("apgar5", e.target.value)} />
            </Field>
          </Grid>
          <Field label="Evolução do nascimento (descrição da sala de parto)">
            <TextArea value={f.nascimentoDescricao} onChange={(e) => set("nascimentoDescricao", e.target.value)} />
          </Field>
        </Section>

        <Section title="Idade gestacional">
          <Field label="IG pela DUM">
            <div className="flex items-center gap-2">
              <TextInput
                value={f.igDumIncerta ? "incerta" : f.igDum}
                disabled={f.igDumIncerta}
                onChange={(e) => set("igDum", e.target.value)}
                placeholder="ex.: 39 semanas e 2 dias"
                className={f.igDumIncerta ? "opacity-50" : ""}
              />
              <Checkbox label="Incerta" checked={f.igDumIncerta} onChange={(v) => set("igDumIncerta", v)} />
            </div>
          </Field>
          <Field label="IG pelo USG">
            <TextInput value={f.igUsg} onChange={(e) => set("igUsg", e.target.value)} placeholder="ex.: 38 semanas e 4 dias (US ...)" />
          </Field>
          <Field
            label="Calcular percentil (Intergrowth) por"
            hint={
              perc.gaDias != null
                ? `IG usada: ${Math.floor(perc.gaDias / 7)} sem ${perc.gaDias % 7} d`
                : "IG não reconhecida (use '39 semanas e 4 dias'). Válido de 33 a 42+6 sem."
            }
          >
            <SegGroup
              options={[
                { value: "usg", label: "USG" },
                { value: "dum", label: "DUM" },
              ]}
              value={f.percentilFonte}
              onChange={(v) => set("percentilFonte", (v ?? "usg") as EvolucaoForm["percentilFonte"])}
              allowClear={false}
            />
          </Field>
        </Section>

        <Section title="Risco infeccioso">
          <Field label="Tempo de bolsa rota (BR)">
            <TextInput value={f.tempoBR} onChange={(e) => set("tempoBR", e.target.value)} placeholder="ex.: no ato / 36h" />
          </Field>
          <Field label="Profilaxia">
            <SegGroup<ProfilaxiaModo>
              options={[
                { value: "nao_se_aplica", label: "Não se aplica" },
                { value: "nao_realizado", label: "Não realizado" },
              ]}
              value={f.profilaxiaModo}
              onChange={(v) => set("profilaxiaModo", v)}
            />
          </Field>
          {!f.profilaxiaModo && (
            <Grid cols={3}>
              <Field label="Medicamento">
                <TextInput value={f.profMedicamento} onChange={(e) => set("profMedicamento", e.target.value)} placeholder="Penicilina..." />
              </Field>
              <Field label="Data">
                <TextInput type="date" value={f.profData} onChange={(e) => set("profData", e.target.value)} />
              </Field>
              <Field label="Hora">
                <TextInput type="time" value={f.profHora} onChange={(e) => set("profHora", e.target.value)} />
              </Field>
            </Grid>
          )}
        </Section>

        <Section title="Tipagem">
          <Grid cols={3}>
            <Field label="Mãe ABO"><Select value={f.maeABO} onChange={(v) => set("maeABO", v)} options={aboOpts} /></Field>
            <Field label="Mãe Rh"><Select value={f.maeRh} onChange={(v) => set("maeRh", v)} options={rhOpts} /></Field>
            <Field label="Coombs indireto"><Select value={f.ci} onChange={(v) => set("ci", v)} options={rhOpts} placeholder="aguardo" /></Field>
            <Field label="RN ABO"><Select value={f.rnABO} onChange={(v) => set("rnABO", v)} options={aboOpts} /></Field>
            <Field label="RN Rh"><Select value={f.rnRh} onChange={(v) => set("rnRh", v)} options={rhOpts} /></Field>
            <Field label="Coombs direto"><Select value={f.cd} onChange={(v) => set("cd", v)} options={rhOpts} placeholder="aguardo" /></Field>
          </Grid>
        </Section>

        <Section title="Sorologias maternas">
          <TextArea value={f.sorologias} onChange={(e) => set("sorologias", e.target.value)} placeholder="Cole as sorologias aqui" />
        </Section>
        <Section title="Diagnósticos">
          <TextArea value={f.diagnosticos} onChange={(e) => set("diagnosticos", e.target.value)} placeholder="Cole/escreva os diagnósticos" />
        </Section>

        <Section title="Evolução">
          <Field label="Acompanhantes">
            <MultiGroup<Acompanhante>
              options={[
                { value: "mae", label: "Mãe" },
                { value: "pai", label: "Pai" },
                { value: "avo", label: "Avó" },
                { value: "tia", label: "Tia" },
                { value: "irma", label: "Irmã" },
                { value: "outro", label: "Outro" },
              ]}
              value={f.acompanhantes}
              onChange={(v) => set("acompanhantes", v)}
            />
          </Field>
          {f.acompanhantes.includes("outro") && (
            <Field label="Outro — qual parentesco?">
              <TextInput value={f.acompanhanteOutro} onChange={(e) => set("acompanhanteOutro", e.target.value)} placeholder="ex.: madrinha" />
            </Field>
          )}
          <Grid>
            <Field label="Vínculo">
              <SegGroup<Vinculo>
                options={[
                  { value: "bom", label: "Bom" },
                  { value: "moderado", label: "Moderado" },
                  { value: "prejudicado", label: "Prejudicado" },
                ]}
                value={f.vinculo}
                onChange={(v) => set("vinculo", v ?? "bom")}
                allowClear={false}
              />
            </Field>
            <Field label="Pega">
              <SegGroup<Pega>
                options={[
                  { value: "boa", label: "Boa pega" },
                  { value: "dificultosa", label: "Dificultosa" },
                  { value: "nao_realizada", label: "Não realizada" },
                ]}
                value={f.pega}
                onChange={(v) => set("pega", v)}
              />
            </Field>
            {f.pega !== "nao_realizada" && (
              <Field label="Sucção">
                <SegGroup<Succao>
                  options={[
                    { value: "adequada", label: "Adequada" },
                    { value: "ineficiente", label: "Ineficiente" },
                    { value: "dolorosa", label: "Dolorosa" },
                  ]}
                  value={f.succao}
                  onChange={(v) => set("succao", v)}
                />
              </Field>
            )}
            <Field label="Produção">
              <SegGroup<Producao>
                options={[
                  { value: "aumentada", label: "Aumentada" },
                  { value: "adequada", label: "Adequada" },
                  { value: "reduzida", label: "Reduzida" },
                ]}
                value={f.producao}
                onChange={(v) => set("producao", v)}
              />
            </Field>
          </Grid>
          {f.vinculo === "moderado" && (
            <Field label="Justificativa do vínculo moderado (opcional)">
              <TextInput value={f.vinculoJustificativa} onChange={(e) => set("vinculoJustificativa", e.target.value)} />
            </Field>
          )}
          <Field label="Queixas">
            <MultiGroup<Queixa>
              options={[
                { value: "desconforto_respiratorio", label: "Desconforto respiratório" },
                { value: "colicas", label: "Cólicas" },
                { value: "vomitos", label: "Vômitos" },
              ]}
              value={f.queixas}
              onChange={(v) => set("queixas", v)}
            />
          </Field>
          <Field label="Outras queixas">
            <TextInput value={f.outrasQueixas} onChange={(e) => set("outrasQueixas", e.target.value)} />
          </Field>
          <Grid cols={3}>
            <Field label="Diurese">
              <SegGroup options={[{ value: "presente", label: "Presente" }, { value: "ausente", label: "Ausente" }]} value={f.diurese} onChange={(v) => set("diurese", v as EvolucaoForm["diurese"])} allowClear={false} />
            </Field>
            <Field label="Mecônio">
              <SegGroup options={[{ value: "presente", label: "Presente" }, { value: "ausente", label: "Ausente" }]} value={f.meconio} onChange={(v) => set("meconio", v as EvolucaoForm["meconio"])} allowClear={false} />
            </Field>
            <Field label="Alimentação">
              <SegGroup<TipoAlimentacao>
                options={[
                  { value: "AME", label: "AME" },
                  { value: "FMI", label: "FMI" },
                  { value: "AMM", label: "AMM" },
                  { value: "AMP", label: "AMP" },
                  { value: "AMC", label: "AMC" },
                ]}
                value={f.alimentacaoTipo}
                onChange={(v) => set("alimentacaoTipo", v)}
              />
            </Field>
          </Grid>
          {(f.alimentacaoTipo === "FMI" || f.alimentacaoTipo === "AMM") && (
            <Grid>
              <Field label="Quantidade (ml)"><TextInput inputMode="numeric" value={f.alimentacaoMl} onChange={(e) => set("alimentacaoMl", e.target.value)} /></Field>
              <Field label="Intervalo"><TextInput value={f.alimentacaoIntervalo} onChange={(e) => set("alimentacaoIntervalo", e.target.value)} placeholder="3/3h" /></Field>
            </Grid>
          )}
        </Section>

        <Section
          title="Hipoglicemia"
          right={
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => set("hipoglicemias", [...f.hipoglicemias, { hora: "", dtx: "", correcao: "fmi", fmiMl: "" }])}
            >
              + episódio
            </button>
          }
        >
          {f.hipoglicemias.length === 0 && <p className="text-xs text-muted">Sem episódios.</p>}
          {f.hipoglicemias.map((h, i) => {
            const upd = (patch: Partial<typeof h>) => {
              const a = [...f.hipoglicemias];
              a[i] = { ...a[i], ...patch };
              set("hipoglicemias", a);
            };
            return (
              <div key={i} className="rounded-lg border border-border p-2">
                <Grid cols={2}>
                  <Field label="Horário"><TextInput type="time" value={h.hora} onChange={(e) => upd({ hora: e.target.value })} /></Field>
                  <Field label="DTX"><TextInput inputMode="numeric" value={h.dtx} onChange={(e) => upd({ dtx: e.target.value })} /></Field>
                </Grid>
                <div className="mt-2">
                  <SegGroup
                    options={[
                      { value: "fmi", label: "Complementou FMI" },
                      { value: "amamentacao", label: "Amamentação" },
                    ]}
                    value={h.correcao}
                    onChange={(v) => upd({ correcao: (v ?? "fmi") as "fmi" | "amamentacao" })}
                    allowClear={false}
                  />
                </div>
                {h.correcao === "fmi" && (
                  <Field label="Quantidade de FMI (ml)">
                    <TextInput inputMode="numeric" value={h.fmiMl} onChange={(e) => upd({ fmiMl: e.target.value })} />
                  </Field>
                )}
                <button
                  type="button"
                  className="mt-1 text-xs text-red-500"
                  onClick={() => set("hipoglicemias", f.hipoglicemias.filter((_, j) => j !== i))}
                >
                  remover episódio
                </button>
              </div>
            );
          })}
        </Section>

        <Section title="Intercorrências">
          <TextArea value={f.intercorrencias} onChange={(e) => set("intercorrencias", e.target.value)} placeholder="Se vazio: Nega" />
        </Section>

        <Section title="Glucotestes">
          <Field label="Realizado nas primeiras 24h?">
            <SegGroup
              options={[
                { value: "sim", label: "Sim" },
                { value: "nao_indicado", label: "Não indicado" },
              ]}
              value={f.gluco24hModo}
              onChange={(v) => set("gluco24hModo", v)}
            />
          </Field>
          {f.gluco24hModo === "sim" && (
            <Grid cols={4}>
              {GLUCO_24H.map((g) => (
                <Field key={g.key} label={`${g.rotulo} hora`}>
                  <TextInput
                    inputMode="numeric"
                    value={f.gluco24h[g.key] ?? ""}
                    onChange={(e) => set("gluco24h", { ...f.gluco24h, [g.key]: e.target.value })}
                  />
                </Field>
              ))}
            </Grid>
          )}

          {(horasVida == null || horasVida > 24) && (
            <div className="mt-1 rounded-lg border border-border p-2">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Últimas 24h</span>
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => set("glucotestes", [...f.glucotestes, { hora: "", valor: "" }])}
                >
                  + horário
                </button>
              </div>
              {f.glucotestes.length === 0 && <p className="text-xs text-muted">Sem registros.</p>}
              {f.glucotestes.map((g, i) => (
                <Grid key={i}>
                  <Field label="Horário">
                    <TextInput
                      value={g.hora}
                      onChange={(e) => { const a = [...f.glucotestes]; a[i] = { ...a[i], hora: e.target.value }; set("glucotestes", a); }}
                      placeholder="08h"
                    />
                  </Field>
                  <div className="flex items-end gap-2">
                    <Field label="DTX">
                      <TextInput
                        inputMode="numeric"
                        value={g.valor}
                        onChange={(e) => { const a = [...f.glucotestes]; a[i] = { ...a[i], valor: e.target.value }; set("glucotestes", a); }}
                      />
                    </Field>
                    <button type="button" className="pb-2 text-xs text-red-500" onClick={() => set("glucotestes", f.glucotestes.filter((_, j) => j !== i))}>×</button>
                  </div>
                </Grid>
              ))}
            </div>
          )}
        </Section>

        <Section title="Testes de triagem">
          <TriRow label="Olhinho" status={f.olhinho} data={f.olhinhoData} onStatus={triagem("olhinho", "olhinhoData")} onData={(d) => set("olhinhoData", d)} />
          <Field label="Coraçãozinho">
            <SegGroup options={triagemOpts} value={f.coracaozinho} onChange={triagem("coracaozinho", "coracaozinhoData")} allowClear={false} />
          </Field>
          {f.coracaozinho !== "aguardo" && (
            <Grid cols={3}>
              <Field label="Sat MSD"><TextInput inputMode="numeric" value={f.satMSD} onChange={(e) => set("satMSD", e.target.value)} /></Field>
              <Field label="Sat MID"><TextInput inputMode="numeric" value={f.satMI} onChange={(e) => set("satMI", e.target.value)} /></Field>
              <Field label="Data"><TextInput type="date" value={f.coracaozinhoData} onChange={(e) => set("coracaozinhoData", e.target.value)} /></Field>
            </Grid>
          )}
          <Field label="Linguinha (TABBY)">
            {!f.linguinhaRealizado ? (
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, linguinhaRealizado: true, linguinhaData: p.linguinhaData || hojeStr() }))}
                className="rounded-md border border-primary px-3 py-1.5 text-sm text-primary"
              >
                Realizar teste
              </button>
            ) : (
              <div className="space-y-2">
                <TabbySelector value={f.linguinhaTabby} onChange={(v) => set("linguinhaTabby", v)} />
                <div className="flex items-end gap-3">
                  <Field label="Data"><TextInput type="date" value={f.linguinhaData} onChange={(e) => set("linguinhaData", e.target.value)} className="max-w-[170px]" /></Field>
                  <button type="button" className="pb-2 text-xs text-red-500 underline" onClick={() => set("linguinhaRealizado", false)}>cancelar</button>
                </div>
              </div>
            )}
          </Field>
          <TriRow label="Orelhinha" status={f.orelhinha} data={f.orelhinhaData} onStatus={triagem("orelhinha", "orelhinhaData")} onData={(d) => set("orelhinhaData", d)} />
          <TriRow label="Pezinho" status={f.pezinho} data={f.pezinhoData} onStatus={triagem("pezinho", "pezinhoData")} onData={(d) => set("pezinhoData", d)} />
        </Section>

        <Section title="Vacinação">
          <Grid>
            <Field label="Hepatite B"><SegGroup options={vacinaOpts} value={f.hepB} onChange={(v) => set("hepB", (v ?? "aguardo") as StatusVacina)} allowClear={false} /></Field>
            {f.hepB === "realizada" && <Field label="Data Hep B"><TextInput type="date" value={f.hepBData} onChange={(e) => set("hepBData", e.target.value)} /></Field>}
            <Field label="BCG"><SegGroup options={vacinaOpts} value={f.bcg} onChange={(v) => set("bcg", (v ?? "aguardo") as StatusVacina)} allowClear={false} /></Field>
            {f.bcg === "realizada" && <Field label="Data BCG"><TextInput type="date" value={f.bcgData} onChange={(e) => set("bcgData", e.target.value)} /></Field>}
          </Grid>
        </Section>

        <Section title="Fototerapia">
          <SegGroup
            options={[{ value: "nao_realizada", label: "Não realizada" }, { value: "realizada", label: "Realizada" }]}
            value={f.fototerapia}
            onChange={(v) => set("fototerapia", (v ?? "nao_realizada") as EvolucaoForm["fototerapia"])}
            allowClear={false}
          />
          {f.fototerapia === "realizada" && (
            <Grid>
              <Field label="Início"><TextInput value={f.fotoInicio} onChange={(e) => set("fotoInicio", e.target.value)} /></Field>
              <Field label="Fim (se retirada)"><TextInput value={f.fotoFim} onChange={(e) => set("fotoFim", e.target.value)} /></Field>
            </Grid>
          )}
        </Section>

        <Section title="Exame físico">
          <Grid cols={3}>
            <Field label="Peso (g)"><TextInput inputMode="numeric" value={f.pesoAtualG} onChange={(e) => set("pesoAtualG", e.target.value)} /></Field>
            <Field label="FC (bpm)"><TextInput inputMode="numeric" value={f.fc} onChange={(e) => set("fc", e.target.value)} /></Field>
            <Field label="FR (irpm)"><TextInput inputMode="numeric" value={f.fr} onChange={(e) => set("fr", e.target.value)} /></Field>
          </Grid>
          <SistemaRow label="Geral" normal={EXAME_GERAL_NORMAL} alt={f.geralAlt} texto={f.geralTexto} onAlt={(v) => set("geralAlt", v)} onTexto={(v) => set("geralTexto", v)} />
          <Grid>
            <Field label="Fontanela anterior"><TextInput value={f.fant} onChange={(e) => set("fant", e.target.value)} placeholder="2x2" /></Field>
            <Field label="Fontanela posterior"><TextInput value={f.fpost} onChange={(e) => set("fpost", e.target.value)} placeholder="puntiforme" /></Field>
          </Grid>
          <SistemaRow label="ACV" normal={EXAME_ACV_NORMAL} alt={f.acvAlt} texto={f.acvTexto} onAlt={(v) => set("acvAlt", v)} onTexto={(v) => set("acvTexto", v)} />
          <SistemaRow label="AR" normal={EXAME_AR_NORMAL} alt={f.arAlt} texto={f.arTexto} onAlt={(v) => set("arAlt", v)} onTexto={(v) => set("arTexto", v)} />
          <SistemaRow label="Abdome" normal={EXAME_ABDOME_NORMAL} alt={f.abdomeAlt} texto={f.abdomeTexto} onAlt={(v) => set("abdomeAlt", v)} onTexto={(v) => set("abdomeTexto", v)} />
          <SistemaRow label="Coto umbilical" normal={EXAME_COTO_NORMAL} alt={f.cotoAlt} texto={f.cotoTexto} onAlt={(v) => set("cotoAlt", v)} onTexto={(v) => set("cotoTexto", v)} />
          <SistemaRow label="Genitália" normal={genitaliaNormal(f.sexo ?? null)} alt={f.genitaliaAlt} texto={f.genitaliaTexto} onAlt={(v) => set("genitaliaAlt", v)} onTexto={(v) => set("genitaliaTexto", v)} />
          <SistemaRow label="Membros" normal={EXAME_MEMBROS_NORMAL} alt={f.membrosAlt} texto={f.membrosTexto} onAlt={(v) => set("membrosAlt", v)} onTexto={(v) => set("membrosTexto", v)} />
          <Field label="Reflexos (neurológico)">
            <div className="flex flex-wrap gap-2">
              {REFLEXOS_NEURO.map((r) => (
                <Checkbox key={r} label={r} checked={f.reflexos[r] ?? false} onChange={(v) => set("reflexos", { ...f.reflexos, [r]: v })} />
              ))}
            </div>
          </Field>
          <div>
            <Checkbox label="Icterícia" checked={f.ictericia} onChange={(v) => set("ictericia", v)} />
            {f.ictericia && (
              <div className="mt-2 rounded-lg border border-border p-2">
                <p className="mb-1 text-xs font-medium text-muted">Zonas de Kramer — clique até onde vai a icterícia</p>
                <KramerSelector value={Number(f.kramer) || 0} onChange={(v) => set("kramer", v ? String(v) : "")} />
              </div>
            )}
          </div>
          <div className="rounded-lg border border-border p-2">
            <Checkbox label="BiliChek realizado" checked={f.bilicheckOn} onChange={(v) => set("bilicheckOn", v)} />
            {f.bilicheckOn && (
              <Grid cols={3}>
                <Field label="Valor (mg/dL)"><TextInput inputMode="decimal" value={f.bilicheckValor} onChange={(e) => set("bilicheckValor", e.target.value)} /></Field>
                <Field label="Data"><TextInput type="date" value={f.bilicheckData} onChange={(e) => set("bilicheckData", e.target.value)} /></Field>
                <Field label="Hora"><TextInput type="time" value={f.bilicheckHora} onChange={(e) => set("bilicheckHora", e.target.value)} /></Field>
              </Grid>
            )}
          </div>
        </Section>

        <Section
          title="Acompanhamento de peso"
          right={
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() => set("pesos", [...f.pesos, { data: "", gramas: "", nascimento: false }])}
            >
              + linha
            </button>
          }
        >
          <p className="text-xs text-muted">
            Peso atual (do exame físico): <strong className="text-foreground">{f.pesoAtualG || "—"}</strong> g
          </p>
          {f.pesos.map((p, i) => (
            <Grid key={i} cols={3}>
              <Field label="Data">
                <TextInput type="date" value={p.data} onChange={(e) => { const a = [...f.pesos]; a[i] = { ...a[i], data: e.target.value }; set("pesos", a); }} />
              </Field>
              <Field label="Peso (g)">
                <TextInput inputMode="numeric" value={p.gramas} onChange={(e) => { const a = [...f.pesos]; a[i] = { ...a[i], gramas: e.target.value }; set("pesos", a); }} />
              </Field>
              <div className="flex items-end gap-2">
                <Checkbox label="Nascimento" checked={p.nascimento} onChange={(v) => { const a = [...f.pesos]; a[i] = { ...a[i], nascimento: v }; set("pesos", a); }} />
                <button type="button" className="pb-2 text-xs text-red-500" onClick={() => set("pesos", f.pesos.filter((_, j) => j !== i))}>remover</button>
              </div>
            </Grid>
          ))}
          {f.pesos.length === 0 && (
            <p className="text-xs text-muted">Adicione o peso de nascimento e os pesos seriados para ver a variação e os gráficos.</p>
          )}
          <WeightChart linhas={trendPeso} />
        </Section>

        <Section title="Exames complementares">
          <TextArea value={f.examesComplementares} onChange={(e) => set("examesComplementares", e.target.value)} placeholder="Cole exames; copiar das evoluções passadas se disponível" />
        </Section>
        <Section title="Condutas">
          <TextArea className="min-h-[140px]" value={f.condutas} onChange={(e) => set("condutas", e.target.value)} />
        </Section>
      </div>

      {/* ─────────────── PREVIEW ─────────────── */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-sm font-semibold text-primary">Copiar para o prontuário</span>
            <button
              type="button"
              onClick={copiar}
              className="rounded-md bg-primary px-3 py-1.5 text-sm text-white"
            >
              {copiado ? "Copiado ✓" : "Copiar"}
            </button>
          </div>
          <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap px-4 py-3 text-xs leading-snug">
{texto}
          </pre>
        </div>
      </div>
    </div>
  );
}

function SistemaRow({
  label,
  normal,
  alt,
  texto,
  onAlt,
  onTexto,
}: {
  label: string;
  normal: string;
  alt: boolean;
  texto: string;
  onAlt: (v: boolean) => void;
  onTexto: (v: string) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <SegGroup
          options={[{ value: "n", label: "Normal" }, { value: "a", label: "Alterado" }]}
          value={alt ? "a" : "n"}
          onChange={(v) => {
            const altered = v === "a";
            onAlt(altered);
            // ao abrir para edição, parte do texto normal (se ainda vazio)
            if (altered && !texto.trim()) onTexto(normal);
          }}
          allowClear={false}
        />
      </div>
      {alt ? (
        <TextArea className="mt-2" value={texto} onChange={(e) => onTexto(e.target.value)} placeholder={`Descreva alteração em ${label}`} />
      ) : (
        <p className="mt-2 rounded-lg bg-accent px-3 py-2 text-xs text-muted">{normal}</p>
      )}
    </div>
  );
}

function TriRow({
  label,
  status,
  data,
  onStatus,
  onData,
}: {
  label: string;
  status: StatusTriagem;
  data: string;
  onStatus: (v?: StatusTriagem) => void;
  onData: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <SegGroup options={triagemOpts} value={status} onChange={onStatus} allowClear={false} />
      {status !== "aguardo" && (
        <div className="mt-1.5">
          <TextInput type="date" value={data} onChange={(e) => onData(e.target.value)} className="max-w-[180px]" />
        </div>
      )}
    </Field>
  );
}
