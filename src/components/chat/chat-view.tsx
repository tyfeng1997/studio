"use client";

import * as React from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function ChatView() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({ maxSteps: 10 });
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
      <ScrollArea className="flex-1 px-4">
        <div className="relative mx-auto max-w-3xl pt-4 pb-4">
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
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-3xl">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading}
            files={files}
            setFiles={setFiles}
          />
        </div>
      </div>
    </div>
  );
}
