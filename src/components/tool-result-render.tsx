"use client";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle, InfoIcon } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { ExtractResultRenderer } from "@/components/tools/extract-tool-render";
import { SearchResultRenderer } from "@/components/tools/search-tool-render";
import { DeepSearchResultRenderer } from "@/components/tools/deepresearch-tool-render";
import { CompanyNewsResultRenderer } from "@/components/tools/company-news-tool-render";
import { StockFinancialsResultRenderer } from "@/components/tools/stock-financials-tool-render";
import { MarketMoversRenderer } from "@/components/tools/market-movers-tool-render";
import { AnalyticsRenderer } from "@/components/tools/analytics-tool-render";
import { CompanyOverviewRenderer } from "@/components/tools/company-overview-tool-render";
import { ETFAnalyticsRenderer } from "@/components/tools/etf-analytics-tool-render";
import { DividendResultRenderer } from "@/components/tools/dividend-tool-render";

interface ToolResultRendererProps {
  tool: string;
  data: any;
  error?: string;
}

export function ToolResultRenderer({
  tool,
  data,
  error,
}: ToolResultRendererProps) {
  // Handle error state
  if (error) {
    return (
      <Alert variant="destructive" className="mb-2 mt-2 w-full">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Tool Execution Failed</AlertTitle>
        <AlertDescription className="break-words">{error}</AlertDescription>
      </Alert>
    );
  }

  // Handle empty data state
  if (!data) {
    return (
      <Alert className="mb-2 mt-2 w-full">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>No data available for tool: {tool}</AlertDescription>
      </Alert>
    );
  }

  try {
    switch (tool) {
      case "search":
        return <SearchResultRenderer data={data.data} />;
      case "extract":
        return <ExtractResultRenderer data={data.data} />;
      case "deepresearch":
        return <DeepSearchResultRenderer data={data.data} />;
      case "companyNews":
        return <CompanyNewsResultRenderer data={data.data} />;
      case "stockFinancials":
        return <StockFinancialsResultRenderer data={data.data} />;
      case "marketMovers":
        return <MarketMoversRenderer data={data.data} />;
      case "analytics":
        return <AnalyticsRenderer data={data.data} />;
      case "companyOverview":
        return <CompanyOverviewRenderer data={data.data} />;
      case "etfAnalytics":
        return <ETFAnalyticsRenderer data={data.data} />;
      case "dividends":
        return <DividendResultRenderer data={data.data} />;

      // Add more tool renderers as needed
      default:
        // Generic JSON renderer for unknown tools
        return (
          <ToolCard
            title={`${tool.charAt(0).toUpperCase() + tool.slice(1)} Result`}
            className="w-full"
          >
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ToolCard>
        );
    }
  } catch (error) {
    console.error(`Error rendering tool result for ${tool}:`, error);
    return (
      <Alert variant="destructive" className="mb-2 mt-2 w-full">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Rendering Error</AlertTitle>
        <AlertDescription>Failed to display tool result</AlertDescription>
      </Alert>
    );
  }
}
