"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ToolCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function ToolCard({ title, children, className }: ToolCardProps) {
  return (
    <Card className={cn("w-full overflow-hidden", className)}>
      <CardHeader className="py-3">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}
