import React, { useReducer, useEffect } from "react";
import { ToolState, ToolEvent, ToolStatus } from "@/types/tool-state";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Database,
  Cog,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// 初始状态
const initialState: ToolState = {
  status: "idle",
  progress: 0,
  currentMessage: "",
  activities: [],
  sources: [],
};

// 状态机 reducer
function toolReducer(state: ToolState, event: ToolEvent): ToolState {
  switch (event.type) {
    case "progress-init":
      return {
        ...state,
        status: "initializing",
        progress: event.content.progress,
        currentMessage: event.content.message,
      };

    case "activity-delta":
      const newStatus = getStatusFromActivity(event.content.metadata?.phase);
      return {
        ...state,
        status: newStatus,
        progress: event.content.progress,
        currentMessage: event.content.message,
        activities: [
          ...state.activities,
          {
            id: crypto.randomUUID(),
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
        ...state,
        sources: [
          ...state.sources,
          {
            id: crypto.randomUUID(),
            url: event.content.metadata.url,
            title: event.content.metadata.title,
            confidence: event.content.metadata.confidence,
          },
        ],
      };

    case "finish":
      return {
        ...state,
        status: event.content.status === "complete" ? "finished" : "error",
        progress: event.content.progress,
        currentMessage: event.content.message,
        error:
          event.content.status === "error" ? event.content.message : undefined,
      };

    default:
      return state;
  }
}

// 辅助函数：根据活动阶段获取状态
function getStatusFromActivity(phase?: string): ToolStatus {
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
function getStatusIcon(status: ToolStatus) {
  switch (status) {
    case "searching":
      return <Search className="w-5 h-5 text-blue-500" />;
    case "extracting":
      return <Database className="w-5 h-5 text-purple-500" />;
    case "processing":
      return <Cog className="w-5 h-5 text-green-500" />;
    case "finished":
      return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    case "error":
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    default:
      return <Clock className="w-5 h-5 text-gray-500" />;
  }
}

export const ToolStatus = () => {
  const [state, dispatch] = useReducer(toolReducer, initialState);

  // 模拟工具执行过程
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

          // 解码和处理接收到的数据
          const text = new TextDecoder().decode(value);
          const events = text.split("\n\n").filter(Boolean);

          for (const event of events) {
            if (event.startsWith("data: ")) {
              const jsonStr = event.slice(6);
              const data = JSON.parse(jsonStr);
              dispatch(data);
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
      <Alert className="transition-colors duration-200">
        <div className="flex items-center space-x-2">
          {getStatusIcon(state.status)}
          <AlertTitle className="text-lg capitalize">{state.status}</AlertTitle>
        </div>
        <AlertDescription>
          <p className="mt-2">{state.currentMessage}</p>
          {/* 进度条 */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
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
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(getStatusFromActivity(activity.type))}
              <span className="font-medium">{activity.message}</span>
            </div>
            <div className="mt-2 text-sm text-gray-500">
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
              className="p-4 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <h3 className="font-medium">{source.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{source.url}</p>
              <div className="mt-2 text-sm">
                Confidence: {(source.confidence * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 错误显示 */}
      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ToolStatus;
