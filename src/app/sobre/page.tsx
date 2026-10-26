import { Card, SectionTitle } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";

const STEPS = [
  {
    title: "1. Coleta",
    body: "A cada poucos minutos buscamos os jogadores do topo da liga (Challenger por padrão) e as últimas partidas ranqueadas deles pela API oficial da Riot.",
  },
  {
    title: "2. Identificação da comp",
    body: "Cada tabuleiro vira uma comp a partir da sinergia com mais unidades ativas e do carry — o campeão com mais itens.",
  },
  {
    title: "3. Ranking",
    body: "Ordenamos pela taxa de vitória (1º lugar), não pela popularidade. Para evitar que uma vitória isolada domine o ranking, a comp precisa de pelo menos 5 partidas.",
  },
  {
    title: "4. Tabuleiro",
    body: "A Riot não informa em qual hexágono cada unidade foi colocada. O tabuleiro mostra um posicionamento sugerido: corpo a corpo na frente, quem ataca à distância atrás e o carry no canto.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader title="Como funciona" subtitle="De onde vêm os números e como as comps são ranqueadas." live={false} />
      <div className="grid gap-4 md:grid-cols-2">
        {STEPS.map((s) => (
          <Card key={s.title}>
            <SectionTitle className="text-accent">{s.title}</SectionTitle>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{s.body}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-4">
        <SectionTitle>Tiers</SectionTitle>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Pela taxa de vitória — S: 25% ou mais · A: 18% ou mais · B: 12,5% ou mais (a média, 1 em cada 8) · C: abaixo disso.
        </p>
      </Card>
      <p className="mt-6 text-xs leading-relaxed text-muted">
        Up TFT não é endossado pela Riot Games e não reflete as opiniões da Riot Games ou de qualquer pessoa oficialmente
        envolvida na produção ou gestão de propriedades da Riot Games. Riot Games e todas as propriedades associadas são
        marcas registradas da Riot Games, Inc. Imagens do jogo via CommunityDragon.
      </p>
    </>
  );
}
