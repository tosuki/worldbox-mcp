import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";

export const unitTools: Tool[] = [
  {
    name: "worldbox_get_units",
    description: "Lista criaturas no mapa com detalhes. Suporta compact: true para economizar 70% de tokens.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Número máximo de unidades a retornar (padrão: 50)"
        },
        kingdom: {
          type: "string",
          description: "Opcional: filtrar apenas unidades de um determinado reino"
        },
        compact: {
          type: "boolean",
          description: "Se true, remove propriedades secundárias e retorna apenas id, nome, raça, vida e traços principais",
          default: false
        }
      }
    }
  },
  {
    name: "worldbox_spawn_creature",
    description: "Invoca uma criatura nas coordenadas (x, y) com raça e traços opcionais. Ex raças: human, elf, orc, dwarf, dragon, sheep, wolf, bear, fairy, skeleton, zombie.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X onde invocar a criatura" },
        y: { type: "number", description: "Coordenada Y onde invocar a criatura" },
        race: {
          type: "string",
          description: "Raça ou criatura a invocar (ex: human, elf, orc, dwarf, dragon, zombie, demon, angel, sheep, wolf)",
          default: "human"
        },
        traits: {
          type: "array",
          items: { type: "string" },
          description: "Opcional: Lista de traços divinos a conceder (ex: immortal, energized, strong, genius, blessed, fast, lucky)"
        }
      },
      required: ["x", "y"]
    }
  },
  {
    name: "worldbox_modify_unit",
    description: "Modifica uma criatura existente: altera vida, adiciona ou remove traços divinos, ou executa (mata) a unidade.",
    inputSchema: {
      type: "object",
      properties: {
        unit_id: { type: "string", description: "ID único da unidade a ser modificada" },
        set_health: { type: "number", description: "Opcional: Definir os pontos de vida da unidade" },
        add_traits: {
          type: "array",
          items: { type: "string" },
          description: "Lista de IDs de traços para adicionar (ex: immortal, giant, blessed, bloodlust)"
        },
        remove_traits: {
          type: "array",
          items: { type: "string" },
          description: "Lista de IDs de traços para remover"
        },
        kill: {
          type: "boolean",
          description: "Se true, encerra imediatamente a vida da criatura (morte instantânea)"
        }
      },
      required: ["unit_id"]
    }
  }
];

export async function handleUnitTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_get_units": {
      const units = await client.getUnits(args.limit ?? 50, args.kingdom);
      if (args.compact) {
        const compactList = units.map((u) => ({
          id: u.id,
          name: u.name,
          race: u.assetId,
          hp: `${u.health}/${u.maxHealth}`,
          kingdom: u.kingdomName || "nenhum",
          traits: u.traits.length > 0 ? u.traits : undefined
        }));
        return {
          content: [{ type: "text", text: JSON.stringify(compactList, null, 2) }]
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(units, null, 2) }]
      };
    }
    case "worldbox_spawn_creature": {
      const unit = await client.spawnUnit(args.x, args.y, args.race ?? "human", args.traits);
      return {
        content: [
          {
            type: "text",
            text: `Criatura invocada com sucesso em (${args.x}, ${args.y}):\n${JSON.stringify(unit, null, 2)}`
          }
        ]
      };
    }
    case "worldbox_modify_unit": {
      const unit = await client.modifyUnit({
        unitId: args.unit_id,
        kill: args.kill,
        setHealth: args.set_health,
        addTraits: args.add_traits,
        removeTraits: args.remove_traits
      });
      return {
        content: [
          {
            type: "text",
            text: `Unidade ${args.unit_id} modificada:\n${JSON.stringify(unit, null, 2)}`
          }
        ]
      };
    }
    default:
      throw new Error(`Unknown unit tool: ${name}`);
  }
}
