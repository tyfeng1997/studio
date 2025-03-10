"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Trash2, X, PanelRight } from "lucide-react";
import { ToolStatus } from "@/components/tool-status";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArtifactManager } from "@/components/artifact-manager";
import { getArtifactType } from "@/components/artifact-manager";
import { AnimatePresence, motion } from "framer-motion";

// Define artifact type
interface Artifact {
  id: string;
  title: string;
  type: "code" | "markdown" | "image" | "file";
  content: string;
  language?: string;
  url?: string;
  createdAt: Date;
}

// Define pending artifact type
interface PendingArtifact {
  id: string;
  type: "text" | "code" | "image" | "markdown" | "file";
  status: "generating" | "complete";
  messageId: string;
}

export function ChatView({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const [files, setFiles] = React.useState<FileList | undefined>(undefined);
  const [showToolStatus, setShowToolStatus] = React.useState(false);
  const [showArtifacts, setShowArtifacts] = React.useState(false);
  const [expandedView, setExpandedView] = React.useState(false);
  const [artifacts, setArtifacts] = React.useState<Artifact[]>([]);
  const [pendingArtifacts, setPendingArtifacts] = React.useState<
    PendingArtifact[]
  >([]);

  // Helper function to extract code from markdown content
  const extractCodeFromMarkdown = (
    content: string
  ): { code: string; language: string } => {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/;
    const match = content.match(codeBlockRegex);

    if (match) {
      return {
        language: match[1] || "plaintext",
        code: match[2],
      };
    }
    return { code: "", language: "plaintext" };
  };

  // Helper function to detect programming language
  const detectLanguage = (content: string): string => {
    const { language } = extractCodeFromMarkdown(content);
    return language;
  };

  // Helper function to extract content for artifacts
  const extractContentForArtifact = (content: string, type: string): string => {
    if (type === "code") {
      const { code } = extractCodeFromMarkdown(content);
      return code || content;
    }
    return content;
  };

  // Simulated function to detect artifacts in message content
  const detectArtifacts = (message: Message) => {
    // This is where you'd implement your detection logic
    // For demo purposes, we'll simulate detection of code blocks
    if (!message.content) return [];

    const detectedArtifacts: PendingArtifact[] = [];

    // Code block detection
    if (message.content.includes("```")) {
      detectedArtifacts.push({
        id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "code",
        status: "generating",
        messageId: message.id,
      });
    }

    // Long markdown content detection
    else if (message.content.length > 500 || message.content.includes("#")) {
      detectedArtifacts.push({
        id: `artifact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "markdown",
        status: "generating",
        messageId: message.id,
      });
    }

    return detectedArtifacts;
  };

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

      // Detect and generate artifacts
      const newPendingArtifacts = detectArtifacts(message);
      if (newPendingArtifacts.length > 0) {
        setPendingArtifacts((prev) => [...prev, ...newPendingArtifacts]);
        setShowArtifacts(true);

        // Simulate completion after a delay
        setTimeout(() => {
          // Convert pending artifacts to completed ones
          const completedArtifacts = newPendingArtifacts.map((pending) => ({
            id: pending.id,
            title:
              pending.type === "code" ? "Generated Code" : "Generated Content",
            type: pending.type === "text" ? "markdown" : pending.type,
            content: extractContentForArtifact(message.content, pending.type),
            language:
              pending.type === "code"
                ? detectLanguage(message.content)
                : undefined,
            createdAt: new Date(),
          }));

          // Add completed artifacts
          setArtifacts((prev) => [...prev, ...completedArtifacts]);

          // Remove from pending
          setPendingArtifacts((prev) =>
            prev.filter((p) => !newPendingArtifacts.some((n) => n.id === p.id))
          );
        }, 2000); // Simulate processing time
      }
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
  });

  // Check for tool data and show tool status panel if needed
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
    // Also clean up any pending artifacts associated with this message
    setPendingArtifacts((prev) =>
      prev.filter((p) => p.messageId !== messageId)
    );
  };

  const handleShowArtifact = (artifactId: string) => {
    setShowArtifacts(true);
    // Could also scroll to the specific artifact or highlight it
  };

  const handleToggleTools = () => {
    setShowToolStatus((prev) => !prev);
  };

  const handleToggleArtifacts = () => {
    setShowArtifacts((prev) => !prev);
  };

  const handleToggleExpanded = () => {
    setExpandedView((prev) => !prev);
  };

  // Get pending artifacts for a specific message
  const getPendingArtifactsForMessage = (messageId: string) => {
    return pendingArtifacts.filter((p) => p.messageId === messageId);
  };

  return (
    <TooltipProvider>
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex justify-center overflow-hidden">
          {/* Main chat area */}
          <div
            className={cn(
              "flex flex-col transition-all duration-300",
              showToolStatus || showArtifacts ? "w-4/5" : "w-full",
              expandedView ? "max-w-full" : "max-w-5xl"
            )}
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
                      <ChatMessage
                        message={message}
                        isLoading={
                          isLoading &&
                          messages[messages.length - 1].id === message.id
                        }
                        onShowArtifact={handleShowArtifact}
                        pendingArtifacts={getPendingArtifactsForMessage(
                          message.id
                        )}
                      />
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
                  <div className="text-center py-8 text-muted-foreground">
                    Start a conversation by sending a message
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right sidebar for tools/artifacts */}
          <AnimatePresence>
            {(showToolStatus || showArtifacts) && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{
                  width: "20%",
                  opacity: 1,
                  minWidth: "250px",
                  maxWidth: "300px",
                }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="border-l border-border flex flex-col h-full"
              >
                <div className="flex-1 overflow-hidden">
                  {showToolStatus && !showArtifacts && (
                    <ToolStatus data={data || []} />
                  )}

                  {showArtifacts && (
                    <ArtifactManager
                      artifacts={artifacts}
                      onClose={() => setShowArtifacts(false)}
                      onExpand={handleToggleExpanded}
                      expanded={expandedView}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom input area */}
        <div className="border-t bg-background p-4 mt-auto">
          <div
            className={cn(
              "mx-auto transition-all duration-300",
              showToolStatus || showArtifacts ? "w-4/5" : "w-full",
              expandedView ? "max-w-full" : "max-w-5xl"
            )}
          >
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleTools}
                className={cn("h-8", showToolStatus && "bg-muted")}
              >
                Tool Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleArtifacts}
                className={cn("h-8", showArtifacts && "bg-muted")}
              >
                <PanelRight className="h-4 w-4 mr-1.5" />
                Artifacts
                {artifacts.length > 0 && (
                  <span className="ml-1.5 bg-primary/20 text-primary text-xs rounded-full px-1.5">
                    {artifacts.length}
                  </span>
                )}
              </Button>
            </div>

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

// // Helper function for conditional class names
// function cn(...classes: any[]) {
//   return classes.filter(Boolean).join(' ');
// }
