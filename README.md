# 🌍 WorldboxMCP: AI Agent Bridge for WorldBox

**WorldboxMCP** is a bidirectional bridge implementing the official **Model Context Protocol (MCP)** for the game **WorldBox – God Simulator**. It allows Artificial Intelligence agents (such as Claude Desktop, Antigravity, Cursor, Cline, etc.) to observe the simulation and act as divine entities in the game in real time.

---

## 🏛️ Architecture

The project consists of two core components:

1. **In-game Mod (`mod/`)**:
   - Built in **C#** (.NET Standard 2.1) for Unity.
   - Inherits from `NeoModLoader.api.BasicMod<Main>`, natively compatible with **NeoModLoader (NML)**.
   - Runs an embedded HTTP server (`http://127.0.0.1:2828/`) safely synchronized with the Unity *Main Thread* via a `MainThreadDispatcher`.
   - Inspects and manipulates the WorldBox engine directly (`MapBox`, `World`, `ActorManager`, `KingdomManager`, `WarManager`, etc.).

2. **MCP Bridge Server (`server/`)**:
   - Built in **TypeScript** using `@modelcontextprotocol/sdk`.
   - Communicates via **stdio** (JSON-RPC), compatible with any official MCP client.
   - Features zero-token local watchers and macro tools for maximum token economy.

---

## 🛠️ MCP Tools Catalog

### 👁️ Real-Time Watchers & Token Economy (Zero-Token Polling)
| Tool | Description |
|---|---|
| `worldbox_wait_for_event` | **Real-Time Watcher**: Monitors the game locally (consuming zero tokens during wait) and only wakes the AI when a specific event occurs (e.g., `war_started`, `king_died`, `city_lost`, hero with `low_health` or `died`). |
| `worldbox_get_recent_events` | **Delta Detector**: Returns only what has changed since the last check, saving up to 95% of tokens. |

### ⚡ Macro Tools (Batch Operations in 1 Turn)
| Tool | Description |
|---|---|
| `worldbox_create_champion` | Spawns a legendary hero, grants multiple divine traits, assigns a custom title, and broadcasts a prophecy banner on-screen in **a single tool call**. |
| `worldbox_trigger_event` | Triggers a divine power/disaster and displays the corresponding prophecy banner in **a single tool call**. |

### 🔍 Inspection & Query (Supports `compact: true`)
| Tool | Description |
|---|---|
| `worldbox_get_status` | Checks if WorldBox is running and an active map is loaded. |
| `worldbox_get_world_info` | Returns current year, era, month, total population, kingdoms count, cities, and active wars. |
| `worldbox_get_kingdoms` | Lists all active kingdoms, kings, capitals, populations, alliances, and wars (`compact: true` supported). |
| `worldbox_get_cities` | Lists cities with populations, armies, and resources (`compact: true` supported). |
| `worldbox_get_units` | Lists units with attributes, health, levels, and traits (`compact: true` supported). |
| `worldbox_inspect_tile` | Inspects coordinates (x, y) returning biome, owner kingdom, city, and buildings. |

### ⚔️ Modification, Diplomacy & Powers
| Tool | Description |
|---|---|
| `worldbox_spawn_creature` | Spawns creatures (human, elf, orc, dwarf, dragon, etc.) with optional divine traits. |
| `worldbox_modify_unit` | Adds/removes traits, heals, sets health, or instantly executes (`kill`) a unit. |
| `worldbox_modify_tile` | Alters terrain at (x, y) (e.g., `soil`, `deep_ocean`, `sand`, `plain`, `forest`, `mountains`, `lava`). |
| `worldbox_declare_war` | Forces an immediate war declaration between two kingdoms via divine whisper. |
| `worldbox_make_peace` | Enforces an immediate peace treaty between warring kingdoms. |
| `worldbox_trigger_power` | Drops lightning, meteors, earthquakes, bombs, blessings, curses, healing rain, lava, etc. |
| `worldbox_set_speed` | Controls simulation speed (`pause`, `0.5x`, `1x`, `2x`, `3x`, `5x`, `sonic`). |
| `worldbox_broadcast_message` | Displays an on-screen prophecy or divine banner to the player. |

---

## 🚀 Setup & Installation

### 1. Prerequisite: NeoModLoader in WorldBox
1. In WorldBox, go to **Settings > Settings** and toggle **Experimental Mode** to **ON**.
2. Download `NeoModLoader.dll` from the [NML GitHub Releases page](https://github.com/WorldBoxOpenMods/ModLoader/releases/latest).
3. Place `NeoModLoader.dll` into your game's mods folder:
   - **macOS:** `~/Library/Application Support/Steam/steamapps/common/worldbox/worldbox.app/Contents/Resources/Data/StreamingAssets/mods/`
   - **Windows:** `.../worldbox_Data/StreamingAssets/mods/`

### 2. Build and Deploy the Mod
Run the automated build and installation script:
```bash
./install_mod.sh
```

### 3. Configure Your MCP Client

Add the server to your MCP configuration file (e.g., `claude_desktop_config.json` or Antigravity's `~/.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "worldbox": {
      "command": "node",
      "args": [
        "/Users/carlos/Documents/Projects/WorldboxMCP/server/dist/index.js"
      ]
    }
  }
}
```

---

## 📊 Token Usage Estimates & Optimization

When connecting WorldBox to an LLM via MCP, token usage is determined by four components:
1. **Tool Definitions (Schemas)**: ~1,500 to 2,000 tokens (injected once per turn by the MCP client).
2. **Conversation History**: Accumulated dialogue context over the course of the session.
3. **Tool Output Payloads**: Game data returned in JSON format (kingdoms, cities, units).
4. **AI Output Generation**: Narrative text and tool invocation arguments (~100 to 400 tokens per turn).

---

### 📈 Comparison Table by Usage Pattern

| Mode / Pattern | Description | Typical Frequency | Average Token Cost per Action | Estimated Cost per Session |
|---|---|---|---|---|
| **Interactive / On-Demand** *(Recommended)* | Player gives manual instructions when desired (e.g., *"Summarize the world"*, *"Start a war"*). | 1 prompt every 5 to 10 min | **2,000 to 4,000 tokens** | Less than **\$0.01 per hour** |
| **Reactive Watcher (`worldbox_wait_for_event`)** | AI sleeps while local Node.js polls at 1.5s; only wakes up when the event triggers. | Only on event trigger | **0 tokens during wait** + ~2,500 on trigger | Cents per session |
| **Delta Query (`worldbox_get_recent_events`)** | Returns only world changes since the previous check instead of dumping the full map. | Periodic on-demand | **~30 to 80 data tokens** (**95% savings**) | Negligible |
| **Macro Actions (`worldbox_create_champion`)** | Spawns hero, equips traits, and shows banner in **1 single turn**. | As needed | **1 turn** (~2,500 tokens) vs 4 turns (~9,000 tokens) | **~70% to 75% savings** |
| **Full Detailed Queries (`compact: false`)** | Raw listing of 50+ units or kingdoms with all nested fields and IDs. | Occasional | **1,500 to 3,000 raw data tokens** | Moderate |
| **Continuous AI Polling without Watcher** *(Anti-Pattern - Avoid)* | Having the AI ask for game status every 10 to 30 seconds continuously. | 120 to 360 calls/hour | **500,000 to 1,000,000+ tokens/hour** | High |

---

### 💡 Best Practices for Maximum Token Economy

1. **Prioritize Local Watchers (`worldbox_wait_for_event`)**:
   - Because the polling loop runs locally in Node.js every 1.5s on `localhost:2828`, **no tokens are spent during the wait period**. Use this to turn the AI into a reactive guardian.
2. **Use `compact: true` in Query Tools**:
   - `worldbox_get_kingdoms`, `worldbox_get_cities`, and `worldbox_get_units` support `compact: true`, shrinking output text by up to 75%.
3. **Use Macro Tools for Complex Interactions**:
   - Prefer `worldbox_create_champion` and `worldbox_trigger_event` to avoid back-and-forth round trips.
4. **Prune Long Contexts with `/compact`**:
   - In extended gameplay sessions, use `/compact` in chat to summarize earlier turns and free up the context window.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
