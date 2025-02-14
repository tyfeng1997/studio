// components/tool-config/tool-config.tsx
"use client";

import { useToolStore } from "@/lib/store/tool-store";

const RAGConfig = () => (
  <div className="p-4">
    <h2 className="text-lg font-semibold mb-4">RAG Configuration</h2>
    {/* Add your RAG configuration UI here */}
  </div>
);

const toolComponents: Record<string, React.FC> = {
  rag: RAGConfig,
  // Add more tool components here
};

export function ToolConfig() {
  const activeToolKey = useToolStore((state) => state.activeToolKey);

  if (!activeToolKey) return null;

  const ToolComponent = toolComponents[activeToolKey];

  if (!ToolComponent) return null;

  return (
    <div className="h-full w-full bg-background border-l">
      <ToolComponent />
    </div>
  );
}
