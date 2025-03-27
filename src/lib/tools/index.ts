import { tool as tooltype, Tool } from "ai";
import { searchTool } from "./serach-web";
import { scrapeTool } from "./scrape";
import { extractTool } from "./extract-url";
import { deepsearchTool } from "./deep-research";
import { companyNewsTool } from "./company-news";
import { stockFinancialsTool } from "./stockFinancialsTool";
import { marketMoversTool } from "./market-movers-tool";
import { analyticsTool } from "./analytics-tool";
import { companyOverviewTool } from "./company-overview-tool";
import { etfAnalyticsTool } from "./etf-analytics-tool";
import { dividendTool } from "./dividend-tool";
import { incomeStatementTool } from "./incomeStatement-tool";
import { balanceSheetTool } from "./balanceSheet-tool";
import { cashFlowTool } from "./cashFlow";
import { earningsTool } from "./earnings-tool";
// 工具注册表
export const tools = {
  // scrape: scrapeTool,
  search: searchTool,
  extract: extractTool,
  deepsearch: deepsearchTool,
  companyNews: companyNewsTool,
  stockFinancials: stockFinancialsTool,
  marketMovers: marketMoversTool,
  analytics: analyticsTool,
  companyOverview: companyOverviewTool,
  etfAnalytics: etfAnalyticsTool,
  dividends: dividendTool,
  incomeStatement: incomeStatementTool,
  balanceSheet: balanceSheetTool,
  cashFlow: cashFlowTool,
  earnings: earningsTool,
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
