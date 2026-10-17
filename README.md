# 🌍 WorldboxMCP: AI Agent Bridge for WorldBox

O **WorldboxMCP** é uma ponte bidirecional que implementa o protocolo **Model Context Protocol (MCP)** para o jogo **WorldBox – God Simulator**. Ele permite que agentes de Inteligência Artificial (como Claude Desktop, Antigravity, Cursor, Cline, etc.) observem a simulação e ajam como entidades divinas no jogo em tempo real.

---

## 🏛️ Arquitetura

O projeto é dividido em dois componentes principais:

1. **In-game Mod (`mod/`)**:
   - Desenvolvido em **C#** (.NET Standard 2.1) para Unity.
   - Herda de `NeoModLoader.api.BasicMod<Main>`, compatível nativamente com **NeoModLoader (NML)**.
   - Executa um servidor HTTP embutido (`http://127.0.0.1:2828/`) sincronizado com o *Main Thread* da Unity através de um `MainThreadDispatcher`.
   - Consulta e altera o motor do jogo (`MapBox`, `World`, `ActorManager`, `KingdomManager`, `WarManager`, etc.).

2. **MCP Bridge Server (`server/`)**:
   - Desenvolvido em **TypeScript** com `@modelcontextprotocol/sdk`.
   - Roda via **stdio** (JSON-RPC), compatível com qualquer cliente MCP oficial.
   - Inclui ferramentas de vigilância local a custo zero de tokens e macro-ações para máxima economia.

---

## 🛠️ Catálogo de Ferramentas MCP

### 👁️ Vigilância & Economia Máxima de Tokens (Zero-Token Polling)
| Ferramenta | Descrição |
|---|---|
| `worldbox_wait_for_event` | **Vigilante em Tempo Real**: Fica monitorando o jogo localmente (sem gastar nenhum token) e só acorda a I.A quando um evento acontecer (ex: `war_started`, `king_died`, `city_lost`, herói com `low_health` ou `died`). |
| `worldbox_get_recent_events` | **Detector de Deltas**: Retorna apenas os acontecimentos ocorridos desde a última checagem (economiza 95% dos tokens). |

### ⚡ Macro Tools (Ações em Lote em 1 Único Turno)
| Ferramenta | Descrição |
|---|---|
| `worldbox_create_champion` | Invoca um herói lendário, atribui múltiplos traços divinos, define título e exibe profecia na tela em **uma única chamada**. |
| `worldbox_trigger_event` | Dispara poder divino/cataclismo e transmite a profecia divina correspondente em **uma única chamada**. |

### 🔍 Inspeção & Consulta (Com suporte a `compact: true`)
| Ferramenta | Descrição |
|---|---|
| `worldbox_get_status` | Checa se o WorldBox está aberto e com mapa ativo. |
| `worldbox_get_world_info` | Retorna ano, era, mês, população total, número de reinos, cidades e guerras ativas. |
| `worldbox_get_kingdoms` | Lista reinos, reis, capitais, população, alianças e guerras (`compact: true` disponível). |
| `worldbox_get_cities` | Lista cidades, populações e exércitos (`compact: true` disponível). |
| `worldbox_get_units` | Lista criaturas com seus atributos e traços (`compact: true` disponível). |
| `worldbox_inspect_tile` | Inspeciona coordenada (x, y) retornando bioma, território e construções. |

### ⚔️ Modificação, Diplomacia e Poderes
| Ferramenta | Descrição |
|---|---|
| `worldbox_spawn_creature` | Invoca criaturas (human, elf, orc, dwarf, dragon, etc.) com traços divinos. |
| `worldbox_modify_unit` | Adiciona/remove traços, cura ou executa (`kill`) uma criatura. |
| `worldbox_modify_tile` | Altera o solo em (x, y) (ex: `soil`, `deep_ocean`, `sand`, `plain`, `forest`, `mountains`, `lava`). |
| `worldbox_declare_war` | Força declaração de guerra imediata entre dois reinos por sussurro divino. |
| `worldbox_make_peace` | Força tratado de paz imediato entre reinos beligerantes. |
| `worldbox_trigger_power` | Dispara raios, meteoros, terremotos, bombas, bênçãos, maldições, chuva de cura, lava, etc. |
| `worldbox_set_speed` | Controla o tempo da simulação (`pause`, `0.5x`, `1x`, `2x`, `3x`, `5x`, `sonic`). |
| `worldbox_broadcast_message` | Exibe uma profecia/mensagem no topo da tela do jogador. |

---

## 🚀 Configuração no Cliente MCP

Adicione ao seu arquivo de configuração MCP (`~/.gemini/config/mcp_config.json` ou Claude Desktop):

```json
{
  "mcpServers": {
    "worldbox": {
      "command": "node",
      "args": [
        "/Users/carlos/Documents/Projects/WorldboxMCP/server/dist/index.js"
      ]
    }
  }
}
```

---

## 📊 Estimativa e Otimização do Consumo de Tokens

Ao conectar o WorldBox a um modelo de I.A via MCP, cada requisição consome tokens com base em quatro componentes principais:
1. **Definições de Ferramentas (Tool Schemas)**: ~1.500 a 2.000 tokens (injetados pelo cliente MCP em cada requisição).
2. **Histórico da Conversa**: Contexto acumulado ao longo da sessão de chat.
3. **Dados Retornados pelas Ferramentas**: Payloads de resposta do jogo (JSONs de reinos, cidades, unidades).
4. **Geração da Resposta da I.A**: A narrativa e comandos gerados pelo modelo (~100 a 400 tokens por turno).

---

### 📈 Tabela Comparativa de Consumo por Modo de Uso

| Modo de Jogo / Padrão de Uso | Como Funciona | Frequência Típica | Consumo Médio por Ação | Custo Estimado / Sessão |
|---|---|---|---|---|
| **Interativo / Sob Demanda** *(Recomendado)* | O jogador envia comandos manuais quando desejar (ex: *"Inspecione o mundo"*, *"Inicie uma guerra"*). | 1 comando a cada 5 a 10 min | **2.000 a 4.000 tokens** | Menos de **\$0.01 por hora** |
| **Vigilante Reativo (`worldbox_wait_for_event`)** | A I.A fica aguardando e só desperta quando um evento real ocorrer (guerra, morte de rei, perigo). | Apenas quando o evento dispara | **0 tokens na espera** + ~2.500 tokens no disparo | Centavos por sessão |
| **Consulta por Deltas (`worldbox_get_recent_events`)** | Retorna apenas os fatos ocorridos desde a última checagem em vez de despejar todo o mapa. | Periódica sob demanda | **~30 a 80 tokens** de dados (Economia de **95%**) | Desprezível |
| **Macro Ações (`worldbox_create_champion`)** | Spawna herói, aplica múltiplos traços e envia mensagem na tela em **1 único turno**. | Conforme necessidade | **1 turno** (~2.500 tokens) vs 4 turnos (~9.000 tokens) | Economia de **~70% a 75%** |
| **Consultas Detalhadas (`compact: false`)** | Listagem completa de 50+ unidades ou reinos com todos os atributos, IDs e coordenadas. | Ocasional | **1.500 a 3.000 tokens** de dados brutos | Moderado |
| **Polling Contínuo sem Vigilante** *(Anti-Pattern - Evitar)* | Fazer a I.A perguntar o status do jogo repetidamente a cada 10 a 30 segundos. | 120 a 360 chamadas/hora | **500.000 a 1.000.000+ tokens/hora** | Alto |

---

### 💡 Recomendações para Economia Máxima de Tokens

1. **Priorize o Vigilante Local (`worldbox_wait_for_event`)**:
   - Como o loop de verificação roda no Node.js localmente a cada 1,5s no `localhost:2828`, **não há cobrança de tokens durante a espera**. Use para transformar a I.A em guardiã de heróis ou reinos.
2. **Utilize `compact: true` nas Listagens**:
   - As ferramentas `worldbox_get_kingdoms`, `worldbox_get_cities` e `worldbox_get_units` suportam o parâmetro `compact: true`, reduzindo o volume de texto devolvido em até 75%.
3. **Use Macro Tools para Ações Complexas**:
   - Prefira `worldbox_create_champion` e `worldbox_trigger_event` para evitar múltiplas idas e vindas de mensagens entre a I.A e o jogo.
4. **Limpe o Histórico Longo com `/compact`**:
   - Em sessões prolongadas de jogo com dezenas de turnos, execute o comando `/compact` no chat para resumir mensagens antigas e liberar a janela de contexto.

