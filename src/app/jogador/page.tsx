import { PlayerSearch } from "@/components/player/PlayerSearch";
import { RecentSearchList } from "@/components/player/RecentSearchList";
import { PageHeader } from "@/components/ui/PageHeader";

export default function PlayerSearchPage() {
  return (
    <>
      <PageHeader
        title="Buscar jogador"
        subtitle="Veja o elo, as últimas partidas e as comps que qualquer jogador mais usa."
        live={false}
      />
      <div className="max-w-2xl">
        <PlayerSearch autoFocus />
        <p className="mt-3 text-sm text-muted">
          Digite o Riot ID com a tag, como aparece no cliente: <span className="text-ink-2">Nome#TAG</span>.
        </p>
        <div className="mt-8">
          <RecentSearchList />
        </div>
      </div>
    </>
  );
}
