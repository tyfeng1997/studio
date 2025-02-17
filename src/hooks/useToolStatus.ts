// hooks/useToolStatus.ts
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

const initialState: ToolState = {
  status: "idle",
  currentTool: null,
  progress: 0,
  message: "",
  activities: [],
};

function toolReducer(state: ToolState, action: ToolAction): ToolState {
  switch (action.type) {
    case "tool-status":
      const { tool, status, message, timestamp, metadata } = action.content;

      if (!tool || !status || !message) return state;

      return {
        ...state,
        status: status as ToolState["status"],
        currentTool: tool,
        message,
        activities: [
          ...state.activities,
          {
            id: generateId(),
            tool,
            status: status as "started" | "completed" | "error",
            message,
            timestamp: timestamp || new Date().toISOString(),
            metadata,
          },
        ],
      };

    case "progress-init":
      return {
        ...state,
        progress: 0,
      };

    case "chat-status":
      if (action.content.status === "completed") {
        return {
          ...state,
          status: "completed",
          message: action.content.message || "Completed",
        };
      }
      return state;

    default:
      return state;
  }
}

export function useToolStatus(data: JSONValue[] | undefined) {
  const [state, dispatch] = useReducer(toolReducer, initialState);

  useEffect(() => {
    if (!data?.length) return;

    // 处理最新的数据项
    const latestData = data[data.length - 1];
    if (typeof latestData === "object" && latestData !== null) {
      dispatch(latestData as ToolAction);
    }
  }, [data]);

  return state;
}
