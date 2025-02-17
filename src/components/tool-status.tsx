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

type ToolAction = {
  type: "tool-status" | "progress-init" | "chat-status";
  content: {
    tool?: string;
    status?: string;
    message?: string;
    timestamp?: string;
    metadata?: any;
  };
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

function getStatusIcon(status: string) {
  const commonProps = { className: "w-5 h-5" };

  switch (status) {
    case "started":
      return (
        <Search
          {...commonProps}
          className="w-5 h-5 text-blue-400 dark:text-blue-300"
        />
      );
    case "completed":
      return (
        <CheckCircle
          {...commonProps}
          className="w-5 h-5 text-emerald-400 dark:text-emerald-300"
        />
      );
    case "error":
      return (
        <AlertCircle
          {...commonProps}
          className="w-5 h-5 text-red-400 dark:text-red-300"
        />
      );
    default:
      return (
        <Clock
          {...commonProps}
          className="w-5 h-5 text-gray-400 dark:text-gray-300"
        />
      );
  }
}
export function ToolStatus({ data }: { data: any[] }) {
  const [state, dispatch] = useReducer(toolReducer, initialToolState);

  useEffect(() => {
    if (!data?.length) return;
    const latestData = data[data.length - 1];
    if (typeof latestData === "object" && latestData !== null) {
      dispatch(latestData);
    }
  }, [data]);

  if (state.status === "idle") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "started":
        return "text-blue-500 dark:text-blue-400";
      case "completed":
        return "text-emerald-500 dark:text-emerald-400";
      case "error":
        return "text-red-500 dark:text-red-400";
      default:
        return "text-gray-500 dark:text-gray-400";
    }
  };

  return (
    <div className="my-4 px-4">
      <Alert className="bg-card text-card-foreground border border-border shadow-sm">
        <div className="flex items-center space-x-3">
          <div className={`${getStatusColor(state.status)}`}>
            {getStatusIcon(state.status)}
          </div>
          <div className="flex-1 min-w-0">
            <AlertTitle className="text-sm font-medium">
              {state.currentTool ? state.currentTool : "Tool Execution"}
            </AlertTitle>
            <AlertDescription>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                {state.message}
              </p>
              {state.activities.length > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  {state.activities.length} step
                  {state.activities.length > 1 ? "s" : ""} completed
                </div>
              )}
            </AlertDescription>
          </div>
          {state.progress > 0 && (
            <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}
        </div>
      </Alert>
    </div>
  );
}
