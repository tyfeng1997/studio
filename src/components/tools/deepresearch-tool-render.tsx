"use client";
import React, { useState } from "react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronsDown, ChevronsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DeepSearchResultRenderer({ data }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Function to determine content display
  const getDisplayContent = () => {
    if (isExpanded) {
      return data.content;
    }

    // For collapsed view, show first 3 paragraphs or ~300 chars
    const paragraphs = data.content.split("\n\n");
    if (paragraphs.length > 3) {
      return paragraphs.slice(0, 3).join("\n\n") + "...";
    }

    if (data.content.length > 300) {
      return data.content.substring(0, 300) + "...";
    }

    return data.content;
  };

  return (
    <ToolCard title="Research Results">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {data.model || "Perplexity AI"}
            </Badge>
            {data.query && (
              <span className="text-xs text-muted-foreground truncate max-w-md">
                Query: {data.query}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-1" />
            {isCopied ? "Copied!" : "Copy"}
          </Button>
        </div>

        <div className="bg-muted/50 p-3 rounded-md whitespace-pre-line text-sm">
          {getDisplayContent()}
        </div>

        {data.content.length > 300 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronsUp className="h-4 w-4 mr-1" /> Show Less
              </>
            ) : (
              <>
                <ChevronsDown className="h-4 w-4 mr-1" /> Show More
              </>
            )}
          </Button>
        )}

        {data.usage && (
          <div className="text-xs text-muted-foreground">
            Tokens: {data.usage.total_tokens} (Prompt:{" "}
            {data.usage.prompt_tokens}, Completion:{" "}
            {data.usage.completion_tokens})
          </div>
        )}
      </div>
    </ToolCard>
  );
}
