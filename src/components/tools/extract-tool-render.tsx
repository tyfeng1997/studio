"use client";
import React from "react";
import { FileText, ExternalLink, Info } from "lucide-react";
import { ToolCard } from "@/components/tool-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExtractedItem {
  url: string;
  data: any;
}

// Extract result renderer
export function ExtractResultRenderer({ data }) {
  if (!data || Object.keys(data).length === 0) {
    return (
      <Alert className="mb-2 mt-2">
        <Info className="h-4 w-4" />
        <AlertDescription>
          No data was extracted from the provided URLs.
        </AlertDescription>
      </Alert>
    );
  }

  // Handle case where data is an array of extracted items
  if (Array.isArray(data)) {
    return (
      <ToolCard title="Extracted Data">
        <div className="space-y-4">
          {data.map((item: ExtractedItem, index) => (
            <ExtractedItemCard key={index} item={item} />
          ))}
        </div>
      </ToolCard>
    );
  }

  // Handle case where data is in the format { extractedData: [...] }
  if (data.extractedData && Array.isArray(data.extractedData)) {
    return <ExtractResultRenderer data={data.extractedData} />;
  }

  // Handle case where data is a single extraction result
  if (data.url && data.data) {
    return (
      <ToolCard title="Extracted Data">
        <ExtractedItemCard item={data} />
      </ToolCard>
    );
  }

  // Fallback for unknown format
  return (
    <ToolCard title="Extracted Data">
      <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(data, null, 2)}
      </pre>
    </ToolCard>
  );
}

function ExtractedItemCard({ item }: { item: ExtractedItem }) {
  const { url, data } = item;
  const hostname = getHostname(url);

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="h-4 w-4 flex-shrink-0 text-zinc-500" />
          <span className="text-sm font-medium truncate">{hostname}</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => window.open(url, "_blank")}
          title="Open URL"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
      <div className="p-3">
        <RenderExtractedData data={data} />
      </div>
    </div>
  );
}

function RenderExtractedData({ data }: { data: any }) {
  if (typeof data === "string") {
    return <p className="text-sm whitespace-pre-wrap">{data}</p>;
  }

  if (Array.isArray(data)) {
    return (
      <Accordion type="single" collapsible className="w-full">
        {data.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-sm py-2">
              Item {index + 1}
            </AccordionTrigger>
            <AccordionContent>
              <RenderExtractedData data={item} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }

  if (typeof data === "object" && data !== null) {
    return (
      <div className="space-y-2">
        {Object.entries(data).map(([key, value], index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                {key}
              </Badge>
            </div>
            <div className="pl-2 border-l-2 border-zinc-200 dark:border-zinc-700">
              <RenderExtractedData data={value} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback for other data types
  return <p className="text-sm">{String(data)}</p>;
}

// Helper function to get the hostname from a URL
function getHostname(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
}
