"use client";
import React from "react";
import { Globe } from "lucide-react";
import { ToolCard } from "@/components/tool-card";

// Search result renderer
export function SearchResultRenderer({ data }) {
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
