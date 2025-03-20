"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, FileText, Loader2, ArrowLeft, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// 从流式消息中提取报告内容
function extractStreamingReport(messages: Message[]): string {
  const lastMsg = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string");
  if (!lastMsg) return "";
  let content = lastMsg.content;
  if (content.startsWith("<report>")) {
    content = content.substring(8);
  }
  if (content.endsWith("</report>")) {
    content = content.substring(0, content.length - 9);
  }
  return content;
}

export default function SimplifiedReportsPage() {
  const router = useRouter();

  // 创建报告相关状态
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<"quick" | "detailed">("quick");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId] = useState(uuidv4());
  const [reportSaved, setReportSaved] = useState(false);

  // 初始化聊天客户端
  const {
    messages,
    handleInputChange,
    handleSubmit,
    isLoading,
    input: chatInput,
    setInput: setChatInput,
  } = useChat({
    api: "/api/report",
    id: reportId,
    maxSteps: 20,
    generateId: createIdGenerator({ prefix: "report", size: 16 }),
    experimental_prepareRequestBody({ messages, id }) {
      return {
        message: messages[messages.length - 1],
        id,
        mode: activeMode,
      };
    },
    experimental_streamData: true,
  });

  // 处理输入变化
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // 开始生成报告
  const startResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsGenerating(true);
    setReportSaved(false);

    const modePrompt =
      activeMode === "quick"
        ? "Generate a quick summary report about this company: "
        : "Generate a detailed analysis report about this company: ";

    setChatInput(modePrompt + input);
    handleSubmit(e);
  };

  // 处理报告内容的流式传输
  const [reportContent, setReportContent] = useState("");
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const content = extractStreamingReport(messages);
    setReportContent(content);

    // 只在有内容且正在加载时显示加载指示器
    setShowLoader(isLoading && content.length > 0);

    if (!isLoading && content && content.length > 50 && isGenerating) {
      setIsGenerating(false);
    }
  }, [messages, isLoading, isGenerating]);

  // 渲染工具调用状态
  const renderToolInvocation = (part: any) => {
    switch (part.toolInvocation.state) {
      case "partial-call":
        return (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-800 rounded-md p-3 my-2 border border-zinc-700 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                准备工具: {part.toolInvocation.toolName}
              </span>
            </div>
            <div className="text-sm text-zinc-400 overflow-x-auto">
              {part.toolInvocation.args ? (
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              ) : (
                <span className="italic">收集参数中...</span>
              )}
            </div>
          </motion.div>
        );

      case "call":
        return (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="bg-blue-950/30 rounded-md p-3 my-2 border border-blue-900 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                执行工具: {part.toolInvocation.toolName}
              </span>
            </div>
            {part.toolInvocation.args && (
              <div className="text-sm text-zinc-300 mb-2 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-zinc-400">
                工具调用中，请稍候...
              </span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-150"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse delay-300"></div>
              </div>
            </div>
          </motion.div>
        );

      case "result":
        return (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="my-2 break-words whitespace-pre-wrap"
          >
            <ToolResultRenderer
              tool={part.toolInvocation.toolName}
              data={part.toolInvocation.result}
              error={part.toolInvocation.error}
            />
          </motion.div>
        );

      default:
        return null;
    }
  };

  // 打字机动画
  const TypingIndicator = () => (
    <div className="flex items-center gap-1 py-2 px-4">
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.2 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.4 }}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-950">
      {/* Header - Fixed at the top */}
      <header className="border-b border-zinc-800 p-4 bg-zinc-950 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-semibold text-white">
              Company Reports
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Button>
        </div>
      </header>

      {/* Main Content - Takes the rest of the screen height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Input Area - Centered */}
        <form
          onSubmit={startResearch}
          className={cn(
            "p-4 flex items-center justify-center transition-all duration-300",
            reportContent ? "h-16" : "h-32"
          )}
        >
          <div className="relative w-full max-w-3xl">
            <input
              type="text"
              value={input}
              onChange={handleQueryChange}
              placeholder="Enter company name or research topic..."
              className="w-full h-12 px-4 py-2 bg-zinc-900 border border-zinc-700 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
              <div className="flex border-r border-zinc-700 pr-2">
                <Button
                  type="button"
                  variant={activeMode === "quick" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveMode("quick")}
                >
                  <Zap className="h-4 w-4 mr-1" />
                  Quick
                </Button>
                <Button
                  type="button"
                  variant={activeMode === "detailed" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveMode("detailed")}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Detailed
                </Button>
              </div>
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="rounded-full bg-purple-600 hover:bg-purple-700 h-8"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Research"
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Content Area - Flexible height */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {reportContent || isLoading ? (
              <>
                {/* Report Content */}
                <ScrollArea className="flex-1">
                  <div className="max-w-4xl mx-auto p-6">
                    <div className="prose prose-invert prose-zinc max-w-none">
                      {reportContent ? (
                        <div className="relative">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({
                                node,
                                inline,
                                className,
                                children,
                                ...props
                              }) {
                                const match = /language-(\w+)/.exec(
                                  className || ""
                                );
                                const codeContent = String(children).replace(
                                  /\n$/,
                                  ""
                                );
                                if (!inline && match) {
                                  return (
                                    <div className="relative my-2 rounded-md overflow-hidden">
                                      <div className="flex justify-between items-center py-1 px-3 bg-zinc-800 text-zinc-200 text-xs">
                                        <span>{match[1]}</span>
                                      </div>
                                      <SyntaxHighlighter
                                        language={match[1]}
                                        style={oneDark}
                                        customStyle={{
                                          margin: 0,
                                          borderRadius: 0,
                                          fontSize: "14px",
                                          lineHeight: "1.5",
                                        }}
                                      >
                                        {codeContent}
                                      </SyntaxHighlighter>
                                    </div>
                                  );
                                } else if (!inline) {
                                  return (
                                    <div className="relative my-2 rounded-md overflow-hidden">
                                      <SyntaxHighlighter
                                        language="text"
                                        style={oneDark}
                                        customStyle={{
                                          margin: 0,
                                          borderRadius: 0,
                                          fontSize: "14px",
                                          lineHeight: "1.5",
                                        }}
                                      >
                                        {codeContent}
                                      </SyntaxHighlighter>
                                    </div>
                                  );
                                }
                                return (
                                  <code
                                    className="px-1 py-0.5 rounded text-sm bg-zinc-700 text-zinc-200"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {reportContent}
                          </ReactMarkdown>
                          {showLoader && (
                            <span className="inline-flex ml-2">
                              <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-4">
                          <div className="h-7 bg-zinc-800 rounded w-3/4"></div>
                          <div className="h-4 bg-zinc-800 rounded w-full"></div>
                          <div className="h-4 bg-zinc-800 rounded w-full"></div>
                          <div className="h-4 bg-zinc-800 rounded w-5/6"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-xl bg-zinc-900 border-zinc-800">
                  <CardHeader className="text-center pb-6">
                    <CardTitle className="text-2xl text-white">
                      Research Any Company
                    </CardTitle>
                    <p className="text-zinc-400 mt-2">
                      Enter a company name or topic above to generate a
                      comprehensive analysis report powered by AI.
                    </p>
                  </CardHeader>
                </Card>
              </div>
            )}
          </div>

          {/* Tool results sidebar */}
          {messages.length > 0 && (
            <div className="w-72 border-l border-zinc-800 bg-zinc-900 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-zinc-300 mb-3 flex items-center justify-between">
                  <span>Research Process</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => router.refresh()}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </h3>
                <div className="space-y-2">
                  {messages.map(
                    (message) =>
                      message.role === "assistant" &&
                      message.parts?.map((part, idx) => {
                        if (part.type === "tool-invocation") {
                          return (
                            <React.Fragment key={`tool-${idx}`}>
                              {renderToolInvocation(part)}
                            </React.Fragment>
                          );
                        }
                        return null;
                      })
                  )}
                  {isLoading &&
                    !messages.some(
                      (m) =>
                        m.role === "assistant" &&
                        m.parts?.some((p) => p.type === "tool-invocation")
                    ) && <TypingIndicator />}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
