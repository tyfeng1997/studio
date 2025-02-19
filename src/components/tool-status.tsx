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

export type ToolState = {
  status: "idle" | "started" | "completed" | "error";
  currentTool: string | null;
  progress: number;
  message: string;
  activities: Array<{
    id: string;
    tool: string;
    status: "started" | "completed" | "error";
    message: string;
    timestamp: string;
    metadata?: any;
  }>;
};

const initialToolState: ToolState = {
  status: "idle",
  currentTool: null,
  progress: 0,
  message: "",
  activities: [],
};

function toolReducer(state: ToolState, action: any): ToolState {
  switch (action.type) {
    case "tool-status": {
      const { tool, status, message, timestamp, metadata } = action.content;
      if (!tool || !status || !message) return state;

      const newActivity = {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        tool,
        status: status as "started" | "completed" | "error",
        message,
        timestamp: timestamp || new Date().toISOString(),
        metadata,
      };

      // 只保留最新的活动记录，但仍然计数所有活动
      return {
        ...state,
        status: status as ToolState["status"],
        currentTool: tool,
        message,
        activities: [...state.activities, newActivity],
      };
    }

    case "progress-init":
      return {
        ...state,
        progress: 0,
      };

    case "chat-status":
      if (action.content.status === "completed") {
        return initialToolState; // 重置状态
      }
      return state;

    default:
      return state;
  }
}

// 状态记录组件
const StatusRecord = ({ activity, isExpanded, onToggle, isLatest }) => {
  const getStatusIcon = (status) => {
    const commonProps = { className: "w-4 h-4" };
    switch (status) {
      case "started":
        return (
          <Search
            {...commonProps}
            className="text-blue-400 dark:text-blue-300"
          />
        );
      case "completed":
        return (
          <CheckCircle
            {...commonProps}
            className="text-emerald-400 dark:text-emerald-300"
          />
        );
      case "error":
        return (
          <AlertCircle
            {...commonProps}
            className="text-red-400 dark:text-red-300"
          />
        );
      default:
        return (
          <Clock
            {...commonProps}
            className="text-gray-400 dark:text-gray-300"
          />
        );
    }
  };

  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={`border border-border rounded-lg overflow-hidden ${
        isLatest ? "bg-card shadow-sm" : "bg-muted/30"
      } mb-2`}
    >
      <div className="p-3 flex items-center cursor-pointer" onClick={onToggle}>
        <div className="flex items-center flex-1 min-w-0">
          {getStatusIcon(activity.status)}
          <span className="ml-2 text-sm font-medium truncate">
            {activity.tool}
          </span>
          <span className="ml-2 text-xs text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                {activity.message}
              </p>
              {activity.metadata && (
                <pre className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              )}
              {activity.progress > 0 && (
                <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-3">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// 主组件
export function ToolStatus({ data }: { data: any[] }) {
  const [state, dispatch] = useReducer(toolReducer, initialToolState);
  const [expandedIds, setExpandedIds] = React.useState(new Set());

  // 更新时自动展开最新的状态
  useEffect(() => {
    if (state.activities.length > 0) {
      const latestId = state.activities[state.activities.length - 1].id;
      setExpandedIds(new Set([latestId]));
    }
  }, [state.activities.length]);

  useEffect(() => {
    if (!data?.length) return;
    const latestData = data[data.length - 1];
    if (typeof latestData === "object" && latestData !== null) {
      dispatch(latestData);
    }
  }, [data]);

  if (state.status === "idle" || state.activities.length === 0) {
    return null;
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

  return (
    <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto">
      {state.activities.map((activity, index) => (
        <StatusRecord
          key={activity.id}
          activity={activity}
          isExpanded={expandedIds.has(activity.id)}
          onToggle={() => toggleExpanded(activity.id)}
          isLatest={index === state.activities.length - 1}
        />
      ))}
    </div>
  );
}
