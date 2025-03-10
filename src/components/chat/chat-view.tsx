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
  PanelRight,
  ChevronRight,
  Maximize2,
  Minimize2,
  ArrowRight,
} from "lucide-react";
import { ToolStatus } from "@/components/tool-status";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ArtifactManager } from "@/components/artifact-manager";
import { getArtifactType } from "@/components/artifact-manager";
import { AnimatePresence, motion } from "framer-motion";

// 辅助函数：从内容中检测代码块
const detectCodeLanguage = (codeBlock) => {
  const match = codeBlock.match(/```(\w+)/);
  return match ? match[1] : "plaintext";
};

// 辅助函数：从内容中提取代码
const extractCodeFromBlock = (codeBlock) => {
  return codeBlock
    .replace(/```(\w+)?\n/, "") // 移除开头的 ```language
    .replace(/```$/, ""); // 移除结尾的 ```
};

// 检测是否包含代码块
const containsCodeBlock = (content) => {
  return /```[\s\S]*?```/.test(content);
};

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
  const [showToolStatus, setShowToolStatus] = React.useState(false);
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
  const [isFloatingPanel, setIsFloatingPanel] = React.useState(true);

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
    experimental_onFunctionCall: () => {
      // 当调用函数时，暂停artifact生成
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

  // 检查工具数据，显示工具状态面板
  React.useEffect(() => {
    if (data && data.length > 0 && !showToolStatus) {
      const hasToolData = data.some(
        (item) => typeof item === "object" && item !== null && "tool" in item
      );

      if (hasToolData) {
        setShowToolStatus(true);
      }
    }
  }, [data, showToolStatus]);

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

    // 可以添加滚动到指定artifact的逻辑
  };

  const handleToggleTools = () => {
    setShowToolStatus((prev) => !prev);
    if (!showToolStatus) {
      setShowArtifacts(false);
    }
  };

  const handleToggleArtifacts = () => {
    setShowArtifacts((prev) => !prev);
    if (!showArtifacts) {
      setShowToolStatus(false);
    }
  };

  const handleToggleExpanded = () => {
    setExpandedView((prev) => !prev);
  };

  const handleToggleFloating = () => {
    setIsFloatingPanel((prev) => !prev);
  };

  // 获取特定消息的pending artifacts
  const getPendingArtifactsForMessage = (messageId: string) => {
    return pendingArtifacts.filter((p) => p.messageId === messageId);
  };

  // 计算主聊天区域的样式
  const mainChatAreaStyle = React.useMemo(() => {
    if (!showArtifacts && !showToolStatus) {
      return "w-full max-w-5xl mx-auto";
    }

    if (isFloatingPanel) {
      return "w-full max-w-5xl mx-auto";
    }

    return cn("transition-all duration-300", "w-3/5 max-w-3xl");
  }, [showArtifacts, showToolStatus, isFloatingPanel]);

  // 悬浮面板样式
  const floatingPanelStyle = React.useMemo(() => {
    if (!isFloatingPanel) return {};

    return {
      position: "absolute",
      right: "1rem",
      top: "1rem",
      bottom: "5rem",
      width: expandedView ? "45%" : "35%",
      maxWidth: "600px",
      minWidth: "380px",
      zIndex: 50,
      borderRadius: "0.75rem",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
    };
  }, [isFloatingPanel, expandedView]);

  return (
    <TooltipProvider>
      <div className="relative flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex-1 flex justify-center overflow-hidden relative">
          {/* Main chat area */}
          <div className={mainChatAreaStyle}>
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

          {/* Right sidebar or floating panel for tools/artifacts */}
          <AnimatePresence>
            {(showToolStatus || showArtifacts) && (
              <motion.div
                initial={
                  isFloatingPanel
                    ? { opacity: 0, scale: 0.95, x: 20 }
                    : { width: 0, opacity: 0 }
                }
                animate={
                  isFloatingPanel
                    ? { opacity: 1, scale: 1, x: 0 }
                    : {
                        width: "40%",
                        opacity: 1,
                        minWidth: "380px",
                        maxWidth: expandedView ? "600px" : "500px",
                      }
                }
                exit={
                  isFloatingPanel
                    ? { opacity: 0, scale: 0.95, x: 20 }
                    : { width: 0, opacity: 0 }
                }
                transition={{ duration: 0.3 }}
                style={floatingPanelStyle}
                className={cn(
                  "flex flex-col",
                  isFloatingPanel
                    ? "bg-background border border-border"
                    : "border-l border-border h-full"
                )}
              >
                {/* 面板标题和控制按钮 */}
                <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-background z-10 rounded-t-lg">
                  <span className="text-sm font-medium">
                    {showToolStatus ? "Tool Status" : "Artifacts"}
                    {showArtifacts &&
                      artifacts.length > 0 &&
                      ` (${artifacts.length})`}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleToggleFloating}
                      title={isFloatingPanel ? "Dock panel" : "Float panel"}
                    >
                      {isFloatingPanel ? (
                        <ArrowRight className="h-4 w-4" />
                      ) : (
                        <Maximize2 className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleToggleExpanded}
                      title={expandedView ? "Collapse" : "Expand"}
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
                      className="h-8 w-8"
                      onClick={
                        showToolStatus
                          ? handleToggleTools
                          : handleToggleArtifacts
                      }
                      title="Close"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* 面板内容 */}
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
            className={cn("mx-auto transition-all duration-300", "max-w-5xl")}
          >
            <div className="flex gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleTools}
                className={cn("h-8", showToolStatus && "bg-muted")}
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 mr-1.5 transition-transform",
                    showToolStatus && "rotate-90"
                  )}
                />
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

// Helper function for conditional class names
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}
