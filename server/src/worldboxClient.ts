import { ApiResponse, WorldInfo, TileInfo, KingdomInfo, CityInfo, UnitInfo } from "./types.js";

export class WorldboxClient {
  private baseUrl: string;

  constructor(port: number = 2828) {
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });

      if (!response.ok) {
        const text = await response.text();
        let errMsg = `HTTP ${response.status}: ${text}`;
        try {
          const parsed = JSON.parse(text) as any;
          if (parsed.message || parsed.Message) errMsg = parsed.message || parsed.Message;
        } catch {}
        throw new Error(errMsg);
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED" || err.message?.includes("fetch failed")) {
        throw new Error(
          "Não foi possível conectar ao WorldBox na porta 2828. Certifique-se de que o jogo está aberto com o Mod WorldboxMCP carregado."
        );
      }
      throw err;
    }
  }

  private unwrap<T>(res: any, defaultMsg: string): T {
    const success = res.success ?? res.Success;
    const message = res.message ?? res.Message;
    const data = res.data ?? res.Data;
    if (success !== true && success !== "true") {
      throw new Error(message || defaultMsg);
    }
    return (data ?? true) as T;
  }

  async getHealth(): Promise<{ status: string; mapLoaded: boolean; version: string }> {
    return this.request("/health");
  }

  async getWorldInfo(): Promise<WorldInfo> {
    const res = await this.request<any>("/world/info");
    return this.unwrap<WorldInfo>(res, "Failed to get world info");
  }

  async inspectTile(x: number, y: number): Promise<TileInfo> {
    const res = await this.request<any>(`/world/tile?x=${x}&y=${y}`);
    return this.unwrap<TileInfo>(res, "Failed to inspect tile");
  }

  async modifyTile(x: number, y: number, tileType: string): Promise<boolean> {
    const res = await this.request<any>("/world/tile", {
      method: "POST",
      body: JSON.stringify({ x, y, tileType })
    });
    return this.unwrap<boolean>(res, "Failed to modify tile");
  }

  async setGameSpeed(speed: string): Promise<boolean> {
    const res = await this.request<any>("/world/speed", {
      method: "POST",
      body: JSON.stringify({ speed })
    });
    return this.unwrap<boolean>(res, "Failed to set game speed");
  }

  async broadcastMessage(message: string): Promise<boolean> {
    const res = await this.request<any>("/world/broadcast", {
      method: "POST",
      body: JSON.stringify({ message })
    });
    return this.unwrap<boolean>(res, "Failed to broadcast message");
  }

  async getKingdoms(): Promise<KingdomInfo[]> {
    const res = await this.request<any>("/kingdoms");
    return this.unwrap<KingdomInfo[]>(res, "Failed to get kingdoms");
  }

  async getCities(kingdom?: string): Promise<CityInfo[]> {
    const query = kingdom ? `?kingdom=${encodeURIComponent(kingdom)}` : "";
    const res = await this.request<any>(`/cities${query}`);
    return this.unwrap<CityInfo[]>(res, "Failed to get cities");
  }

  async declareWar(attackerKingdom: string, defenderKingdom: string): Promise<boolean> {
    const res = await this.request<any>("/diplomacy/war", {
      method: "POST",
      body: JSON.stringify({ attackerKingdom, defenderKingdom })
    });
    return this.unwrap<boolean>(res, "Failed to declare war");
  }

  async makePeace(kingdom1: string, kingdom2: string): Promise<boolean> {
    const res = await this.request<any>("/diplomacy/peace", {
      method: "POST",
      body: JSON.stringify({ kingdom1, kingdom2 })
    });
    return this.unwrap<boolean>(res, "Failed to establish peace");
  }

  async getUnits(limit: number = 50, kingdom?: string): Promise<UnitInfo[]> {
    const params = new URLSearchParams();
    if (limit) params.set("limit", limit.toString());
    if (kingdom) params.set("kingdom", kingdom);
    const res = await this.request<any>(`/units?${params.toString()}`);
    return this.unwrap<UnitInfo[]>(res, "Failed to get units");
  }

  async spawnUnit(x: number, y: number, race: string = "human", traits?: string[]): Promise<UnitInfo> {
    const res = await this.request<any>("/units/spawn", {
      method: "POST",
      body: JSON.stringify({ x, y, race, traits })
    });
    return this.unwrap<UnitInfo>(res, "Failed to spawn unit");
  }

  async modifyUnit(params: {
    unitId: string;
    kill?: boolean;
    setHealth?: number;
    addTraits?: string[];
    removeTraits?: string[];
  }): Promise<UnitInfo> {
    const res = await this.request<any>("/units/modify", {
      method: "POST",
      body: JSON.stringify(params)
    });
    return this.unwrap<UnitInfo>(res, "Failed to modify unit");
  }

  async triggerPower(powerId: string, x: number, y: number): Promise<boolean> {
    const res = await this.request<any>("/powers/drop", {
      method: "POST",
      body: JSON.stringify({ powerId, x, y })
    });
    return this.unwrap<boolean>(res, "Failed to trigger power");
  }
}
