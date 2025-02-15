"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";

export function ChatView({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: Message[] } = {}) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      maxSteps: 10,
      id, // use the provided chat ID
      initialMessages, // initial messages if provided
      sendExtraMessageFields: true, // send id and createdAt for each message
      generateId: createIdGenerator({
        prefix: "msgc",
        size: 16,
      }),
      experimental_prepareRequestBody({ messages, id }) {
        return { message: messages[messages.length - 1], id };
      },
    });
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
