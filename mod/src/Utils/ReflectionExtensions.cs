using System;
using System.Linq;
using System.Reflection;

namespace WorldboxMCP.Utils
{
    public static class ReflectionExtensions
    {
        private static readonly FieldInfo? CityKingdomField = typeof(City).GetField("kingdom", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        private static readonly FieldInfo? EraManagerField = typeof(MapBox).GetField("era_manager", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        private static readonly PropertyInfo? MapStatsProp = typeof(MapBox).GetProperty("_map_stats", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
                                                           ?? typeof(MapBox).GetProperty("map_stats", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);
        private static readonly FieldInfo? MapStatsField = typeof(MapBox).GetField("_map_stats", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public)
                                                          ?? typeof(MapBox).GetField("map_stats", BindingFlags.Instance | BindingFlags.NonPublic | BindingFlags.Public);

        public static Kingdom? GetKingdom(this City? city)
        {
            if (city == null) return null;
            return CityKingdomField?.GetValue(city) as Kingdom ?? city.getKingdoms()?.FirstOrDefault();
        }

        public static WorldAgeManager? GetEraManager(this MapBox? mapBox)
        {
            if (mapBox == null) return null;
            return EraManagerField?.GetValue(mapBox) as WorldAgeManager;
        }

        public static MapStats? GetMapStats(this MapBox? mapBox)
        {
            if (mapBox == null) return null;
            return (MapStatsProp?.GetValue(mapBox) ?? MapStatsField?.GetValue(mapBox)) as MapStats;
        }
    }
}
