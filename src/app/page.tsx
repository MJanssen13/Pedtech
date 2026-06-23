import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          Evolução — Alojamento Conjunto RN
        </h1>
        <p className="mt-1 text-sm text-muted">
          Evolução diária do recém-nascido, com cálculos automáticos e texto pronto
          para o prontuário.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/evolucao"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary"
        >
          <h2 className="font-semibold text-primary">＋ Nova evolução</h2>
          <p className="mt-1 text-sm text-muted">
            Preencher uma evolução do dia. Gera o texto no formato do modelo.
          </p>
        </Link>
        <Link
          href="/passagem"
          className="rounded-xl border border-border bg-card p-5 shadow-sm transition hover:border-primary"
        >
          <h2 className="font-semibold text-primary">▤ Passagem</h2>
          <p className="mt-1 text-sm text-muted">
            Painel de todos os RN da unidade, com exportação em PDF.
          </p>
        </Link>
      </div>

      <p className="px-1 text-xs text-muted">
        Ferramenta de apoio. Os cálculos (percentis, bilirrubina, Capurro) devem ser
        conferidos pelo profissional antes do uso assistencial.
      </p>
    </div>
  );
}
