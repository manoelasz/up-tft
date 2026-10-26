# Up TFT

Painel do meta de Teamfight Tactics em tempo real: as 3 comps mais fortes do momento, calculadas a partir de partidas ranqueadas de jogadores do topo da liga, com campeões, itens e um tabuleiro sugerido.

## Rodando

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem chave da Riot o site roda em **modo demonstração**, com partidas sintéticas (montadas com os campeões reais do set atual) que mudam ao longo do tempo.

### Dados reais

1. Gere uma chave em https://developer.riotgames.com
2. Copie `.env.example` para `.env.local` e preencha `RIOT_API_KEY`
3. Ajuste servidor (`RIOT_PLATFORM`), região (`RIOT_REGION`) e liga (`RIOT_LEAGUE`) se quiser

Chaves de desenvolvimento expiram a cada 24h e permitem 100 requisições a cada 2 minutos; os valores padrão de coleta (20 jogadores × 5 partidas, até 60 partidas novas por ciclo) cabem nesse limite. Com uma chave de produção, aumente `RIOT_PLAYERS`, `RIOT_MAX_NEW_MATCHES` e os limites `RIOT_RATE_*`.

## Estrutura

```
src/
  app/                 rotas (páginas finas + API em app/api)
  components/
    ui/                peças genéricas: Card, Stat, PageHeader, DataTable, SegmentedControl…
    game/              peças do TFT: ChampionIcon, ItemIcon (com receita), TraitChip, Board, badges
    comps/             card de comp da página inicial
    champions/         tabela de campeões
    player/            busca e perfil de jogador
    layout/            menu lateral
  hooks/               useMeta, usePlayerProfile, useRecentSearches
  lib/
    types.ts           formato dos dados servidos pela API
    format.ts          números e datas em pt-BR
    regions.ts         servidores da Riot e parsing de Riot ID
    board.ts           posicionamento sugerido no tabuleiro
    server/            só roda no servidor (import "server-only")
      config.ts        todas as variáveis de ambiente
      riot/            cliente (rate limit, retry), endpoints e tipos da Riot API
      staticData.ts    nomes, ícones e receitas do CommunityDragon
      comps.ts         como uma comp é identificada (sinergia principal + carry)
      aggregate.ts     ranking das comps e estatísticas de campeões
      meta.ts          coleta incremental e snapshot do /api/meta
      player.ts        perfil do /api/player
      demo.ts          partidas sintéticas para o modo demonstração
tests/                 testes (Vitest) da lógica pura, com uma partida real anonimizada
```

- O ranking ordena por taxa de vitória, exigindo um mínimo de partidas (`MIN_COMP_GAMES`).
- A Riot não informa posições no tabuleiro; o tabuleiro mostra um posicionamento sugerido.
- Partidas e perfis ficam em memória no servidor; partidas são compartilhadas entre o meta e as buscas.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm test` | testes |
| `npm run lint` | lint |
| `npm run build` | build de produção |

## Abas

| Rota | Conteúdo |
|---|---|
| `/` | Top 3 comps: sinergias, campeões com itens e tabuleiro |
| `/jogador` | Busca por Riot ID: elo, últimas partidas, comps mais jogadas e histórico |
| `/campeoes` | Tabela de desempenho dos campeões |
| `/sobre` | Metodologia |

## Próximos passos para virar SaaS

- Persistir partidas num banco (Postgres/KV) e coletar via cron, em vez de memória do processo — necessário em hosts serverless como a Vercel.
- Contas, plano pago (alertas de meta, filtros por elo/região) e registro do produto no portal da Riot para obter chave de produção.

Up TFT não é endossado pela Riot Games.
