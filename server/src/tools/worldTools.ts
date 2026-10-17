import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";

export const worldTools: Tool[] = [
  {
    name: "worldbox_get_status",
    description: "Verifica se o WorldBox está em execução e se o mod WorldboxMCP está ativo e com um mapa carregado.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "worldbox_get_world_info",
    description: "Obtém estatísticas gerais do mundo: era atual, ano, mês, população total, número de reinos, cidades e guerras.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "worldbox_inspect_tile",
    description: "Inspeciona uma coordenada específica do mapa (x, y) retornando tipo de solo, bioma, dono do território, cidade e prédios.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X no mapa (0 a largura-1)" },
        y: { type: "number", description: "Coordenada Y no mapa (0 a altura-1)" }
      },
      required: ["x", "y"]
    }
  },
  {
    name: "worldbox_modify_tile",
    description: "Altera o terreno de uma coordenada do mapa. Ex: 'soil', 'deep_ocean', 'close_ocean', 'sand', 'plain', 'forest', 'mountains', 'lava'.",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X no mapa" },
        y: { type: "number", description: "Coordenada Y no mapa" },
        tile_type: {
          type: "string",
          description: "Tipo de terreno (ex: soil, deep_ocean, sand, plain, forest, mountains, lava, snow)"
        }
      },
      required: ["x", "y", "tile_type"]
    }
  },
  {
    name: "worldbox_set_speed",
    description: "Define a velocidade da simulação do jogo ('pause', '0.5x', '1x', '2x', '3x', '5x', 'sonic').",
    inputSchema: {
      type: "object",
      properties: {
        speed: {
          type: "string",
          description: "Velocidade desejada",
          enum: ["pause", "0.5x", "1x", "2x", "3x", "5x", "sonic"]
        }
      },
      required: ["speed"]
    }
  },
  {
    name: "worldbox_broadcast_message",
    description: "Exibe uma mensagem/profecia divina no topo da tela do jogo para o jogador ler.",
    inputSchema: {
      type: "object",
      properties: {
        message: { type: "string", description: "Texto da mensagem divina a ser exibida" }
      },
      required: ["message"]
    }
  }
];

export async function handleWorldTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_get_status": {
      const health = await client.getHealth();
      return {
        content: [{ type: "text", text: JSON.stringify(health, null, 2) }]
      };
    }
    case "worldbox_get_world_info": {
      const info = await client.getWorldInfo();
      return {
        content: [{ type: "text", text: JSON.stringify(info, null, 2) }]
      };
    }
    case "worldbox_inspect_tile": {
      const tile = await client.inspectTile(args.x, args.y);
      return {
        content: [{ type: "text", text: JSON.stringify(tile, null, 2) }]
      };
    }
    case "worldbox_modify_tile": {
      const success = await client.modifyTile(args.x, args.y, args.tile_type);
      return {
        content: [{ type: "text", text: `Tile em (${args.x}, ${args.y}) alterado para '${args.tile_type}'. Sucesso: ${success}` }]
      };
    }
    case "worldbox_set_speed": {
      const success = await client.setGameSpeed(args.speed);
      return {
        content: [{ type: "text", text: `Velocidade do jogo alterada para '${args.speed}'. Sucesso: ${success}` }]
      };
    }
    case "worldbox_broadcast_message": {
      const success = await client.broadcastMessage(args.message);
      return {
        content: [{ type: "text", text: `Mensagem divina transmitida: "${args.message}". Sucesso: ${success}` }]
      };
    }
    default:
      throw new Error(`Unknown world tool: ${name}`);
  }
}
