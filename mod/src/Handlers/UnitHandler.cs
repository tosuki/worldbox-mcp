using System;
using System.Collections.Generic;
using System.Linq;
using WorldboxMCP.Models;

namespace WorldboxMCP.Handlers
{
    public static class UnitHandler
    {
        public static UnitDto SpawnUnit(SpawnUnitRequest req)
        {
            if (MapBox.instance == null || MapBox.instance.units == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var tile = MapBox.instance.GetTile(req.X, req.Y);
            if (tile == null)
                throw new ArgumentException($"Tile at ({req.X}, {req.Y}) is out of bounds.");

            string assetId = string.IsNullOrEmpty(req.Race) ? "human" : req.Race.ToLower();

            var actor = MapBox.instance.units.spawnNewUnit(
                assetId,
                tile,
                pSpawnSound: true,
                pMiracleSpawn: true,
                pSpawnHeight: 0f,
                pSubspecies: null,
                pGiveOwnerlessItems: true,
                pAdultAge: true
            );

            if (actor == null)
                throw new InvalidOperationException($"Failed to spawn unit of race/asset '{assetId}'.");

            if (req.Traits != null)
            {
                foreach (var trait in req.Traits)
                {
                    if (!string.IsNullOrEmpty(trait))
                        actor.addTrait(trait.ToLower(), true);
                }
            }

            return ToDto(actor);
        }

        public static List<UnitDto> GetUnits(int limit = 50, string? kingdomFilter = null)
        {
            if (MapBox.instance == null || MapBox.instance.units == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var result = new List<UnitDto>();
            var aliveUnits = MapBox.instance.units.units_only_alive;
            if (aliveUnits != null)
            {
                foreach (var actor in aliveUnits)
                {
                    if (actor == null || !actor.isAlive()) continue;

                    if (!string.IsNullOrEmpty(kingdomFilter) &&
                        !string.Equals(actor.kingdom?.name, kingdomFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    result.Add(ToDto(actor));
                    if (result.Count >= limit) break;
                }
            }

            return result;
        }

        public static UnitDto ModifyUnit(ModifyUnitRequest req)
        {
            if (MapBox.instance == null || MapBox.instance.units == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var actor = MapBox.instance.units.units_only_alive?.FirstOrDefault(a => a != null && a.id.ToString() == req.UnitId);
            if (actor == null)
                throw new ArgumentException($"Unit with ID '{req.UnitId}' was not found.");

            if (req.Kill == true)
            {
                actor.dieSimpleNone();
                return ToDto(actor);
            }

            if (req.SetHealth.HasValue)
            {
                actor.setHealth(req.SetHealth.Value, true);
            }

            if (req.AddTraits != null)
            {
                foreach (var t in req.AddTraits)
                {
                    if (!string.IsNullOrEmpty(t))
                        actor.addTrait(t.ToLower(), true);
                }
            }

            if (req.RemoveTraits != null)
            {
                foreach (var t in req.RemoveTraits)
                {
                    if (!string.IsNullOrEmpty(t))
                        actor.removeTrait(t.ToLower());
                }
            }

            return ToDto(actor);
        }

        private static UnitDto ToDto(Actor actor)
        {
            var traitsList = new List<string>();
            if (actor.traits != null)
            {
                traitsList.AddRange(actor.traits.Select(t => t.id));
            }

            string prof = "citizen";
            if (actor.is_profession_king) prof = "king";
            else if (actor.is_profession_leader) prof = "leader";
            else if (actor.is_profession_warrior) prof = "warrior";
            else if (actor.is_army_captain) prof = "captain";

            return new UnitDto
            {
                Id = actor.id.ToString(),
                Name = actor.name ?? "Unknown",
                AssetId = actor.asset != null ? actor.asset.id : "",
                Profession = prof,
                KingdomName = actor.kingdom?.name,
                CityName = actor.city?.name,
                Level = actor.level,
                Health = actor.getHealth(),
                MaxHealth = actor.getMaxHealth(),
                Age = actor.age,
                Kills = 0,
                X = actor.current_tile != null ? actor.current_tile.x : 0,
                Y = actor.current_tile != null ? actor.current_tile.y : 0,
                Traits = traitsList
            };
        }
    }
}
