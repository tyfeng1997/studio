import { anthropic } from "@ai-sdk/anthropic";
import { getToolsConfig } from "@/lib/tools";
import {
  streamText,
  appendClientMessage,
  createIdGenerator,
  appendResponseMessages,
  experimental_createMCPClient,
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
    model: anthropic("claude-3-7-sonnet-20250219"),
    messages,
    tools: { ...tools, ...toolsConfig },
    experimental_generateMessageId: createIdGenerator({
      prefix: "msgs",
      size: 16,
    }),
    maxSteps: 20,
    async onFinish({ response }) {
      // 保存聊天记录
      await saveChat({
        id,
        messages: appendResponseMessages({
          messages,
          responseMessages: response.messages,
        }),
      });
    },
    onError: (error) => {
      console.log(error);
    },
  });
  return result.toDataStreamResponse();
}
