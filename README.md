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

## Como funciona

- `src/lib/riot.ts` — cliente da Riot API com rate limiter (janela de 1s e de 2min) e retry em 429.
- `src/lib/meta.ts` — coleta incremental: busca a liga, os IDs das partidas recentes e só baixa partidas novas. Guarda até 1.500 partidas em memória e serve o último snapshot enquanto atualiza em segundo plano.
- `src/lib/aggregate.ts` — identifica cada comp pela sinergia com mais unidades + carry (campeão com mais itens), e ranqueia pela taxa de vitória, exigindo um mínimo de partidas (`MIN_COMP_GAMES`, padrão 5).
- `src/lib/staticData.ts` — nomes em português, fotos, alcance e sinergias de cada campeão/item, do CommunityDragon (`CDRAGON_LOCALE`, padrão `pt_br`).
- `src/lib/board.ts` — posicionamento sugerido no tabuleiro (a API da Riot não informa posições).
- `src/lib/demo.ts` — gera partidas sintéticas no mesmo formato da Riot.
- `src/lib/player.ts` + `/api/player` — perfil do jogador (conta, elo, últimas `PLAYER_MATCHES` partidas, padrão 15), com cache de 2 min. Partidas ficam em cache e são compartilhadas com a coleta do meta.
- `/api/meta` — devolve o snapshot; o front consulta a cada 60s (SWR).

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
