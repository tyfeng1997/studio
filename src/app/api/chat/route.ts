import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
// 不使用的导入使用下划线前缀
import { _deepseek as deepseek } from "@ai-sdk/deepseek";

import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
  experimental_createMCPClient,
  // 不使用的导入使用下划线前缀
  _extractReasoningMiddleware as extractReasoningMiddleware,
  _wrapLanguageModel as wrapLanguageModel,
} from "ai";

import { saveChat, loadChat, updateChatTitle } from "@/utils/store/chat-store";
export const maxDuration = 30;

// 声明客户端变量并添加错误处理
let mcpClient = null;
try {
  mcpClient = await experimental_createMCPClient({
    transport: {
      type: "sse",
      url: "http://localhost:3001/sse",
    },
  });
  console.log("MCP client initialized successfully");
} catch (error) {
  console.warn("Failed to initialize MCP client:", error);
  // 在生产环境中不会阻止构建
}

export async function POST(req: Request) {
  const { message, id } = await req.json();
  const previousMessages = await loadChat(id);
  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });

  // If this is the first message in the chat, update the title
  if (previousMessages.length === 0) {
    try {
      await updateChatTitle(id, message.content);
    } catch (error) {
      console.warn("Failed to update chat title:", error);
      // Non-critical error, continue with the chat
    }
  }

  // 尝试获取工具，但处理可能的失败
  let tools = toolsConfig;
  try {
    if (mcpClient) {
      const mcpTools = await mcpClient.tools();
      console.log("MCP tools loaded:", mcpTools);
      tools = { ...mcpTools, ...toolsConfig };
    } else {
      console.log("Using only local tools configuration");
    }
  } catch (error) {
    console.warn("Failed to load MCP tools, using only local tools:", error);
  }

  const result = streamText({
    model: anthropic("claude-3-7-sonnet-20250219"),
    // model: deepseek("deepseek-reasoner"),
    messages,
    tools: tools,
    toolCallStreaming: true,
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
    maxSteps: 20,
    // Add reasoning configuration
    providerOptions: {
      anthropic: {
        thinking: { type: "enabled", budgetTokens: 12000 },
      },
    },
    async onFinish({ response }) {
      try {
        // Save the complete messages with all parts, reasoning, and tool results
        const updatedMessages = appendResponseMessages({
          messages,
          responseMessages: response.messages,
        });

        // Save chat with all information preserved
        await saveChat({
          id,
          messages: updatedMessages,
        });
      } catch (error) {
        console.error("Error saving chat:", error);
      }
    },
    onError: (error) => {
      console.log(error);
    },
  });

  result.consumeStream(); // no await
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}
