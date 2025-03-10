"use client";

import * as React from "react";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Message, useChat } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  ArrowRight,
  Layers,
} from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArtifactManager } from "@/components/artifact-manager";
import { AnimatePresence, motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 检测是否为长/复杂Markdown
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
  messageId: string; // 关联到的消息ID
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
  const [isHovering, setIsHovering] = React.useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // 检测消息流中的特殊内容模式
  const analyzeMessageChunk = (messageId, chunk, existingContent) => {
    const updatedContent = existingContent + chunk;

    // 检测代码块的开始
    const codeBlockStartMatch = chunk.match(/```(\w*)\n?/);
    if (
      codeBlockStartMatch &&
      !pendingArtifacts.some(
        (a) => a.messageId === messageId && a.type === "code"
      )
    ) {
      // 找到了代码块的开始，创建一个新的代码artifact
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

      // 开始追踪代码块
      setStreamedChunks((prev) => ({
        ...prev,
        [artifactId]: codeBlockStartMatch[0],
      }));

      setShowArtifacts(true);
      return artifactId;
    }

    // 检测长文本或复杂markdown
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

      // 开始追踪markdown内容
      setStreamedChunks((prev) => ({
        ...prev,
        [artifactId]: updatedContent,
      }));

      setShowArtifacts(true);
      return artifactId;
    }

    return null;
  };

  // 更新流式内容
  const updateStreamedContent = (artifactId, chunk) => {
    setStreamedChunks((prev) => ({
      ...prev,
      [artifactId]: (prev[artifactId] || "") + chunk,
    }));
  };

  // 完成artifact生成
  const finalizeArtifact = (artifactId, messageId, fullContent) => {
    // 获取待处理的artifact
    const pendingArtifact = pendingArtifacts.find((a) => a.id === artifactId);
    if (!pendingArtifact) return;

    // 创建最终的artifact
    let title, content, language;

    if (pendingArtifact.type === "code") {
      // 解析代码块
      const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
      const matches = [...fullContent.matchAll(codeBlockRegex)];

      if (matches.length > 0) {
        // 找到第一个代码块
        const [_, lang, code] = matches[0];
        language = lang || "plaintext";
        content = code;
        title = `Generated ${
          language.charAt(0).toUpperCase() + language.slice(1)
        } Code`;
      } else {
        // 没找到完整代码块，使用已追踪的内容
        const trackedContent = streamedChunks[artifactId] || "";
        content = trackedContent.replace(/```(\w*)\n?/, "");
        language = "plaintext";
        title = "Generated Code";
      }
    } else {
      // Markdown内容
      content = fullContent;
      title = "Generated Content";
    }

    // 添加到artifacts
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

    // 从pending中移除
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
  } = useChat({
    maxSteps: 20,
    id,
    initialMessages,
    sendExtraMessageFields: true,
    onMessage: (message) => {
      // 当新消息开始时记录当前的消息ID
      setCurrentStreamingMessage(message.id);
    },
    onFinish: (message, { usage, finishReason }) => {
      console.log("Finished streaming message:", message);

      // 检查是否有待完成的artifacts
      const relatedArtifactIds = pendingArtifacts
        .filter((a) => a.messageId === message.id)
        .map((a) => a.id);

      // 完成所有相关的artifacts
      relatedArtifactIds.forEach((artifactId) => {
        finalizeArtifact(artifactId, message.id, message.content);
      });

      // 重置当前流式消息
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
    experimental_streamData: true, // 启用数据流
  });

  // 处理消息流，实时检测和创建artifacts
  React.useEffect(() => {
    if (!data || !data.length || !currentStreamingMessage) return;

    const latestChunk = data[data.length - 1];
    if (typeof latestChunk === "string") {
      // 获取当前消息的现有内容
      const existingMessage = messages.find(
        (m) => m.id === currentStreamingMessage
      );
      const existingContent = existingMessage?.content || "";

      // 分析新chunk，看是否需要创建artifact
      const artifactId = analyzeMessageChunk(
        currentStreamingMessage,
        latestChunk,
        existingContent
      );

      // 如果已经有相关的artifactId，更新内容
      if (!artifactId) {
        const existingArtifactId = messageArtifactMap[currentStreamingMessage];
        if (existingArtifactId) {
          updateStreamedContent(existingArtifactId, latestChunk);
        }
      }
    }
  }, [data, currentStreamingMessage, messages]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // 重置流状态
    setCurrentStreamingMessage(null);
    setStreamedChunks({});

    handleSubmit(e, {
      experimental_attachments: files,
    });
    setFiles(undefined);
  };

  const handleDeleteMessage = (messageId: string) => {
    // 删除消息相关的artifacts
    setArtifacts((prev) => prev.filter((a) => a.messageId !== messageId));

    // 删除消息
    setMessages((prevMessages) =>
      prevMessages.filter((msg) => msg.id !== messageId)
    );

    // 清理相关的映射
    setMessageArtifactMap((prev) => {
      const { [messageId]: _, ...rest } = prev;
      return rest;
    });

    // 清理相关的pending artifacts
    setPendingArtifacts((prev) =>
      prev.filter((p) => p.messageId !== messageId)
    );
  };

  // 创建或显示artifact
  const handleShowArtifact = (
    artifactId: string,
    content?: string,
    type?: string,
    language?: string
  ) => {
    setShowArtifacts(true);

    // 如果提供了内容，创建一个新的artifact
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
            messageId: artifactId.split("-")[1], // 从artifactId中提取messageId
          },
        ]);
      }
    }
  };

  const handleToggleArtifacts = () => {
    setShowArtifacts((prev) => !prev);
    if (!showArtifacts) {
      setIsHovering(true);
    }
  };

  const handleToggleExpanded = () => {
    setExpandedView((prev) => !prev);
  };

  // 处理悬浮按钮的鼠标事件
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // 如果悬浮时未显示Artifacts，则显示它
    if (!showArtifacts) {
      setShowArtifacts(true);
    }

    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovering(false);

      // 如果是通过悬浮打开的（没有点击固定），则关闭Artifacts
      if (!showArtifacts) {
        setShowArtifacts(false);
      }
    }, 300); // 略微延迟，避免过快关闭
  };

  // 获取特定消息的pending artifacts
  const getPendingArtifactsForMessage = (messageId: string) => {
    return pendingArtifacts.filter((p) => p.messageId === messageId);
  };

  return (
    <TooltipProvider>
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex justify-center overflow-hidden relative">
          {/* Main chat area */}
          <div className="w-full max-w-5xl mx-auto">
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
                        artifactIds={messageArtifactMap}
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

          {/* Floating Artifacts Panel - 调整高度更长 */}
          <AnimatePresence>
            {showArtifacts && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, x: 20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: 20 }}
                transition={{ duration: 0.3 }}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "0.5rem", // 调高上边距，使面板更长
                  bottom: "5rem",
                  width: expandedView ? "45%" : "35%",
                  maxWidth: "600px",
                  minWidth: "380px",
                  zIndex: 50,
                  borderRadius: "0.75rem",
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                }}
                className="bg-background border border-border flex flex-col"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Panel content */}
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
            />

            {/* Floating Artifacts Button */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-20 right-10 z-10" // 位置调整为右上方一点
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    className={`h-12 w-12 rounded-full shadow-lg ${
                      showArtifacts
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-card hover:bg-card/90 text-foreground border border-border"
                    }`}
                    onClick={handleToggleArtifacts}
                  >
                    <Layers className="h-5 w-5" />
                    {artifacts.length > 0 && !showArtifacts && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-medium border-2 border-background">
                        {artifacts.length}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  {showArtifacts ? "Hide Artifacts" : "Show Artifacts"}
                </TooltipContent>
              </Tooltip>
            </motion.div>
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
