"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-4xl h-[calc(100vh-10rem)]",
        "flex flex-col gap-4",
        className
      )}
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
