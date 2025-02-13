"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import { ToolResultRenderer } from "@/components/tools/tool-result-renderer";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start md:mb-6",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-4 rounded-lg px-4 py-3",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          "shadow-md"
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.toolInvocations?.map((tool) => (
          <ToolResultRenderer
            key={`${tool.toolCallId}`}
            tool={tool.toolName}
            data={tool.result}
            error={tool.error}
          />
        ))}
      </div>
    </div>
  );
}

/*
{
    "state": "result",
    "step": 0,
    "toolCallId": "toolu_012rvPkf2AjW5cKVZjXYorVA",
    "toolName": "weather",
    "args": {
      "location": "Kyoto"
    },
    "result": {
      "location": "Kyoto",
      "temperature": 80
    }
  },

*/
