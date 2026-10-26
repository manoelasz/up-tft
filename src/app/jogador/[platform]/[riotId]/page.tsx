import { Suspense } from "react";
import { Skeleton } from "@/components/ui";
import { PlayerProfileView } from "./view";

export default function PlayerProfilePage({ params }: PageProps<"/jogador/[platform]/[riotId]">) {
  // The route params are request data, so the client view renders inside a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-28" />}>
      <PlayerProfileView params={params} />
    </Suspense>
  );
}
