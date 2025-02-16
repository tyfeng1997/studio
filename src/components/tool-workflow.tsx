import React, { useReducer, useEffect } from "react";
import { ToolState, ToolEvent } from "../types/tool-state";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Database,
  Cog,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { generateId } from "../utils/id";

// 初始状态保持不变
const initialState: ToolState = {
  status: "idle",
  progress: 0,
  currentMessage: "",
  activities: [],
  sources: [],
};

// 修改 reducer 来使用新的 ID 生成函数
function toolReducer(state: ToolState, events: ToolEvent[]): ToolState {
  return events.reduce((currentState, event) => {
    switch (event.type) {
      case "progress-init":
        return {
          ...currentState,
          status: "initializing",
          progress: event.content.progress,
          currentMessage: event.content.message,
        };

      case "activity-delta":
        return {
          ...currentState,
          status: getStatusFromPhase(event.content.metadata?.phase),
          progress: event.content.progress,
          currentMessage: event.content.message,
          activities: [
            ...currentState.activities,
            {
              id: generateId(),
              type: event.content.metadata?.phase || "process",
              status: event.content.status,
              message: event.content.message,
              timestamp: event.content.timestamp,
              metadata: event.content.metadata,
            },
          ],
        };

      case "source-delta":
        return {
          ...currentState,
          sources: [
            ...currentState.sources,
            {
              id: generateId(),
              url: event.content.metadata.url,
              title: event.content.metadata.title,
              confidence: event.content.metadata.confidence,
            },
          ],
        };

      case "finish":
        return {
          ...currentState,
          status: event.content.status === "complete" ? "finished" : "error",
          progress: event.content.progress,
          currentMessage: event.content.message,
          error:
            event.content.status === "error"
              ? event.content.message
              : undefined,
        };

      default:
        return currentState;
    }
  }, state);
}

// 其余代码保持不变...

// 辅助函数：根据阶段获取状态
function getStatusFromPhase(phase?: string) {
  switch (phase) {
    case "search":
      return "searching";
    case "extract":
      return "extracting";
    case "process":
      return "processing";
    default:
      return "processing";
  }
}

// 获取状态图标
function getStatusIcon(status: string) {
  const commonProps = { className: "w-5 h-5" };

  switch (status) {
    case "searching":
      return (
        <Search
          {...commonProps}
          className="w-5 h-5 text-blue-400 dark:text-blue-300"
        />
      );
    case "extracting":
      return (
        <Database
          {...commonProps}
          className="w-5 h-5 text-purple-400 dark:text-purple-300"
        />
      );
    case "processing":
      return (
        <Cog
          {...commonProps}
          className="w-5 h-5 text-green-400 dark:text-green-300"
        />
      );
    case "finished":
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

export const ToolStatus = () => {
  const [state, dispatch] = useReducer(toolReducer, initialState);

  useEffect(() => {
    const startTool = async () => {
      try {
        const response = await fetch("/api/tool-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toolParams: {
              query: "example query",
            },
          }),
        });

        if (!response.ok) throw new Error("Failed to start tool");

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // 解析新的数据格式
          const text = new TextDecoder().decode(value);
          // 分割数据块
          const chunks = text.split("\n").filter(Boolean);

          for (const chunk of chunks) {
            // 检查是否是数据块（以 "2:" 开头）
            if (chunk.startsWith("2:")) {
              try {
                // 解析 JSON 数组
                const events = JSON.parse(chunk.slice(2));
                if (Array.isArray(events)) {
                  // 分发事件数组
                  dispatch(events);
                }
              } catch (e) {
                console.error("Failed to parse chunk:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Tool execution error:", error);
      }
    };

    startTool();
  }, []);

  return (
    <div className="space-y-4 p-4">
      {/* 当前状态显示 */}
      <Alert className="bg-card text-card-foreground border border-border">
        <div className="flex items-center space-x-2">
          {getStatusIcon(state.status)}
          <AlertTitle className="text-lg capitalize">{state.status}</AlertTitle>
        </div>
        <AlertDescription>
          <p className="mt-2 text-muted-foreground">{state.currentMessage}</p>
          {/* 进度条 */}
          <div className="w-full bg-secondary rounded-full h-2 mt-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${state.progress}%` }}
            />
          </div>
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
              {getStatusIcon(activity.type)}
              <span className="font-medium">{activity.message}</span>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {/* 源列表 */}
      {state.sources.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.sources.map((source) => (
            <div
              key={source.id}
              className="p-4 bg-card text-card-foreground border border-border rounded-lg"
            >
              <h3 className="font-medium">{source.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{source.url}</p>
              <div className="mt-2 text-sm text-muted-foreground">
                Confidence: {(source.confidence * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误显示 */}
      {state.error && (
        <Alert
          variant="destructive"
          className="bg-destructive text-destructive-foreground"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ToolStatus;
