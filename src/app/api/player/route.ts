import { connection } from "next/server";
import { getPlayerProfile } from "@/lib/player";
import { findPlatform } from "@/lib/regions";
import { RiotError } from "@/lib/riot";

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  await connection();
  const params = new URL(request.url).searchParams;
  const platform = findPlatform(params.get("platform") ?? "");
  const name = params.get("name")?.trim();
  const tag = params.get("tag")?.trim();
  if (!platform || !name || !tag) return fail(400, "Informe o servidor e o Riot ID no formato Nome#TAG.");
  if (!process.env.RIOT_API_KEY) return fail(503, "A busca de jogador precisa de uma chave da Riot configurada.");

  try {
    const profile = await getPlayerProfile(platform, name, tag);
    return Response.json(profile, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    if (err instanceof RiotError) {
      if (err.status === 404) return fail(404, `Não encontramos ${name}#${tag} no servidor ${platform.label}. Confira o nome, a tag e o servidor.`);
      if (err.status === 429) return fail(429, "Muitas buscas ao mesmo tempo. Tente de novo em alguns segundos.");
      if (err.status === 401 || err.status === 403) return fail(503, "A chave da Riot é inválida ou expirou.");
    }
    console.error("[player]", err);
    const detail = process.env.NODE_ENV === "development" ? ` (${(err as Error).message})` : "";
    return fail(502, `Não foi possível falar com a Riot agora. Tente de novo em instantes.${detail}`);
  }
}
