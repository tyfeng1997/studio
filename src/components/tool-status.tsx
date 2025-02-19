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

// ToolStatus.tsx
export type ToolState = {
  activities: Array<{
    id: string;
    tool: string;
    params?: Record<string, any>;
    result?: Record<string, any>;
    error?: string;
    timestamp: string;
  }>;
};

const initialToolState: ToolState = {
  activities: [],
};

function toolReducer(state: ToolState, action: any): ToolState {
  const { tool, content } = action;
  if (!tool || !content) return state;

  const newActivity = {
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    tool,
    ...content,
  };

  return {
    ...state,
    activities: [...state.activities, newActivity],
  };
}

// 状态记录组件
const StatusRecord = ({ activity, isExpanded, onToggle, isLatest }) => {
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
              {activity.params && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Parameters:</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(activity.params, null, 2)}
                  </pre>
                </div>
              )}
              {activity.result && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium">Result:</h4>
                  <pre className="text-xs bg-muted/50 p-2 rounded overflow-x-auto">
                    {JSON.stringify(activity.result, null, 2)}
                  </pre>
                </div>
              )}
              {activity.error && (
                <div className="mb-2">
                  <h4 className="text-sm font-medium text-red-500">Error:</h4>
                  <p className="text-sm text-red-500">{activity.error}</p>
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

  // 更新时自动展开最新的状态
  useEffect(() => {
    if (state.activities.length > 0) {
      const latestId = state.activities[state.activities.length - 1].id;
      setExpandedIds(new Set([latestId]));
    }
  }, [state.activities.length]);

  // 处理新数据
  useEffect(() => {
    if (!data?.length) return;
    const latestData = data[data.length - 1];

    // 确保数据格式符合预期
    if (
      typeof latestData === "object" &&
      latestData !== null &&
      "tool" in latestData &&
      "content" in latestData
    ) {
      dispatch(latestData);
    }
  }, [data]);

  // 如果没有活动记录，不显示任何内容
  if (state.activities.length === 0) {
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

  // 按时间排序显示活动记录
  const sortedActivities = [...state.activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="space-y-2 max-h-[calc(100vh-10rem)] overflow-y-auto p-4">
      {sortedActivities.map((activity, index) => (
        <StatusRecord
          key={activity.id}
          activity={activity}
          isExpanded={expandedIds.has(activity.id)}
          onToggle={() => toggleExpanded(activity.id)}
          isLatest={index === 0} // 因为已经排序，所以第一个就是最新的
        />
      ))}
    </div>
  );
}
