import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";

export const macroTools: Tool[] = [
  {
    name: "worldbox_create_champion",
    description: "Macro Tool econômica: Invoca um campeão lendário, aplica todos os traços divinos e exibe a mensagem/profecia na tela em UMA ÚNICA chamada (economizando até 4.000 tokens).",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X no mapa" },
        y: { type: "number", description: "Coordenada Y no mapa" },
        race: {
          type: "string",
          description: "Raça ou criatura (human, elf, orc, dwarf, dragon, angel, demon, etc.)",
          default: "human"
        },
        traits: {
          type: "array",
          items: { type: "string" },
          description: "Lista de traços divinos (ex: immortal, giant, blessed, genius, strong, energized)"
        },
        title: {
          type: "string",
          description: "Título ou epíteto do herói (ex: 'O Destruidor de Mundos')"
        },
        broadcast_message: {
          type: "string",
          description: "Mensagem divina opcional para ser exibida no topo da tela do jogador"
        }
      },
      required: ["x", "y"]
    }
  },
  {
    name: "worldbox_trigger_event",
    description: "Macro Tool econômica: Dispara um poder ou desastre divino (meteoro, raio, terremoto, cura) e exibe uma profecia divina na tela em uma única chamada.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X do alvo" },
        y: { type: "number", description: "Coordenada Y do alvo" },
        power_id: {
          type: "string",
          description: "Poder ou desastre (lightning, meteor, earthquake, blessing, curse, cure, lava, acid, tnt)"
        },
        broadcast_message: {
          type: "string",
          description: "Profecia ou aviso exibido na tela do jogador ao disparar o evento"
        }
      },
      required: ["x", "y", "power_id"]
    }
  }
];

export async function handleMacroTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_create_champion": {
      const traits = args.traits || ["immortal", "blessed", "strong"];
      const unit = await client.spawnUnit(args.x, args.y, args.race || "human", traits);

      let msg = args.broadcast_message;
      if (!msg) {
        const titleStr = args.title ? ` ${args.title}` : "";
        msg = `Nasceu um campeão: ${unit.name}${titleStr}!`;
      }

      await client.broadcastMessage(msg);

      return {
        content: [
          {
            type: "text",
            text: `⚔️ CAMPEÃO CRIADO: ${unit.name} (${unit.assetId}) em (${unit.x}, ${unit.y})\nVida: ${unit.health}/${unit.maxHealth} | Traços: ${unit.traits.join(", ")}\nMensagem exibida: "${msg}"`
          }
        ]
      };
    }

    case "worldbox_trigger_event": {
      await client.triggerPower(args.power_id, args.x, args.y);

      if (args.broadcast_message) {
        await client.broadcastMessage(args.broadcast_message);
      }

      return {
        content: [
          {
            type: "text",
            text: `⚡ EVENTO EXECUTADO: Poder '${args.power_id}' atingiu (${args.x}, ${args.y}). Mensagem: "${args.broadcast_message || "Sem aviso"}"`
          }
        ]
      };
    }

    default:
      throw new Error(`Unknown macro tool: ${name}`);
  }
}
