"use client";
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  XCircle,
  Search,
  Globe,
  FileText,
  CheckCircle,
  InfoIcon,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ToolCard } from "@/components/tools/tool-card";

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
      <Alert variant="destructive" className="mb-2 mt-2">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Tool Execution Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Handle empty data state
  if (!data) {
    return (
      <Alert className="mb-2 mt-2">
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>No data available for tool: {tool}</AlertDescription>
      </Alert>
    );
  }

  try {
    switch (tool) {
      case "search":
        return <SearchResultRenderer data={data} />;
      case "extract":
        return <ExtractResultRenderer data={data} />;
      // Add more tool renderers as needed
      default:
        // Generic JSON renderer for unknown tools
        return (
          <ToolCard
            title={`${tool.charAt(0).toUpperCase() + tool.slice(1)} Result`}
          >
            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(data, null, 2)}
            </pre>
          </ToolCard>
        );
    }
  } catch (error) {
    console.error(`Error rendering tool result for ${tool}:`, error);
    return (
      <Alert variant="destructive" className="mb-2 mt-2">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Rendering Error</AlertTitle>
        <AlertDescription>Failed to display tool result</AlertDescription>
      </Alert>
    );
  }
}

// Search result renderer
function SearchResultRenderer({ data }) {
  // Handle array results from search tool
  if (Array.isArray(data)) {
    return (
      <ToolCard title="Search Results">
        <div className="space-y-3">
          {data.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-2">
              No search results found
            </div>
          ) : (
            data.map((result, index) => (
              <div
                key={index}
                className="flex gap-3 p-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
              >
                {result.favicon ? (
                  <img
                    src={result.favicon}
                    alt=""
                    className="w-4 h-4 mt-1"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/fallback-icon.png"; // Fallback icon
                    }}
                  />
                ) : (
                  <Globe className="w-4 h-4 mt-1 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm truncate">
                      {result.title}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {result.snippet}
                  </p>
                  <div className="flex items-center mt-1">
                    <span className="text-xs text-muted-foreground truncate flex-1">
                      {result.url}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ToolCard>
    );
  }

  // Handle non-array results (like the newer format with resultsWithFavicons)
  if (data.resultsWithFavicons && Array.isArray(data.resultsWithFavicons)) {
    return <SearchResultRenderer data={data.resultsWithFavicons} />;
  }

  // Fallback for unknown format
  return (
    <ToolCard title="Search Results">
      <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </ToolCard>
  );
}

// Extract result renderer
function ExtractResultRenderer({ data }) {
  // Handle extract data which may contain structured information
  const hasExtractedData =
    data.extractedData && Object.keys(data.extractedData).length > 0;

  return (
    <ToolCard title="Extracted Information">
      {hasExtractedData ? (
        <div className="space-y-2">
          {Object.entries(data.extractedData).map(([key, value], index) => (
            <div key={index} className="bg-muted/50 p-2 rounded-md">
              <div className="text-xs font-medium text-muted-foreground mb-1">
                {key.charAt(0).toUpperCase() +
                  key
                    .slice(1)
                    .replace(/([A-Z])/g, " $1")
                    .trim()}
                :
              </div>
              <div className="text-sm">
                {typeof value === "string" ? value : JSON.stringify(value)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground text-sm py-2">
          No specific data was extracted
        </div>
      )}

      {data.url && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Source:</span>
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs flex items-center text-blue-500 hover:underline"
          >
            {new URL(data.url).hostname}
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        </div>
      )}
    </ToolCard>
  );
}
