import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";

export const diplomacyTools: Tool[] = [
  {
    name: "worldbox_get_kingdoms",
    description: "Lista todos os reinos ativos na simulação. Suporta compact: true para economizar 75% dos tokens.",
    inputSchema: {
      type: "object",
      properties: {
        compact: {
          type: "boolean",
          description: "Se true, retorna apenas nome, rei, população e guerras (economiza 75% dos tokens)",
          default: false
        }
      }
    }
  },
  {
    name: "worldbox_get_cities",
    description: "Lista as cidades no mapa com sua população e exército. Suporta compact: true para economizar tokens.",
    inputSchema: {
      type: "object",
      properties: {
        kingdom: {
          type: "string",
          description: "Opcional: Filtrar cidades pertencentes a um reino específico pelo nome"
        },
        compact: {
          type: "boolean",
          description: "Se true, remove detalhes de estoque para economizar tokens",
          default: false
        }
      }
    }
  },
  {
    name: "worldbox_declare_war",
    description: "Força a declaração de guerra imediata entre dois reinos (usando o sussurro divino de discórdia).",
    inputSchema: {
      type: "object",
      properties: {
        attacker_kingdom: { type: "string", description: "Nome do reino agressor" },
        defender_kingdom: { type: "string", description: "Nome do reino defensor" }
      },
      required: ["attacker_kingdom", "defender_kingdom"]
    }
  },
  {
    name: "worldbox_make_peace",
    description: "Encerra uma guerra em andamento entre dois reinos, forçando um tratado de paz.",
    inputSchema: {
      type: "object",
      properties: {
        kingdom_1: { type: "string", description: "Nome do primeiro reino" },
        kingdom_2: { type: "string", description: "Nome do segundo reino" }
      },
      required: ["kingdom_1", "kingdom_2"]
    }
  }
];

export async function handleDiplomacyTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_get_kingdoms": {
      const kingdoms = await client.getKingdoms();
      if (args.compact) {
        const compactList = kingdoms.map((k) => ({
          name: k.name,
          king: k.kingName,
          pop: k.population,
          cities: k.citiesCount,
          wars: k.enemyKingdoms.length > 0 ? k.enemyKingdoms : undefined
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(compactList, null, 2) }]
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(kingdoms, null, 2) }]
      };
    }
    case "worldbox_get_cities": {
      const cities = await client.getCities(args.kingdom);
      if (args.compact) {
        const compactList = cities.map((c) => ({
          name: c.name,
          kingdom: c.kingdomName,
          pop: c.population,
          army: c.armySize
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(compactList, null, 2) }]
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(cities, null, 2) }]
      };
    }
    case "worldbox_declare_war": {
      const success = await client.declareWar(args.attacker_kingdom, args.defender_kingdom);
      return {
        content: [
          {
            type: "text",
            text: `Guerra forçada entre '${args.attacker_kingdom}' e '${args.defender_kingdom}'. Sucesso: ${success}`
          }
        ]
      };
    }
    case "worldbox_make_peace": {
      const success = await client.makePeace(args.kingdom_1, args.kingdom_2);
      return {
        content: [
          {
            type: "text",
            text: `Tratado de paz forçado entre '${args.kingdom_1}' e '${args.kingdom_2}'. Sucesso: ${success}`
          }
        ]
      };
    }
    default:
      throw new Error(`Unknown diplomacy tool: ${name}`);
  }
}
