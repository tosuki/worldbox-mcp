#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { WorldboxClient } from "./worldboxClient.js";
import { worldTools, handleWorldTool } from "./tools/worldTools.js";
import { diplomacyTools, handleDiplomacyTool } from "./tools/diplomacyTools.js";
import { unitTools, handleUnitTool } from "./tools/unitTools.js";
import { powerTools, handlePowerTool } from "./tools/powerTools.js";
import { watcherTools, handleWatcherTool } from "./tools/watcherTools.js";
import { macroTools, handleMacroTool } from "./tools/macroTools.js";

const client = new WorldboxClient(2828);

const allTools = [
  ...worldTools,
  ...diplomacyTools,
  ...unitTools,
  ...powerTools,
  ...watcherTools,
  ...macroTools
];

const server = new Server(
  {
    name: "worldbox-mcp-server",
    version: "1.1.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: allTools
  };
});

// Call a tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (worldTools.some((t) => t.name === name)) {
      return await handleWorldTool(name, args, client);
    }
    if (diplomacyTools.some((t) => t.name === name)) {
      return await handleDiplomacyTool(name, args, client);
    }
    if (unitTools.some((t) => t.name === name)) {
      return await handleUnitTool(name, args, client);
    }
    if (powerTools.some((t) => t.name === name)) {
      return await handlePowerTool(name, args, client);
    }
    if (watcherTools.some((t) => t.name === name)) {
      return await handleWatcherTool(name, args, client);
    }
    if (macroTools.some((t) => t.name === name)) {
      return await handleMacroTool(name, args, client);
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (err: any) {
    return {
      content: [
        {
          type: "text",
          text: `Erro ao executar ${name}: ${err.message || String(err)}`
        }
      ],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("WorldBox MCP Server running on stdio.");
}

main().catch((err) => {
  console.error("Fatal error starting WorldBox MCP server:", err);
  process.exit(1);
});
