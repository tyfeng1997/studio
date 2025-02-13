"use client";

import { WeatherCard } from "./weather-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { XCircle } from "lucide-react";

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
  // 处理错误状态
  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Tool Execution Failed</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // 处理数据为空的情况
  if (!data) {
    return (
      <Alert>
        <AlertDescription>No data available for tool: {tool}</AlertDescription>
      </Alert>
    );
  }

  try {
    switch (tool) {
      case "weather":
        return <WeatherCard data={data} />;
      default:
        return (
          <Alert>
            <AlertDescription>Unknown tool result: {tool}</AlertDescription>
          </Alert>
        );
    }
  } catch (error) {
    // 捕获渲染过程中的错误
    console.error(`Error rendering tool result for ${tool}:`, error);
    return (
      <Alert variant="destructive">
        <AlertTitle>Rendering Error</AlertTitle>
        <AlertDescription>Failed to display tool result</AlertDescription>
      </Alert>
    );
  }
}
