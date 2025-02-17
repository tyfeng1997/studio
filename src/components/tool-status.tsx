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
import { useToolStatus } from "../hooks/useToolStatus";

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

export const ToolStatus = ({ data }: { data: any[] }) => {
  const state = useToolStatus(data);

  // 如果没有活动，不显示组件
  if (state.status === "idle" && state.activities.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4">
      {/* 当前状态显示 */}
      <Alert className="bg-card text-card-foreground border border-border">
        <div className="flex items-center space-x-2">
          {getStatusIcon(state.status)}
          <AlertTitle className="text-lg capitalize">
            {state.currentTool
              ? `${state.currentTool} - ${state.status}`
              : state.status}
          </AlertTitle>
        </div>
        <AlertDescription>
          <p className="mt-2 text-muted-foreground">{state.message}</p>
          {state.progress > 0 && (
            <div className="w-full bg-secondary rounded-full h-2 mt-4">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}
        </AlertDescription>
      </Alert>

      {/* 活动历史 */}
      <div className="space-y-2">
        {state.activities.map((activity) => (
          <div
            key={activity.id}
            className="p-4 bg-card text-card-foreground border border-border rounded-lg"
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(activity.status)}
              <span className="font-medium">{activity.message}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </div>
            {activity.metadata && (
              <div className="mt-2 text-sm text-muted-foreground">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(activity.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolStatus;
