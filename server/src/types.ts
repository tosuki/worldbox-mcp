export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface WorldInfo {
  width: number;
  height: number;
  eraName: string;
  worldAge: number;
  worldMonth: number;
  totalPopulation: number;
  totalUnits: number;
  totalKingdoms: number;
  totalCities: number;
  totalWars: number;
  gameSpeed: string;
}

export interface TileInfo {
  x: number;
  y: number;
  mainType: string;
  topType?: string | null;
  height: number;
  isLiquid: boolean;
  biome?: string | null;
  kingdomName?: string | null;
  cityName?: string | null;
  hasBuilding: boolean;
  unitsCount: number;
}

export interface KingdomInfo {
  id: number;
  name: string;
  kingName?: string | null;
  capitalCityName?: string | null;
  population: number;
  citiesCount: number;
  power: number;
  enemyKingdoms: string[];
  alliedKingdoms: string[];
}

export interface CityInfo {
  id: number;
  name: string;
  kingdomName: string;
  leaderName?: string | null;
  population: number;
  armySize: number;
  wood: number;
  gold: number;
  stone: number;
  metals: number;
}

export interface UnitInfo {
  id: string;
  name: string;
  assetId: string;
  profession?: string | null;
  kingdomName?: string | null;
  cityName?: string | null;
  level: number;
  health: number;
  maxHealth: number;
  age: number;
  kills: number;
  x: number;
  y: number;
  traits: string[];
}
