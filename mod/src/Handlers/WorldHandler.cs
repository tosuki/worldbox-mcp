using System;
using UnityEngine;
using WorldboxMCP.Models;
using WorldboxMCP.Utils;

namespace WorldboxMCP.Handlers
{
    public static class WorldHandler
    {
        public static WorldInfoDto GetWorldInfo()
        {
            if (MapBox.instance == null)
            {
                throw new InvalidOperationException("Game map is not loaded yet.");
            }

            var eraManager = MapBox.instance.GetEraManager();
            var currentAge = eraManager?.getCurrentAge();
            var mapStats = MapBox.instance.GetMapStats();

            int year = mapStats != null ? mapStats.year : 0;
            int month = mapStats != null ? (int)(mapStats.world_time % 12) + 1 : 1;
            int pop = MapBox.instance.units != null ? MapBox.instance.units.Count : 0;
            int kingdoms = MapBox.instance.kingdoms != null ? MapBox.instance.kingdoms.list.Count : 0;
            int cities = MapBox.instance.cities != null ? MapBox.instance.cities.list.Count : 0;
            int wars = MapBox.instance.wars != null ? (int)MapBox.instance.wars.countActiveWars() : 0;

            string speed = "1x";
            if (Config.time_scale_asset != null)
            {
                speed = Config.time_scale_asset.id;
            }

            return new WorldInfoDto
            {
                Width = MapBox.width,
                Height = MapBox.height,
                EraName = currentAge != null ? currentAge.id : "unknown",
                WorldAge = year,
                WorldMonth = month,
                TotalPopulation = pop,
                TotalUnits = pop,
                TotalKingdoms = kingdoms,
                TotalCities = cities,
                TotalWars = wars,
                GameSpeed = speed
            };
        }

        public static TileInfoDto InspectTile(int x, int y)
        {
            if (MapBox.instance == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var tile = MapBox.instance.GetTile(x, y);
            if (tile == null)
                throw new ArgumentException($"Tile at ({x}, {y}) is out of bounds.");

            var biome = tile.getBiome();

            return new TileInfoDto
            {
                X = x,
                Y = y,
                MainType = tile.main_type != null ? tile.main_type.id : "",
                TopType = tile.top_type != null ? tile.top_type.id : null,
                Height = tile.Height,
                IsLiquid = tile.is_liquid,
                Biome = biome != null ? biome.id : null,
                KingdomName = tile.zone_city?.GetKingdom()?.name,
                CityName = tile.zone_city?.name,
                HasBuilding = tile.hasBuilding(),
                UnitsCount = tile.countUnits()
            };
        }

        public static bool ModifyTile(ModifyTileRequest req)
        {
            if (MapBox.instance == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var tile = MapBox.instance.GetTile(req.X, req.Y);
            if (tile == null)
                throw new ArgumentException($"Tile at ({req.X}, {req.Y}) is out of bounds.");

            tile.setTileType(req.TileType);
            MapBox.instance.setTileDirty(tile);
            MapBox.instance.redrawRenderedTile(tile);
            return true;
        }

        public static bool SetGameSpeed(string speed)
        {
            string assetId = speed.ToLower() switch
            {
                "pause" => "pause",
                "0.5x" => "x0.5",
                "1x" => "x1",
                "2x" => "x2",
                "3x" => "x3",
                "5x" => "x5",
                "sonic" => "sonic",
                _ => speed
            };

            var asset = AssetManager.time_scales?.get(assetId);
            if (asset != null)
            {
                Config.time_scale_asset = asset;
                return true;
            }
            return false;
        }

        public static bool BroadcastMessage(string message)
        {
            WorldTip.showNowTop(message, false);
            return true;
        }
    }
}
