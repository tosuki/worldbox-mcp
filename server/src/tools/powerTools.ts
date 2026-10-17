import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { WorldboxClient } from "../worldboxClient.js";

export const powerTools: Tool[] = [
  {
    name: "worldbox_trigger_power",
    description: `Dispara um poder divino, desastre ou gota em uma coordenada do mapa (x, y).
Poderes populares suportados:
- 'lightning': Raio divino devastador
- 'meteor': Queda de meteoro gigante
- 'earthquake': Terremoto que racha e deforma o solo
- 'tnt' / 'grenade' / 'bomb': Explosivos
- 'blessing': Abençoa criaturas com o status Sagrado
- 'curse': Amaldiçoa criaturas (transformando em esqueletos ao morrer)
- 'cure' / 'blood_rain': Chuva de sangue ou cura milagrosa
- 'lava' / 'acid' / 'fire': Chuva de magma, ácido ou chamas
- 'seeds' / 'fertilizer': Espalha vegetação e árvores
- 'coin': Lança uma moeda divina que elimina 50% dos seres vivos`,
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "Coordenada X do alvo" },
        y: { type: "number", description: "Coordenada Y do alvo" },
        power_id: {
          type: "string",
          description: "ID do poder ou desastre a ser invocado (ex: lightning, meteor, earthquake, blessing, curse, cure, lava, acid, tnt, bomb)"
        }
      },
      required: ["x", "y", "power_id"]
    }
  }
];

export async function handlePowerTool(name: string, args: any, client: WorldboxClient) {
  switch (name) {
    case "worldbox_trigger_power": {
      const success = await client.triggerPower(args.power_id, args.x, args.y);
      return {
        content: [
          {
            type: "text",
            text: `Poder divino '${args.power_id}' invocado em (${args.x}, ${args.y}). Sucesso: ${success}`
          }
        ]
      };
    }
    default:
      throw new Error(`Unknown power tool: ${name}`);
  }
}
