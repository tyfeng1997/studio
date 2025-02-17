"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2 } from "lucide-react";
import { ToolStatus } from "@/components/tool-status";
export function ChatView({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
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
  } = useChat({
    maxSteps: 10,
    id,
    initialMessages,
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    experimental_prepareRequestBody({ messages, id }) {
      return { message: messages[messages.length - 1], id };
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log("Finished streaming message:", message);
      console.log("Token usage:", usage);
      console.log("Finish reason:", finishReason);
    },
    onError: (error) => {
      console.error("An error occurred:", error);
    },
    onResponse: (response) => {
      console.log("Received HTTP response from server:", response);
    },
  });
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const [hasToolStatus, setHasToolStatus] = React.useState(false);
  React.useEffect(() => {
    if (data && data.length > 0) {
      const latestData = data[data.length - 1];
      if (
        latestData.type === "chat-status" &&
        latestData.content.status === "completed"
      ) {
        setHasToolStatus(false);
      } else {
        setHasToolStatus(true);
      }
    }
  }, [data]);
  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );
  };
  return (
    <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex justify-center overflow-hidden">
        {/* 聊天区域 - 动态宽度 */}
        <div
          className={`flex flex-col ${
            hasToolStatus ? "w-4/5" : "w-full"
          } max-w-5xl transition-all duration-300`}
        >
          <ScrollArea className="flex-1 px-4">
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
                messages.map((message) => (
                  <div key={message.id} className="group relative">
                    <ChatMessage message={message} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteMessage(message.id)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      <span className="sr-only">Delete message</span>
                    </Button>
                  </div>
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
        </div>

        {/* 工具状态区域 - 条件渲染和固定宽度 */}
        {hasToolStatus && (
          <div className="w-1/5 min-w-[250px] max-w-[300px] border-l border-border">
            <div className="sticky top-0 p-4">
              <ToolStatus data={data || []} />
            </div>
          </div>
        )}
      </div>

      {/* 输入框区域 - 固定在底部 */}
      <div className="border-t bg-background p-4 mt-auto">
        <div
          className={`mx-auto ${
            hasToolStatus ? "w-4/5" : "w-full"
          } max-w-5xl transition-all duration-300`}
        >
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
  );
}
