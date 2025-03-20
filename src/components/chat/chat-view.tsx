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
import { motion, AnimatePresence } from "framer-motion";
import { WelcomeView } from "@/components/chat/chat-welcome";
import { v4 as uuidv4 } from "uuid";

export function ChatView({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const [customPrompt, setCustomPrompt] = React.useState(""); // 状态管理预设 prompt

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
    generateId: uuidv4,
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1],
        id,
      };
    },
    experimental_streamData: true, // Enable data streaming
  });

  // 监听 customPrompt 的变化，当它变化时更新输入框的值
  React.useEffect(() => {
    if (customPrompt) {
      // 使用 handleInputChange 手动更新输入值
      const event = {
        target: { value: customPrompt },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      handleInputChange(event);
    }
  }, [customPrompt, handleInputChange]);

  // 页面加载时自动聚焦到输入框
  React.useEffect(() => {
    const inputElement = document.querySelector("textarea");
    if (inputElement) {
      inputElement.focus();
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
    setCustomPrompt(""); // 发送后清空自定义 prompt
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
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-gray-50 dark:bg-zinc-900">
        {/* Chat Panel with Animation */}
        <motion.div
          animate={{
            width: "100%",
            transition: { type: "spring", stiffness: 300, damping: 30 },
          }}
          className="flex flex-col h-full"
        >
          {/* Chat messages area */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {/* Added container with controlled width to ensure proper message layout */}
              <div className="px-4 py-4 mx-auto w-full max-w-[100%] md:max-w-[90%]">
                {error ? (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="flex items-center justify-between">
                      <span>错误: {error.message}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reload()}
                        className="h-7 px-3"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        重试
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
                  <WelcomeView setPrompt={setCustomPrompt} />
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat input area */}
          <div className="border-t border-blue-100 dark:border-blue-900/30 bg-white dark:bg-zinc-800 p-4 shadow-md">
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
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
