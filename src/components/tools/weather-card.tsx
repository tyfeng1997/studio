"use client";

import { ToolCard } from "./tool-card";
import { Cloud, Thermometer } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WeatherData {
  location: string;
  temperature: number;
}

interface WeatherCardProps {
  data: WeatherData | null | undefined;
}

export function WeatherCard({ data }: WeatherCardProps) {
  // 数据验证
  if (!data || !data.location || typeof data.temperature !== "number") {
    return (
      <ToolCard title="Weather Information">
        <Alert>
          <AlertDescription>Invalid or missing weather data</AlertDescription>
        </Alert>
      </ToolCard>
    );
  }

  return (
    <ToolCard title="Weather Information">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Cloud className="h-4 w-4 text-muted-foreground" />
          <span>Location: {data.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Thermometer className="h-4 w-4 text-muted-foreground" />
          <span>Temperature: {data.temperature}°F</span>
        </div>
      </div>
    </ToolCard>
  );
}
