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

