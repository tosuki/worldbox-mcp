using System;
using System.Collections.Generic;

namespace WorldboxMCP.Models
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public static ApiResponse<T> Ok(T data, string? message = null)
        {
            return new ApiResponse<T> { Success = true, Data = data, Message = message };
        }

        public static ApiResponse<T> Fail(string message)
        {
            return new ApiResponse<T> { Success = false, Message = message };
        }
    }

    public class WorldInfoDto
    {
        public int Width { get; set; }
        public int Height { get; set; }
        public string EraName { get; set; } = "";
        public int WorldAge { get; set; }
        public int WorldMonth { get; set; }
        public int TotalPopulation { get; set; }
        public int TotalUnits { get; set; }
        public int TotalKingdoms { get; set; }
        public int TotalCities { get; set; }
        public int TotalWars { get; set; }
        public string GameSpeed { get; set; } = "1x";
    }

    public class TileInfoDto
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string MainType { get; set; } = "";
        public string? TopType { get; set; }
        public int Height { get; set; }
        public bool IsLiquid { get; set; }
        public string? Biome { get; set; }
        public string? KingdomName { get; set; }
        public string? CityName { get; set; }
        public bool HasBuilding { get; set; }
        public int UnitsCount { get; set; }
    }

    public class ModifyTileRequest
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string TileType { get; set; } = "soil";
    }

    public class KingdomDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string? KingName { get; set; }
        public string? CapitalCityName { get; set; }
        public int Population { get; set; }
        public int CitiesCount { get; set; }
        public int Power { get; set; }
        public List<string> EnemyKingdoms { get; set; } = new List<string>();
        public List<string> AlliedKingdoms { get; set; } = new List<string>();
    }

    public class CityDto
    {
        public long Id { get; set; }
        public string Name { get; set; } = "";
        public string KingdomName { get; set; } = "";
        public string? LeaderName { get; set; }
        public int Population { get; set; }
        public int ArmySize { get; set; }
        public int Wood { get; set; }
        public int Gold { get; set; }
        public int Stone { get; set; }
        public int Metals { get; set; }
    }

    public class UnitDto
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string AssetId { get; set; } = "";
        public string? Profession { get; set; }
        public string? KingdomName { get; set; }
        public string? CityName { get; set; }
        public int Level { get; set; }
        public int Health { get; set; }
        public int MaxHealth { get; set; }
        public int Age { get; set; }
        public int Kills { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public List<string> Traits { get; set; } = new List<string>();
    }

    public class SpawnUnitRequest
    {
        public int X { get; set; }
        public int Y { get; set; }
        public string Race { get; set; } = "human";
        public List<string>? Traits { get; set; }
    }

    public class ModifyUnitRequest
    {
        public string UnitId { get; set; } = "";
        public bool? Kill { get; set; }
        public int? SetHealth { get; set; }
        public List<string>? AddTraits { get; set; }
        public List<string>? RemoveTraits { get; set; }
    }

    public class TriggerPowerRequest
    {
        public string PowerId { get; set; } = "";
        public int X { get; set; }
        public int Y { get; set; }
    }

    public class WarRequest
    {
        public string AttackerKingdom { get; set; } = "";
        public string DefenderKingdom { get; set; } = "";
    }

    public class PeaceRequest
    {
        public string Kingdom1 { get; set; } = "";
        public string Kingdom2 { get; set; } = "";
    }

    public class GameSpeedRequest
    {
        public string Speed { get; set; } = "1x";
    }

    public class BroadcastMessageRequest
    {
        public string Message { get; set; } = "";
    }
}
