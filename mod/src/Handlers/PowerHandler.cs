using System;
using UnityEngine;
using WorldboxMCP.Models;

namespace WorldboxMCP.Handlers
{
    public static class PowerHandler
    {
        public static bool TriggerPower(TriggerPowerRequest req)
        {
            if (MapBox.instance == null)
                throw new InvalidOperationException("Game map is not loaded.");

            var tile = MapBox.instance.GetTile(req.X, req.Y);
            if (tile == null)
                throw new ArgumentException($"Tile at ({req.X}, {req.Y}) is out of bounds.");

            string powerId = req.PowerId.ToLower();

            // Special case: Lightning
            if (powerId == "lightning")
            {
                MapBox.spawnLightningBig(tile, 1f, null);
                return true;
            }

            // Check if it's a drop (e.g. rain, lava, acid, seeds, coffee, blood_rain, grenade)
            var dropAsset = AssetManager.drops?.get(powerId);
            if (dropAsset != null && MapBox.instance.drop_manager != null)
            {
                MapBox.instance.drop_manager.spawn(tile, dropAsset, 15f, 1f, false, 0L);
                return true;
            }

            // Check if it's a GodPower
            var power = AssetManager.powers?.get(powerId);
            if (power != null)
            {
                if (power.click_action != null)
                {
                    power.click_action(tile, powerId);
                    return true;
                }
                if (power.click_power_action != null)
                {
                    power.click_power_action(tile, power);
                    return true;
                }
            }

            // Fallback: try spawning as a drop with ID directly
            if (MapBox.instance.drop_manager != null)
            {
                MapBox.instance.drop_manager.spawn(tile, powerId, 15f, 1f, 0L);
                return true;
            }

            throw new ArgumentException($"Unknown power or drop '{req.PowerId}'.");
        }
    }
}
