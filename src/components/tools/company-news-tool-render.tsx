"use client";
import React from "react";
import {
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Format the date in a user-friendly way
function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

// Company News result renderer
export function CompanyNewsResultRenderer({ data }) {
  if (!data || !data.articles) {
    return (
      <ToolCard title="Company News">
        <div className="text-center text-muted-foreground text-sm py-2">
          No news articles found
        </div>
      </ToolCard>
    );
  }

  const { articles, ticker } = data;

  return (
    <ToolCard title={`Latest News for ${ticker}`}>
      <div className="space-y-4">
        {articles.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-2">
            No news articles found for {ticker}
          </div>
        ) : (
          articles.map((article, index) => (
            <div
              key={article.id || index}
              className="flex flex-col gap-3 p-3 border border-border rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Publisher logo/favicon */}
                <div className="flex-shrink-0 mt-1">
                  {article.publisher.favicon_url ? (
                    <img
                      src={article.publisher.favicon_url}
                      alt=""
                      className="w-5 h-5"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/fallback-icon.png";
                      }}
                    />
                  ) : (
                    <Newspaper className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Article content */}
                <div className="flex-1 min-w-0">
                  {/* Title and publisher */}
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{article.title}</h4>
                  </div>

                  {/* Publisher and date */}
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <span className="font-medium">
                      {article.publisher.name}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{formatDate(article.published_utc)}</span>
                    {article.author && (
                      <>
                        <span className="mx-2">•</span>
                        <span>By {article.author}</span>
                      </>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                    {article.description}
                  </p>

                  {/* Related tickers */}
                  {article.tickers && article.tickers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {article.tickers.map((ticker) => (
                        <Badge
                          key={ticker}
                          variant="outline"
                          className="text-xs"
                        >
                          {ticker}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Insights */}
                  {article.insights && article.insights.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <TooltipProvider>
                        {article.insights.map((insight, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 text-xs">
                                {insight.sentiment === "positive" ? (
                                  <TrendingUp className="w-3 h-3 text-green-500" />
                                ) : insight.sentiment === "negative" ? (
                                  <TrendingDown className="w-3 h-3 text-red-500" />
                                ) : (
                                  <Activity className="w-3 h-3 text-yellow-500" />
                                )}
                                <span
                                  className={`font-medium ${
                                    insight.sentiment === "positive"
                                      ? "text-green-500"
                                      : insight.sentiment === "negative"
                                      ? "text-red-500"
                                      : "text-yellow-500"
                                  }`}
                                >
                                  {insight.ticker}:{" "}
                                  {insight.sentiment.charAt(0).toUpperCase() +
                                    insight.sentiment.slice(1)}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p className="text-xs">
                                {insight.sentiment_reasoning}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </TooltipProvider>
                    </div>
                  )}

                  {/* Article link */}
                  <div className="mt-2">
                    <a
                      href={article.article_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-primary hover:underline"
                    >
                      Read full article
                      <ExternalLink className="ml-1 w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </ToolCard>
  );
}
