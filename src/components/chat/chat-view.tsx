"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ChatView({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const {
    messages,
    setMessages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    error,
    reload,
    data,
    status,
  } = useChat({
    maxSteps: 20,
    id,
    initialMessages,
    sendExtraMessageFields: true,
    onMessage: (message) => {
      console.log("New message received:", message);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log("Finished streaming message:", message);
    },
    onError: (error) => {
      console.error("An error occurred:", error);
    },
    onResponse: (response) => {
      console.log("Received HTTP response from server:", response);
    },
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1],
        id,
      };
    },
    experimental_streamData: true, // Enable data streaming
  });

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
  };

  const handleDeleteMessage = (messageId: string) => {
    // Delete message
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );
  };

  // Handle regenerating the last message
  const handleReload = () => {
    // Call reload function to regenerate the last message
    if (status === "ready" || status === "error") {
      // Call regeneration
      reload();
    }
  };

  return (
    <TooltipProvider>
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main chat area */}
          <div className="w-full" ref={chatContainerRef}>
            <ScrollArea className="flex-1 px-4 h-full">
              <div className="pt-4 pb-4">
                {error ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="flex items-center justify-between">
                      <span>Error: {error.message}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reload()}
                        className="h-7 px-3"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isLastAssistantMessage =
                      message.role === "assistant" &&
                      messages.findIndex(
                        (m, idx) => idx > index && m.role === "assistant"
                      ) === -1;

                    return (
                      <div key={message.id} className="group relative">
                        <ChatMessage
                          message={message}
                          isLoading={
                            isLoading &&
                            messages[messages.length - 1].id === message.id
                          }
                          onReload={handleReload}
                          isLastMessage={isLastAssistantMessage}
                          status={status}
                          onDelete={() => handleDeleteMessage(message.id)}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    开始一个对话吧
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Bottom input area */}
        <div className="border-t bg-background p-4 mt-auto">
          <div className="mx-auto max-w-5xl relative">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleFormSubmit}
              isLoading={isLoading}
              files={files}
              setFiles={setFiles}
              stop={stop}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

// Helper function for conditional class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
