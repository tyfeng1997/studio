import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
const OrderParams = z.object({
  name: z.string().describe("name 用户的名字，用于创建机票订单。"),
  from: z.string().describe("from 用户从哪里出发，比如shanghai，北京 "),
  to: z.string().describe("to 用户的目的地，比如shanghai，等等城市"),
});

export const orderTool: ToolDefinition<typeof OrderParams> = {
  name: "order",
  description:
    "根据用户的名字，出发和目的地，为用户创建机票订单，创建成功会执行UI，由用户自主决定是否付款，你只需要按照要求创建订单",
  parameters: OrderParams,
  execute: async ({ name, from, to }): Promise<ToolExecuteResult> => {
    try {
      // 模拟可能的 API 调用错误
      if (!name.trim()) {
        throw new Error("Location cannot be empty");
      }
      return {
        success: true,
        data: {
          name,
          from,
          to,
        },
      };
    } catch (error) {
      console.error(`Order tool error:`, error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create order ",
      };
    }
  },
};
