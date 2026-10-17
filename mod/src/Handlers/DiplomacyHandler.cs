using System;
using System.Collections.Generic;
using System.Linq;
using WorldboxMCP.Models;
using WorldboxMCP.Utils;

namespace WorldboxMCP.Handlers
{
    public static class DiplomacyHandler
    {
        public static List<KingdomDto> GetKingdoms()
        {
            if (MapBox.instance == null || MapBox.instance.kingdoms == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var result = new List<KingdomDto>();
            var civKingdoms = MapBox.instance.kingdoms.list;

            foreach (var kingdom in civKingdoms)
            {
                if (kingdom == null || !kingdom.isAlive() || kingdom.wild) continue;

                var enemies = new List<string>();
                var allies = new List<string>();

                if (MapBox.instance.wars != null)
                {
                    var wars = MapBox.instance.wars.getWars(kingdom, false);
                    if (wars != null)
                    {
                        foreach (var war in wars)
                        {
                            if (war.main_attacker == kingdom && war.main_defender != null)
                                enemies.Add(war.main_defender.name);
                            else if (war.main_defender == kingdom && war.main_attacker != null)
                                enemies.Add(war.main_attacker.name);
                        }
                    }
                }

                if (kingdom.hasAlliance() && kingdom.getAlliance() != null)
                {
                    var allianceKingdoms = kingdom.getAlliance().getKingdoms();
                    if (allianceKingdoms != null)
                    {
                        foreach (var k in allianceKingdoms)
                        {
                            if (k != kingdom)
                                allies.Add(k.name);
                        }
                    }
                }

                result.Add(new KingdomDto
                {
                    Id = kingdom.id,
                    Name = kingdom.name,
                    KingName = kingdom.king?.name,
                    CapitalCityName = kingdom.capital?.name,
                    Population = kingdom.units != null ? kingdom.units.Count : 0,
                    CitiesCount = kingdom.cities != null ? kingdom.cities.Count : 0,
                    Power = kingdom.power,
                    EnemyKingdoms = enemies.Distinct().ToList(),
                    AlliedKingdoms = allies.Distinct().ToList()
                });
            }

            return result;
        }

        public static List<CityDto> GetCities(string? kingdomFilter = null)
        {
            if (MapBox.instance == null || MapBox.instance.cities == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var result = new List<CityDto>();
            foreach (var city in MapBox.instance.cities.list)
            {
                if (city == null || !city.isAlive()) continue;

                var kingdom = city.GetKingdom();
                if (!string.IsNullOrEmpty(kingdomFilter) &&
                    !string.Equals(kingdom?.name, kingdomFilter, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                result.Add(new CityDto
                {
                    Id = city.id,
                    Name = city.name,
                    KingdomName = kingdom != null ? kingdom.name : "",
                    LeaderName = city.leader?.name,
                    Population = city.units != null ? city.units.Count : 0,
                    ArmySize = city.army != null && city.army.units != null ? city.army.units.Count : 0,
                    Wood = city.amount_wood,
                    Gold = city.amount_gold,
                    Stone = city.amount_stone,
                    Metals = city.amount_common_metals
                });
            }

            return result;
        }

        public static bool DeclareWar(string attackerName, string defenderName)
        {
            if (MapBox.instance == null || MapBox.instance.kingdoms == null || MapBox.instance.wars == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var attacker = MapBox.instance.kingdoms.list.FirstOrDefault(k => string.Equals(k.name, attackerName, StringComparison.OrdinalIgnoreCase));
            var defender = MapBox.instance.kingdoms.list.FirstOrDefault(k => string.Equals(k.name, defenderName, StringComparison.OrdinalIgnoreCase));

            if (attacker == null)
                throw new ArgumentException($"Attacker kingdom '{attackerName}' not found.");
            if (defender == null)
                throw new ArgumentException($"Defender kingdom '{defenderName}' not found.");
            if (attacker == defender)
                throw new ArgumentException("A kingdom cannot declare war on itself.");

            var warAsset = AssetManager.war_types_library?.get("whisper_of_war") ?? AssetManager.war_types_library?.list?.FirstOrDefault();
            if (warAsset == null)
                throw new InvalidOperationException("No war type asset available.");

            MapBox.instance.wars.newWar(attacker, defender, warAsset);
            WorldTip.showNowTop($"{attacker.name} declared war on {defender.name}!", false);
            return true;
        }

        public static bool MakePeace(string kingdom1Name, string kingdom2Name)
        {
            if (MapBox.instance == null || MapBox.instance.kingdoms == null || MapBox.instance.wars == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var k1 = MapBox.instance.kingdoms.list.FirstOrDefault(k => string.Equals(k.name, kingdom1Name, StringComparison.OrdinalIgnoreCase));
            var k2 = MapBox.instance.kingdoms.list.FirstOrDefault(k => string.Equals(k.name, kingdom2Name, StringComparison.OrdinalIgnoreCase));

            if (k1 == null || k2 == null)
                throw new ArgumentException("One or both kingdoms not found.");

            var war = MapBox.instance.wars.getWar(k1, k2, false) ?? MapBox.instance.wars.getWar(k2, k1, false);
            if (war != null)
            {
                MapBox.instance.wars.endWar(war, WarWinner.Peace);
                WorldTip.showNowTop($"Peace has been established between {k1.name} and {k2.name}!", false);
                return true;
            }

            return false;
        }
    }
}
