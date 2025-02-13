"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatView() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ maxSteps: 10 });

  return (
    <div className="relative min-h-screen">
      <ScrollArea className="h-[calc(100vh-10rem)] px-4">
        <div className="relative mx-auto max-w-4xl pt-4 pb-[8rem]">
          {messages.length > 0 ? (
            messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2 py-20">
              <p className="text-lg text-muted-foreground">
                Start a conversation with the AI assistant.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-background to-background/0 h-40">
        <div className="mx-auto max-w-4xl p-4">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
