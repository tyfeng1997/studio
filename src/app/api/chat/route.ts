import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import { deepseek } from "@ai-sdk/deepseek";

import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
  experimental_createMCPClient,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";

import { saveChat, loadChat } from "@/utils/store/chat-store";
export const maxDuration = 30;

let client = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: "http://localhost:3001/sse",
  },
});

export async function POST(req: Request) {
  const { message, id } = await req.json();
  const previousMessages = await loadChat(id);
  const toolsConfig = getToolsConfig();
  const messages = appendClientMessage({
    messages: previousMessages,
    message,
  });
  const tools = await client.tools();
  console.log("tools\n", tools);

  const result = streamText({
    // model: anthropic("claude-3-7-sonnet-20250219"),
    model: deepseek("deepseek-reasoner"),
    messages,
    // tools: { ...tools, ...toolsConfig },
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
