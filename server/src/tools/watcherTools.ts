import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";
import { KingdomInfo, WorldInfo, UnitInfo } from "../types.js";

// Cache for delta detection
interface WorldSnapshot {
  timestamp: number;
  worldAge: number;
  worldMonth: number;
  totalPopulation: number;
  totalWars: number;
  kingdoms: Map<string, { king: string; cities: number; pop: number; wars: string[] }>;
}

let lastSnapshot: WorldSnapshot | null = null;

export const watcherTools: Tool[] = [
  {
    name: "worldbox_wait_for_event",
    description: `Fica vigiando o jogo localmente (sem consumir nenhum token de I.A durante a espera) e só acorda a I.A quando uma condição específica acontecer.
Exemplos de eventos:
- target_type: 'kingdom', target_name: 'Rummo', event: 'war_started' (quando o reino entrar em guerra)
- target_type: 'kingdom', target_name: 'Rummo', event: 'king_died' (quando o rei atual morrer/mudar)
- target_type: 'kingdom', target_name: 'Rummo', event: 'city_lost' (se o reino perder cidades)
- target_type: 'unit', target_id: '101', event: 'died' (quando a unidade morrer)
- target_type: 'unit', target_id: '101', event: 'low_health', threshold: 30 (vida cair abaixo de 30%)
- target_type: 'world', event: 'any_war' (qualquer reino declarar guerra)`,
    inputSchema: {
      type: "object",
      properties: {
        target_type: {
          type: "string",
          enum: ["kingdom", "unit", "world"],
          description: "Tipo de entidade a ser vigiada"
        },
        target_name: {
          type: "string",
          description: "Nome do reino (obrigatório se target_type for 'kingdom')"
        },
        target_id: {
          type: "string",
          description: "ID da criatura (obrigatório se target_type for 'unit')"
        },
        event: {
          type: "string",
          enum: ["war_started", "king_died", "city_lost", "died", "low_health", "any_war"],
          description: "O evento a ser aguardado"
        },
        threshold: {
          type: "number",
          description: "Limite numérico (ex: porcentagem de vida para 'low_health', padrão 30)"
        },
        timeout_seconds: {
          type: "number",
          description: "Tempo máximo de espera em segundos (padrão 60, máx 180)",
          default: 60
        }
      },
      required: ["target_type", "event"]
    }
  },
  {
    name: "worldbox_get_recent_events",
    description: "Retorna APENAS o que mudou no mundo desde a última consulta (deltas). Economiza 95% dos tokens evitando ler todo o estado do mapa repetidamente.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  }
];

export async function handleWatcherTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_get_recent_events": {
      const currentWorld = await client.getWorldInfo();
      const currentKingdoms = await client.getKingdoms();

      const currentMap = new Map<string, { king: string; cities: number; pop: number; wars: string[] }>();
      for (const k of currentKingdoms) {
        currentMap.set(k.name, {
          king: k.kingName || "Nenhum",
          cities: k.citiesCount,
          pop: k.population,
          wars: k.enemyKingdoms || []
        });
      }

      if (!lastSnapshot) {
        lastSnapshot = {
          timestamp: Date.now(),
          worldAge: currentWorld.worldAge,
          worldMonth: currentWorld.worldMonth,
          totalPopulation: currentWorld.totalPopulation,
          totalWars: currentWorld.totalWars,
          kingdoms: currentMap
        };
        return {
          content: [
            {
              type: "text",
              text: `Ponto de referência inicial registrado no Ano ${currentWorld.worldAge}, Mês ${currentWorld.worldMonth}. População: ${currentWorld.totalPopulation}, Reinos: ${currentKingdoms.length}. Consulte novamente após o tempo passar para receber apenas os deltas de mudanças!`
            }
          ]
        };
      }

      const events: string[] = [];
      const yearsPassed = currentWorld.worldAge - lastSnapshot.worldAge;
      if (yearsPassed > 0) {
        events.push(`Tempo transcorrido: +${yearsPassed} anos (Ano atual: ${currentWorld.worldAge})`);
      }

      const popDiff = currentWorld.totalPopulation - lastSnapshot.totalPopulation;
      if (popDiff !== 0) {
        events.push(`Variação da população global: ${popDiff > 0 ? "+" : ""}${popDiff} habitantes (Total: ${currentWorld.totalPopulation})`);
      }

      // Check new kingdoms
      for (const [name, cur] of currentMap.entries()) {
        const prev = lastSnapshot.kingdoms.get(name);
        if (!prev) {
          events.push(`🏰 NOVO REINO FUNDADO: '${name}' pelo Rei ${cur.king} com ${cur.pop} habitantes.`);
        } else {
          // Check succession
          if (cur.king !== prev.king && cur.king !== "Nenhum") {
            events.push(`👑 SUCESSÃO REAL EM '${name}': O Rei ${prev.king} foi sucedido por ${cur.king}!`);
          }
          // Check cities gained/lost
          const cityDiff = cur.cities - prev.cities;
          if (cityDiff > 0) {
            events.push(`🏙️ '${name}' expandiu e fundou ${cityDiff} nova(s) cidade(s) (Total: ${cur.cities}).`);
          } else if (cityDiff < 0) {
            events.push(`🔥 '${name}' perdeu ${Math.abs(cityDiff)} cidade(s) (Restam: ${cur.cities}).`);
          }
          // Check wars started
          for (const enemy of cur.wars) {
            if (!prev.wars.includes(enemy)) {
              events.push(`⚔️ GUERRA INICIADA: '${name}' declarou guerra contra '${enemy}'!`);
            }
          }
          // Check wars ended
          for (const enemy of prev.wars) {
            if (!cur.wars.includes(enemy)) {
              events.push(`🕊️ PAZ ESTABELECIDA: A guerra entre '${name}' e '${enemy}' chegou ao fim.`);
            }
          }
        }
      }

      // Check destroyed kingdoms
      for (const [name, prev] of lastSnapshot.kingdoms.entries()) {
        if (!currentMap.has(name)) {
          events.push(`💀 REINO DESTRUÍDO: O reino '${name}' ruiu e foi extinto da história.`);
        }
      }

      // Update snapshot
      lastSnapshot = {
        timestamp: Date.now(),
        worldAge: currentWorld.worldAge,
        worldMonth: currentWorld.worldMonth,
        totalPopulation: currentWorld.totalPopulation,
        totalWars: currentWorld.totalWars,
        kingdoms: currentMap
      };

      if (events.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Nenhuma mudança relevante ocorreu desde a última checagem (Ano ${currentWorld.worldAge}, Mês ${currentWorld.worldMonth}). O mundo permanece estável.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `=== ACONTECIMENTOS RECENTES NO MUNDO ===\n` + events.map((e) => `• ${e}`).join("\n")
          }
        ]
      };
    }

    case "worldbox_wait_for_event": {
      const timeoutSec = Math.min(Math.max(args.timeout_seconds || 60, 5), 180);
      const pollIntervalMs = 1500;
      const startTime = Date.now();
      const targetType = args.target_type;
      const eventType = args.event;

      // Initial state captures
      let initialKing = "";
      let initialWars: string[] = [];
      let initialCities = 0;

      if (targetType === "kingdom" && args.target_name) {
        const kingdoms = await client.getKingdoms();
        const target = kingdoms.find((k) => k.name.toLowerCase() === args.target_name.toLowerCase());
        if (target) {
          initialKing = target.kingName || "";
          initialWars = target.enemyKingdoms || [];
          initialCities = target.citiesCount;
        }
      }

      // Polling loop
      while (Date.now() - startTime < timeoutSec * 1000) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

        if (targetType === "world" && eventType === "any_war") {
          const world = await client.getWorldInfo();
          if (world.totalWars > 0) {
            const kingdoms = await client.getKingdoms();
            const warring = kingdoms.filter((k) => k.enemyKingdoms && k.enemyKingdoms.length > 0);
            return {
              content: [
                {
                  type: "text",
                  text: `🔔 EVENTO DISPARADO: Guerra eclodiu no mundo! Reinos beligerantes: ${warring.map((k) => `${k.name} vs ${k.enemyKingdoms.join(", ")}`).join("; ")}.`
                }
              ]
            };
          }
        }

        if (targetType === "kingdom" && args.target_name) {
          const kingdoms = await client.getKingdoms();
          const target = kingdoms.find((k) => k.name.toLowerCase() === args.target_name.toLowerCase());

          if (!target) {
            return {
              content: [
                {
                  type: "text",
                  text: `🔔 EVENTO DISPARADO: O reino '${args.target_name}' foi completamente destruído ou desmantelado!`
                }
              ]
            };
          }

          if (eventType === "war_started") {
            const newWars = (target.enemyKingdoms || []).filter((w) => !initialWars.includes(w));
            if (newWars.length > 0) {
              return {
                content: [
                  {
                    type: "text",
                    text: `🔔 EVENTO DISPARADO: O reino '${target.name}' entrou em guerra contra: ${newWars.join(", ")}!`
                  }
                ]
              };
            }
          }

          if (eventType === "king_died") {
            if (target.kingName && initialKing && target.kingName !== initialKing) {
              return {
                content: [
                  {
                    type: "text",
                    text: `🔔 EVENTO DISPARADO: O Rei ${initialKing} de '${target.name}' faleceu! O novo monarca é ${target.kingName}.`
                  }
                ]
              };
            }
          }

          if (eventType === "city_lost") {
            if (target.citiesCount < initialCities) {
              return {
                content: [
                  {
                    type: "text",
                    text: `🔔 EVENTO DISPARADO: O reino '${target.name}' perdeu território! Cidades restantes: ${target.citiesCount} (tinha ${initialCities}).`
                  }
                ]
              };
            }
          }
        }

        if (targetType === "unit" && args.target_id) {
          const units = await client.getUnits(100);
          const unit = units.find((u) => u.id === String(args.target_id));

          if (!unit) {
            return {
              content: [
                {
                  type: "text",
                  text: `🔔 EVENTO DISPARADO: A unidade ID ${args.target_id} morreu ou desapareceu do mapa!`
                }
              ]
            };
          }

          if (eventType === "died" && unit.health <= 0) {
            return {
              content: [
                {
                  type: "text",
                  text: `🔔 EVENTO DISPARADO: ${unit.name} (ID ${unit.id}) morreu!`
                }
              ]
            };
          }

          if (eventType === "low_health") {
            const thresholdPercent = args.threshold || 30;
            const healthPercent = (unit.health / Math.max(unit.maxHealth, 1)) * 100;
            if (healthPercent <= thresholdPercent) {
              return {
                content: [
                  {
                    type: "text",
                    text: `🔔 ALERTA CRÍTICO: ${unit.name} (ID ${unit.id}) está em perigo iminente! Vida atual: ${unit.health}/${unit.maxHealth} (${Math.round(healthPercent)}%).`
                  }
                ]
              };
            }
          }
        }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      return {
        content: [
          {
            type: "text",
            text: `⏱️ Tempo limite de observação atingido (${elapsed}s). O evento '${eventType}' não ocorreu durante o período.`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown watcher tool: ${name}`);
  }
}
