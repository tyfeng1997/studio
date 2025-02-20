"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { WelcomeView } from "@/components/welcome";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, X } from "lucide-react";
import { ToolStatus } from "@/components/tool-status";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ChatView({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<string>("");
  const [workspaces, setWorkspaces] = React.useState<
    Array<{ workspace: string; document_count: number }>
  >([]);
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const [showToolStatus, setShowToolStatus] = React.useState(false); // 改为手动控制显示状态

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
    maxSteps: 20,
    id,
    initialMessages,
    sendExtraMessageFields: true,
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
    generateId: createIdGenerator({
      prefix: "msgc",
      size: 16,
    }),
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1],
        id,
        workspace: selectedWorkspace,
      };
    },
  });

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  };

  React.useEffect(() => {
    fetchWorkspaces();
  }, []);

  // 修改这个 useEffect
  React.useEffect(() => {
    if (data && data.length > 0 && !showToolStatus) {
      const hasToolData = data.some((item) => item.tool);
      if (hasToolData) {
        setShowToolStatus(true);
      }
    }
  }, [data, showToolStatus]);

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

  const handleWorkspaceChange = (workspace: string) => {
    setSelectedWorkspace(workspace);
  };

  const handleWorkspaceCreated = () => {
    fetchWorkspaces();
  };

  return (
    <TooltipProvider>
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex justify-center overflow-hidden">
          <div
            className={`flex flex-col ${
              showToolStatus ? "w-4/5" : "w-full"
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
                  <WelcomeView
                    workspaces={workspaces}
                    onWorkspaceSelect={handleWorkspaceChange}
                    onWorkspaceCreated={handleWorkspaceCreated}
                  />
                )}
              </div>
            </ScrollArea>
          </div>

          {showToolStatus && (
            <div className="w-1/5 min-w-[250px] max-w-[300px] border-l border-border flex flex-col h-full">
              <div className="flex-1 overflow-hidden">
                {" "}
                {/* 修改这里 */}
                <ToolStatus data={data || []} />
              </div>
            </div>
          )}
        </div>

        <div className="border-t bg-background p-4 mt-auto">
          <div
            className={`mx-auto ${
              showToolStatus ? "w-4/5" : "w-full"
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
              selectedWorkspace={selectedWorkspace}
              onWorkspaceChange={handleWorkspaceChange}
              workspaces={workspaces}
            />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
