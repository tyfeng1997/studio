"use client";
import React from "react";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Database,
  Cog,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect, useReducer } from "react";
import { JSONValue } from "ai";
import { generateId } from "../utils/id";
import { motion, AnimatePresence } from "framer-motion";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Enhanced ToolState type with deep research specific fields
export type ToolState = {
  activities: Array<{
    id: string;
    tool: string;
    params?: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    timestamp: string;
    // Deep research specific fields
    phase?: string;
    iteration?: number;
    timeRemaining?: number;
    foundDocuments?: number;
    findingsCount?: number;
    vectorResults?: number;
    webResults?: number;
  }>;
};

const initialToolState: ToolState = {
  activities: [],
};

function toolReducer(state: ToolState, action: any): ToolState {
  if (action.type === "clear") {
    return initialToolState;
  }

  const { tool, content } = action;
  if (!tool || !content) return state;

  const newActivity = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    tool,
    ...content,
    // Extract deep research specific fields
    phase: content.phase,
    iteration: content.iteration,
    timeRemaining: content.timeRemaining,
    foundDocuments: content.foundDocuments,
    findingsCount: content.findingsCount,
    vectorResults: content.vectorResults,
    webResults: content.webResults,
  };

  return {
    ...state,
    activities: [...state.activities, newActivity],
  };
}

// Enhanced status badge component
const PhaseBadge = ({ phase }: { phase: string }) => {
  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case "initialization":
        return "bg-blue-500";
      case "vector_search":
        return "bg-purple-500";
      case "iteration_start":
        return "bg-yellow-500";
      case "iteration_complete":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Badge variant="secondary" className={`${getPhaseColor(phase)} text-white`}>
      {phase?.replace(/_/g, " ")}
    </Badge>
  );
};

// Enhanced status record component
const StatusRecord = ({ activity, isExpanded, onToggle, isLatest }) => {
  const isDeepResearch = activity.tool === "deep_research";

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-border rounded-lg overflow-hidden ${
        isLatest ? "bg-card shadow-sm" : "bg-muted/30"
      } mb-2`}
    >
      <div className="p-3 flex items-center cursor-pointer" onClick={onToggle}>
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <span className="text-sm font-medium truncate">{activity.tool}</span>
          {activity.phase && <PhaseBadge phase={activity.phase} />}
          {activity.iteration && (
            <Badge variant="outline">Iteration {activity.iteration}</Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              {isDeepResearch && activity.phase && (
                <div className="mb-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {activity.timeRemaining !== undefined && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs font-medium">Time Remaining</p>
                        <p className="text-sm">
                          {activity.timeRemaining} minutes
                        </p>
                      </div>
                    )}
                    {activity.foundDocuments !== undefined && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs font-medium">Documents Found</p>
                        <p className="text-sm">{activity.foundDocuments}</p>
                      </div>
                    )}
                    {activity.findingsCount !== undefined && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs font-medium">Total Findings</p>
                        <p className="text-sm">{activity.findingsCount}</p>
                      </div>
                    )}
                    {(activity.vectorResults !== undefined ||
                      activity.webResults !== undefined) && (
                      <div className="bg-muted/50 p-2 rounded">
                        <p className="text-xs font-medium">Results</p>
                        <p className="text-sm">
                          {activity.vectorResults !== undefined &&
                            `Vector: ${activity.vectorResults}`}
                          {activity.vectorResults !== undefined &&
                            activity.webResults !== undefined &&
                            " | "}
                          {activity.webResults !== undefined &&
                            `Web: ${activity.webResults}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activity.params && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Parameters:</h4>
                  <div className="relative max-h-40 overflow-y-auto">
                    <pre className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap break-all">
                      {JSON.stringify(activity.params, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {activity.result && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Result:</h4>
                  <div className="relative max-h-40 overflow-y-auto">
                    <pre className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap break-all">
                      {JSON.stringify(activity.result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
              {activity.error && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-red-500">Error:</h4>
                  <div className="relative max-h-40 overflow-y-auto">
                    <p className="text-sm text-red-500 break-all">
                      {activity.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export function ToolStatus({ data }: { data: any[] }) {
  const [state, dispatch] = useReducer(toolReducer, initialToolState);
  const [expandedIds, setExpandedIds] = React.useState(new Set());
  const processedItems = React.useRef(new Set<string>());

  useEffect(() => {
    if (!data?.length) return;

    data.forEach((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "tool" in item &&
        "content" in item
      ) {
        const key = `${item.tool}-${item.content.timestamp}-${JSON.stringify(
          item.content
        )}`;

        if (!processedItems.current.has(key)) {
          processedItems.current.add(key);
          dispatch(item);
        }
      }
    });
  }, [data]);

  const handleClearAll = () => {
    dispatch({ type: "clear" });
    processedItems.current.clear();
  };

  useEffect(() => {
    if (state.activities.length > 0) {
      const latestId = state.activities[state.activities.length - 1].id;
      setExpandedIds(new Set([latestId]));
    }
  }, [state.activities.length]);

  if (state.activities.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No tool executions yet
      </div>
    );
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const sortedActivities = [...state.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-background z-10">
        <span className="text-sm text-muted-foreground">
          {sortedActivities.length} executions
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="h-8"
        >
          Clear All
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sortedActivities.map((activity, index) => (
            <StatusRecord
              key={activity.id}
              activity={activity}
              isExpanded={expandedIds.has(activity.id)}
              onToggle={() => toggleExpanded(activity.id)}
              isLatest={index === 0}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
