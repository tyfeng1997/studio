import { tool as tooltype, Tool } from "ai";
import { searchTool } from "./serach-web";
import { scrapeTool } from "./scrape";
import { extractTool } from "./extract-url";
import { vectorSearchTool } from "./vector-query";
import { deepResearchTool } from "./deepsearch";
// 工具注册表
export const tools = {
  scrape: scrapeTool,
  search: searchTool,
  extract: extractTool,
  vector_search: vectorSearchTool,
  deep_research: deepResearchTool,
};

// 获取所有工具的配置，用于AI SDK
export function getToolsConfig() {
  const toolsConfig: Record<string, Tool<any, unknown>> = {};

  for (const [name, tool] of Object.entries(tools)) {
    if (!tool || typeof tool.execute !== "function") {
      continue;
    }
    toolsConfig[name] = tooltype({
      description: tool.description,
      parameters: tool.parameters,
      execute: tool.execute,
    });
  }

  return toolsConfig;
}
