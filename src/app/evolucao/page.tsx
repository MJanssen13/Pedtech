"use client";

import { useMemo, useState } from "react";
import {
  Section,
  Field,
  TextInput,
  TextArea,
  SegGroup,
  MultiGroup,
  Checkbox,
  Grid,
} from "@/components/ui";
import {
  emptyForm,
  buildRenderInput,
  type EvolucaoForm,
} from "@/lib/prontuario/form";
import { renderProntuario } from "@/lib/prontuario/render";
import { REFLEXOS_NEURO } from "@/lib/clinical/exam-defaults";
import type {
  Sexo,
  ViaNascimento,
  Acompanhante,
  TipoAlimentacao,
  StatusTriagem,
  StatusVacina,
} from "@/lib/domain/types";

const triagemOpts: { value: StatusTriagem; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "alterado", label: "Alterado" },
  { value: "aguardo", label: "Aguardo" },
];
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
            <Field label="Peso (g)">
              <TextInput inputMode="numeric" value={f.pesoNascimentoG} onChange={(e) => set("pesoNascimentoG", e.target.value)} />
            </Field>
            <Field label="PC (cm)">
              <TextInput inputMode="decimal" value={f.pcCm} onChange={(e) => set("pcCm", e.target.value)} />
            </Field>
            <Field label="Comprimento (cm)">
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

        <Section
          title="Acompanhamento de peso"
          right={
            <button
              type="button"
              className="text-xs text-primary underline"
              onClick={() =>
                set("pesos", [...f.pesos, { data: "", gramas: "", nascimento: false }])
              }
            >
              + linha
            </button>
          }
        >
          <Field label="Peso atual (hoje)">
            <TextInput inputMode="numeric" value={f.pesoAtualG} onChange={(e) => set("pesoAtualG", e.target.value)} placeholder="gramas" />
          </Field>
          {f.pesos.map((p, i) => (
            <Grid key={i} cols={3}>
              <Field label="Data">
                <TextInput
                  type="date"
                  value={p.data}
                  onChange={(e) => {
                    const arr = [...f.pesos];
                    arr[i] = { ...arr[i], data: e.target.value };
                    set("pesos", arr);
                  }}
                />
              </Field>
              <Field label="Peso (g)">
                <TextInput
                  inputMode="numeric"
                  value={p.gramas}
                  onChange={(e) => {
                    const arr = [...f.pesos];
                    arr[i] = { ...arr[i], gramas: e.target.value };
                    set("pesos", arr);
                  }}
                />
              </Field>
              <div className="flex items-end gap-2">
                <Checkbox
                  label="Nascimento"
                  checked={p.nascimento}
                  onChange={(v) => {
                    const arr = [...f.pesos];
                    arr[i] = { ...arr[i], nascimento: v };
                    set("pesos", arr);
                  }}
                />
                <button
                  type="button"
                  className="pb-2 text-xs text-red-500"
                  onClick={() => set("pesos", f.pesos.filter((_, j) => j !== i))}
                >
                  remover
                </button>
              </div>
            </Grid>
          ))}
          {f.pesos.length === 0 && (
            <p className="text-xs text-muted">
              Adicione o peso de nascimento e os pesos seriados para calcular variação.
            </p>
          )}
        </Section>

        <Section title="Idade gestacional">
          <Field label="IG pela DUM">
            <TextInput value={f.igDum} onChange={(e) => set("igDum", e.target.value)} placeholder="ex.: incerta / 39 semanas" />
          </Field>
          <Field label="IG pelo USG">
            <TextInput value={f.igUsg} onChange={(e) => set("igUsg", e.target.value)} placeholder="ex.: 38 semanas e 4 dias (US ...)" />
          </Field>
        </Section>

        <Section title="Risco infeccioso">
          <Field label="Tempo de bolsa rota (BR)">
            <TextInput value={f.tempoBR} onChange={(e) => set("tempoBR", e.target.value)} placeholder="ex.: no ato / 36h" />
          </Field>
          <Grid cols={3}>
            <Field label="Profilaxia">
              <TextInput value={f.profMedicamento} onChange={(e) => set("profMedicamento", e.target.value)} placeholder="Penicilina..." />
            </Field>
            <Field label="Data">
              <TextInput type="date" value={f.profData} onChange={(e) => set("profData", e.target.value)} />
            </Field>
            <Field label="Hora">
              <TextInput type="time" value={f.profHora} onChange={(e) => set("profHora", e.target.value)} />
            </Field>
          </Grid>
        </Section>

        <Section title="Tipagem">
          <Grid cols={3}>
            <Field label="Mãe ABO"><TextInput value={f.maeABO} onChange={(e) => set("maeABO", e.target.value)} /></Field>
            <Field label="Mãe Rh"><TextInput value={f.maeRh} onChange={(e) => set("maeRh", e.target.value)} /></Field>
            <Field label="Coombs indireto"><TextInput value={f.ci} onChange={(e) => set("ci", e.target.value)} /></Field>
            <Field label="RN ABO"><TextInput value={f.rnABO} onChange={(e) => set("rnABO", e.target.value)} /></Field>
            <Field label="RN Rh"><TextInput value={f.rnRh} onChange={(e) => set("rnRh", e.target.value)} /></Field>
            <Field label="Coombs direto"><TextInput value={f.cd} onChange={(e) => set("cd", e.target.value)} /></Field>
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
                { value: "outro", label: "Outro" },
              ]}
              value={f.acompanhantes}
              onChange={(v) => set("acompanhantes", v)}
            />
          </Field>
          <Grid>
            <Field label="Vínculo">
              <SegGroup
                options={[
                  { value: "bom vínculo", label: "Bom vínculo" },
                  { value: "distanciamento", label: "Distanciamento" },
                ]}
                value={f.vinculo}
                onChange={(v) => set("vinculo", v ?? "")}
                allowClear={false}
              />
            </Field>
            <Field label="Pega">
              <SegGroup
                options={[{ value: "boa", label: "Boa" }, { value: "inadequada", label: "Inadequada" }]}
                value={f.pega}
                onChange={(v) => set("pega", v as EvolucaoForm["pega"])}
              />
            </Field>
            <Field label="Sucção">
              <SegGroup
                options={[{ value: "boa", label: "Boa" }, { value: "ineficiente", label: "Ineficiente" }]}
                value={f.succao}
                onChange={(v) => set("succao", v as EvolucaoForm["succao"])}
              />
            </Field>
            <Field label="Produção">
              <SegGroup
                options={[{ value: "adequada", label: "Adequada" }, { value: "baixa", label: "Baixa" }]}
                value={f.producao}
                onChange={(v) => set("producao", v as EvolucaoForm["producao"])}
              />
            </Field>
          </Grid>
          <div className="flex flex-wrap gap-2">
            <Checkbox label="Desconforto respiratório" checked={f.desconfortoResp} onChange={(v) => set("desconfortoResp", v)} />
            <Checkbox label="Necessidade de complementação" checked={f.complementacao} onChange={(v) => set("complementacao", v)} />
          </div>
          {f.complementacao && (
            <Grid cols={3}>
              <Field label="Hora"><TextInput type="time" value={f.compHora} onChange={(e) => set("compHora", e.target.value)} /></Field>
              <Field label="Destro"><TextInput inputMode="numeric" value={f.compDestro} onChange={(e) => set("compDestro", e.target.value)} /></Field>
              <Field label="Quantidade (ml)"><TextInput inputMode="numeric" value={f.compMl} onChange={(e) => set("compMl", e.target.value)} /></Field>
            </Grid>
          )}
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

        <Section title="Intercorrências">
          <TextArea value={f.intercorrencias} onChange={(e) => set("intercorrencias", e.target.value)} placeholder="Se vazio: Nega" />
        </Section>

        <Section
          title="Glucotestes"
          right={
            <button type="button" className="text-xs text-primary underline" onClick={() => set("glucotestes", [...f.glucotestes, { hora: "", valor: "" }])}>
              + hora
            </button>
          }
        >
          {f.glucotestes.map((g, i) => (
            <Grid key={i}>
              <Field label="Hora"><TextInput value={g.hora} onChange={(e) => { const a = [...f.glucotestes]; a[i] = { ...a[i], hora: e.target.value }; set("glucotestes", a); }} placeholder="08h" /></Field>
              <div className="flex items-end gap-2">
                <Field label="Valor"><TextInput inputMode="numeric" value={g.valor} onChange={(e) => { const a = [...f.glucotestes]; a[i] = { ...a[i], valor: e.target.value }; set("glucotestes", a); }} /></Field>
                <button type="button" className="pb-2 text-xs text-red-500" onClick={() => set("glucotestes", f.glucotestes.filter((_, j) => j !== i))}>×</button>
              </div>
            </Grid>
          ))}
          {f.glucotestes.length === 0 && <p className="text-xs text-muted">Sem glucotestes.</p>}
        </Section>

        <Section title="Testes de triagem">
          <Field label="Olhinho"><SegGroup options={triagemOpts} value={f.olhinho} onChange={(v) => set("olhinho", (v ?? "aguardo") as StatusTriagem)} allowClear={false} /></Field>
          <Field label="Coraçãozinho"><SegGroup options={triagemOpts} value={f.coracaozinho} onChange={(v) => set("coracaozinho", (v ?? "aguardo") as StatusTriagem)} allowClear={false} /></Field>
          {f.coracaozinho !== "aguardo" && (
            <Grid cols={3}>
              <Field label="Sat MSD"><TextInput inputMode="numeric" value={f.satMSD} onChange={(e) => set("satMSD", e.target.value)} /></Field>
              <Field label="Sat MID/MIE"><TextInput inputMode="numeric" value={f.satMI} onChange={(e) => set("satMI", e.target.value)} /></Field>
              <Field label="Data"><TextInput type="date" value={f.coracaozinhoData} onChange={(e) => set("coracaozinhoData", e.target.value)} /></Field>
            </Grid>
          )}
          <Field label="Linguinha (Bristol)"><TextInput inputMode="numeric" value={f.linguinhaBristol} onChange={(e) => set("linguinhaBristol", e.target.value)} /></Field>
          <Field label="Orelhinha"><SegGroup options={triagemOpts} value={f.orelhinha} onChange={(v) => set("orelhinha", (v ?? "aguardo") as StatusTriagem)} allowClear={false} /></Field>
          <Field label="Pezinho"><SegGroup options={triagemOpts} value={f.pezinho} onChange={(v) => set("pezinho", (v ?? "aguardo") as StatusTriagem)} allowClear={false} /></Field>
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
          <SistemaRow label="Geral" alt={f.geralAlt} texto={f.geralTexto} onAlt={(v) => set("geralAlt", v)} onTexto={(v) => set("geralTexto", v)} />
          <Grid>
            <Field label="Fontanela anterior"><TextInput value={f.fant} onChange={(e) => set("fant", e.target.value)} placeholder="2x2" /></Field>
            <Field label="Fontanela posterior"><TextInput value={f.fpost} onChange={(e) => set("fpost", e.target.value)} placeholder="puntiforme" /></Field>
          </Grid>
          <SistemaRow label="ACV" alt={f.acvAlt} texto={f.acvTexto} onAlt={(v) => set("acvAlt", v)} onTexto={(v) => set("acvTexto", v)} />
          <SistemaRow label="AR" alt={f.arAlt} texto={f.arTexto} onAlt={(v) => set("arAlt", v)} onTexto={(v) => set("arTexto", v)} />
          <SistemaRow label="Abdome" alt={f.abdomeAlt} texto={f.abdomeTexto} onAlt={(v) => set("abdomeAlt", v)} onTexto={(v) => set("abdomeTexto", v)} />
          <SistemaRow label="Coto umbilical" alt={f.cotoAlt} texto={f.cotoTexto} onAlt={(v) => set("cotoAlt", v)} onTexto={(v) => set("cotoTexto", v)} />
          <SistemaRow label="Genitália" alt={f.genitaliaAlt} texto={f.genitaliaTexto} onAlt={(v) => set("genitaliaAlt", v)} onTexto={(v) => set("genitaliaTexto", v)} />
          <SistemaRow label="Membros" alt={f.membrosAlt} texto={f.membrosTexto} onAlt={(v) => set("membrosAlt", v)} onTexto={(v) => set("membrosTexto", v)} />
          <Field label="Reflexos (neurológico)">
            <div className="flex flex-wrap gap-2">
              {REFLEXOS_NEURO.map((r) => (
                <Checkbox key={r} label={r} checked={f.reflexos[r] ?? false} onChange={(v) => set("reflexos", { ...f.reflexos, [r]: v })} />
              ))}
            </div>
          </Field>
          <div className="flex flex-wrap items-center gap-2">
            <Checkbox label="Icterícia" checked={f.ictericia} onChange={(v) => set("ictericia", v)} />
            {f.ictericia && (
              <Field label="Kramer"><TextInput inputMode="numeric" value={f.kramer} onChange={(e) => set("kramer", e.target.value)} className="w-20" /></Field>
            )}
          </div>
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
  alt,
  texto,
  onAlt,
  onTexto,
}: {
  label: string;
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
          onChange={(v) => onAlt(v === "a")}
          allowClear={false}
        />
      </div>
      {alt && (
        <TextArea className="mt-2" value={texto} onChange={(e) => onTexto(e.target.value)} placeholder={`Descreva alteração em ${label}`} />
      )}
    </div>
  );
}
