import { connection } from "next/server";
import { getMetaSnapshot } from "@/lib/server/meta";

export async function GET() {
  // Live data: never prerender, or the build itself would start collecting matches.
  await connection();
  const snapshot = await getMetaSnapshot();
  return Response.json(snapshot, {
    headers: { "Cache-Control": "no-store" },
  });
}
