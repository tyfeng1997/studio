// types/tools.ts
export type ToolStatusContent = {
  tool: string;
  content: {
    params?: Record<string, any>; // 工具执行时的参数
    result?: Record<string, any>; // 工具执行的结果
    error?: string; // 错误信息
    timestamp: string;
  };
};
