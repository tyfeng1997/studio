// components/layout/split-view.tsx
"use client";

import * as React from "react";
import { useToolStore } from "@/lib/store/tool-store";

interface SplitViewProps {
  leftPane: React.ReactNode;
  rightPane: React.ReactNode;
}

export function SplitView({ leftPane, rightPane }: SplitViewProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [splitPosition, setSplitPosition] = React.useState(50); // percentage
  const activeToolKey = useToolStore((state) => state.activeToolKey);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      const container = document.getElementById("split-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const percentage =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Limit the split position between 30% and 70%
      const boundedPercentage = Math.min(Math.max(percentage, 30), 70);
      setSplitPosition(boundedPercentage);
    },
    [isDragging]
  );

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove]);

  return (
    <div
      id="split-container"
      className="flex relative w-full h-full"
      style={{
        cursor: isDragging ? "col-resize" : "auto",
      }}
    >
      <div
        className="h-full overflow-hidden"
        style={{
          width: activeToolKey ? `${splitPosition}%` : "100%",
          transition: isDragging ? "none" : "width 0.2s ease",
        }}
      >
        {leftPane}
      </div>

      {activeToolKey && (
        <>
          <div
            className="absolute top-0 bottom-0 w-1 bg-border cursor-col-resize hover:bg-primary/50"
            style={{ left: `${splitPosition}%` }}
            onMouseDown={handleMouseDown}
          />

          <div
            className="h-full overflow-hidden"
            style={{
              width: `${100 - splitPosition}%`,
              transition: isDragging ? "none" : "width 0.2s ease",
            }}
          >
            {rightPane}
          </div>
        </>
      )}
    </div>
  );
}
