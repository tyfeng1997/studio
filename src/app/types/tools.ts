import { z } from "zod";

export interface ToolDefinition<T extends z.ZodType> {
  name: string;
  description: string;
  parameters: T;
  execute: (params: z.infer<T>) => Promise<ToolExecuteResult>;
}

export interface ToolExecuteResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface ToolResult {
  tool: string;
  data: any;
  error?: string;
}
