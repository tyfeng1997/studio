"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw, Layers, Maximize2, Minimize2, X } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArtifactManager } from "@/components/artifact-manager";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Check if it's long/complex Markdown
const isComplexMarkdown = (content) => {
  const headingCount = (content.match(/#/g) || []).length;
  return content.length > 800 || headingCount > 2;
};

// Define artifact type
interface Artifact {
  id: string;
  title: string;
  type: "code" | "markdown" | "image" | "file";
  content: string;
  language?: string;
  url?: string;
  createdAt: Date;
  messageId: string; // Associated message ID
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
  const [showArtifacts, setShowArtifacts] = React.useState(false);
  const [expandedView, setExpandedView] = React.useState(false);
  const [artifacts, setArtifacts] = React.useState<Artifact[]>([]);
  const [pendingArtifacts, setPendingArtifacts] = React.useState<
    PendingArtifact[]
  >([]);
  const [messageArtifactMap, setMessageArtifactMap] = React.useState<
    Record<string, string>
  >({});
  const [currentStreamingMessage, setCurrentStreamingMessage] = React.useState<
    string | null
  >(null);
  const [streamedChunks, setStreamedChunks] = React.useState<
    Record<string, string>
  >({});
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  // Analyze message chunk for special content patterns
  const analyzeMessageChunk = (messageId, chunk, existingContent) => {
    const updatedContent = existingContent + chunk;

    // Detect start of code block
    const codeBlockStartMatch = chunk.match(/```(\w*)\n?/);
    if (
      codeBlockStartMatch &&
      !pendingArtifacts.some(
        (a) => a.messageId === messageId && a.type === "code"
      )
    ) {
      // Found code block start, create a new code artifact
      const artifactId = `code-${messageId}-${Date.now()}`;

      setPendingArtifacts((prev) => [
        ...prev,
        {
          id: artifactId,
          type: "code",
          status: "generating",
          messageId,
        },
      ]);

      setMessageArtifactMap((prev) => ({
        ...prev,
        [messageId]: artifactId,
      }));

      // Start tracking code block
      setStreamedChunks((prev) => ({
        ...prev,
        [artifactId]: codeBlockStartMatch[0],
      }));

      setShowArtifacts(true);
      return artifactId;
    }

    // Detect long text or complex markdown
    if (
      isComplexMarkdown(updatedContent) &&
      !pendingArtifacts.some((a) => a.messageId === messageId)
    ) {
      const artifactId = `markdown-${messageId}`;

      setPendingArtifacts((prev) => [
        ...prev,
        {
          id: artifactId,
          type: "markdown",
          status: "generating",
          messageId,
        },
      ]);

      setMessageArtifactMap((prev) => ({
        ...prev,
        [messageId]: artifactId,
      }));

      // Start tracking markdown content
      setStreamedChunks((prev) => ({
        ...prev,
        [artifactId]: updatedContent,
      }));

      setShowArtifacts(true);
      return artifactId;
    }

    return null;
  };

  // Update streamed content
  const updateStreamedContent = (artifactId, chunk) => {
    setStreamedChunks((prev) => ({
      ...prev,
      [artifactId]: (prev[artifactId] || "") + chunk,
    }));
  };

  // Finalize artifact generation
  const finalizeArtifact = (artifactId, messageId, fullContent) => {
    // Get pending artifact
    const pendingArtifact = pendingArtifacts.find((a) => a.id === artifactId);
    if (!pendingArtifact) return;

    // Create final artifact
    let title, content, language;

    if (pendingArtifact.type === "code") {
      // Parse code block
      const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
      const matches = [...fullContent.matchAll(codeBlockRegex)];

      if (matches.length > 0) {
        // Find first code block
        const [_, lang, code] = matches[0];
        language = lang || "plaintext";
        content = code;
        title = `Generated ${
          language.charAt(0).toUpperCase() + language.slice(1)
        } Code`;
      } else {
        // No complete code block found, use tracked content
        const trackedContent = streamedChunks[artifactId] || "";
        content = trackedContent.replace(/```(\w*)\n?/, "");
        language = "plaintext";
        title = "Generated Code";
      }
    } else {
      // Markdown content
      content = fullContent;
      title = "Generated Content";
    }

    // Add to artifacts
    setArtifacts((prev) => [
      ...prev,
      {
        id: artifactId,
        title,
        type: pendingArtifact.type === "code" ? "code" : "markdown",
        content,
        language,
        createdAt: new Date(),
        messageId,
      },
    ]);

    // Remove from pending
    setPendingArtifacts((prev) => prev.filter((a) => a.id !== artifactId));
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
    status,
  } = useChat({
    maxSteps: 20,
    id,
    initialMessages,
    sendExtraMessageFields: true,
    onMessage: (message) => {
      // Record current message ID when a new message starts
      setCurrentStreamingMessage(message.id);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log("Finished streaming message:", message);

      // Check for pending artifacts
      const relatedArtifactIds = pendingArtifacts
        .filter((a) => a.messageId === message.id)
        .map((a) => a.id);

      // Complete all related artifacts
      relatedArtifactIds.forEach((artifactId) => {
        finalizeArtifact(artifactId, message.id, message.content);
      });

      // Reset current streaming message
      setCurrentStreamingMessage(null);
    },
    onError: (error) => {
      console.error("An error occurred:", error);
      setCurrentStreamingMessage(null);
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

  // Process message stream, detect and create artifacts in real-time
  React.useEffect(() => {
    if (!data || !data.length || !currentStreamingMessage) return;

    const latestChunk = data[data.length - 1];
    if (typeof latestChunk === "string") {
      // Get existing content for current message
      const existingMessage = messages.find(
        (m) => m.id === currentStreamingMessage
      );
      const existingContent = existingMessage?.content || "";

      // Analyze new chunk to see if we need to create an artifact
      const artifactId = analyzeMessageChunk(
        currentStreamingMessage,
        latestChunk,
        existingContent
      );

      // If there's already a related artifactId, update content
      if (!artifactId) {
        const existingArtifactId = messageArtifactMap[currentStreamingMessage];
        if (existingArtifactId) {
          updateStreamedContent(existingArtifactId, latestChunk);
        }
      }
    }
  }, [data, currentStreamingMessage, messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Reset stream state
    setCurrentStreamingMessage(null);
    setStreamedChunks({});

    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
  };

  const handleDeleteMessage = (messageId: string) => {
    // Delete message-related artifacts
    setArtifacts((prev) => prev.filter((a) => a.messageId !== messageId));

    // Delete message
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );

    // Clean up related mappings
    setMessageArtifactMap((prev) => {
      const { [messageId]: _, ...rest } = prev;
      return rest;
    });

    // Clean up related pending artifacts
    setPendingArtifacts((prev) =>
      prev.filter((p) => p.messageId !== messageId)
    );
  };

  // Handle regenerating the last message
  const handleReload = () => {
    // Call reload function to regenerate the last message
    if (status === "ready" || status === "error") {
      // Reset any artifacts related to the last assistant message
      const lastAssistantMessage = [...messages]
        .reverse()
        .find((m) => m.role === "assistant");
      if (lastAssistantMessage) {
        // Delete artifacts related to the last assistant message
        setArtifacts((prev) =>
          prev.filter((a) => a.messageId !== lastAssistantMessage.id)
        );

        // Reset artifact mapping
        setMessageArtifactMap((prev) => {
          const { [lastAssistantMessage.id]: _, ...rest } = prev;
          return rest;
        });

        // Clean up related pending artifacts
        setPendingArtifacts((prev) =>
          prev.filter((p) => p.messageId !== lastAssistantMessage.id)
        );
      }

      // Call regeneration
      reload();
    }
  };

  // Create or show artifact
  const handleShowArtifact = (
    artifactId: string,
    content?: string,
    type?: string,
    language?: string
  ) => {
    setShowArtifacts(true);

    // If content is provided, create a new artifact
    if (content && type) {
      const existingArtifact = artifacts.find((a) => a.id === artifactId);

      if (!existingArtifact) {
        setArtifacts((prev) => [
          ...prev,
          {
            id: artifactId,
            title:
              type === "code"
                ? `Generated ${
                    language?.charAt(0).toUpperCase() + language?.slice(1) ||
                    "Code"
                  }`
                : "Generated Content",
            type: type as "code" | "markdown" | "image" | "file",
            content,
            language,
            createdAt: new Date(),
            messageId: artifactId.split("-")[1], // Extract messageId from artifactId
          },
        ]);
      }
    }
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
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main chat area - resized based on artifacts visibility */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              showArtifacts ? "w-full md:w-[60%] lg:w-[65%]" : "w-full"
            }`}
            ref={chatContainerRef}
          >
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
                          onShowArtifact={handleShowArtifact}
                          pendingArtifacts={getPendingArtifactsForMessage(
                            message.id
                          )}
                          artifactIds={messageArtifactMap}
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

          {/* Side-by-side Artifacts Panel */}
          <AnimatePresence>
            {showArtifacts && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "40%" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="hidden md:flex h-full flex-col border-l border-border bg-card overflow-hidden"
              >
                {/* Panel content */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between p-2 border-b">
                    <h3 className="font-medium">Artifacts</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleExpanded}
                      >
                        {expandedView ? (
                          <Minimize2 className="h-4 w-4" />
                        ) : (
                          <Maximize2 className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleArtifacts}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <ArtifactManager
                    artifacts={artifacts}
                    onClose={() => setShowArtifacts(false)}
                    onExpand={handleToggleExpanded}
                    expanded={expandedView}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Artifacts Panel - full screen on small devices */}
          <AnimatePresence>
            {showArtifacts && (
              <motion.div
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{ duration: 0.3 }}
                className="md:hidden fixed inset-0 z-50 bg-background flex flex-col"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="font-medium">Artifacts</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleArtifacts}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ArtifactManager
                    artifacts={artifacts}
                    onClose={() => setShowArtifacts(false)}
                    onExpand={handleToggleExpanded}
                    expanded={expandedView}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              showArtifacts={showArtifacts}
              toggleArtifacts={handleToggleArtifacts}
              artifactsCount={artifacts.length}
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
