// types/tool-state.ts
export type ToolStatus =
  | "idle"
  | "initializing"
  | "searching"
  | "extracting"
  | "processing"
  | "finished"
  | "error";

export type Activity = {
  id: string;
  type: "search" | "extract" | "process";
  status: "pending" | "complete" | "error";
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
};

export type Source = {
  id: string;
  url: string;
  title: string;
  confidence: number;
};

export type ToolState = {
  status: ToolStatus;
  progress: number;
  currentMessage: string;
  activities: Activity[];
  sources: Source[];
  error?: string;
};

export type ToolEvent =
  | { type: "progress-init"; content: { message: string; progress: number } }
  | {
      type: "activity-delta";
      content: {
        status: "pending" | "complete" | "error";
        message: string;
        progress: number;
        metadata?: Record<string, any>;
        timestamp: string;
      };
    }
  | {
      type: "source-delta";
      content: {
        message: string;
        metadata: { url: string; title: string; confidence: number };
      };
    }
  | {
      type: "finish";
      content: {
        status: "complete" | "error";
        message: string;
        progress: number;
        metadata?: Record<string, any>;
      };
    };
