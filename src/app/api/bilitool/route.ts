import { fetchBilitool, type BiliInput } from "@/lib/clinical/bilitool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input: BiliInput = {
      pares: Array.isArray(body.pares)
        ? body.pares
            .map((p: { idadeHoras: number; tsb: number }) => ({
              idadeHoras: Number(p.idadeHoras),
              tsb: Number(p.tsb),
            }))
            .filter((p: { idadeHoras: number; tsb: number }) => Number.isFinite(p.idadeHoras) && Number.isFinite(p.tsb))
        : [],
      semanas: Number(body.semanas),
      fatoresRisco: !!body.fatoresRisco,
      unidade: "US",
    };
    if (!input.pares.length) return Response.json({ error: "Inclua ao menos uma medição." }, { status: 400 });
    if (!(input.semanas >= 35 && input.semanas <= 42))
      return Response.json({ error: "O BiliTool (AAP 2022) cobre 35 a 40 semanas." }, { status: 400 });
    const result = await fetchBilitool(input);
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: (e as Error).message || "Falha ao consultar o BiliTool." }, { status: 502 });
  }
}
