"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Zap,
  FileText,
  Loader2,
  ArrowLeft,
  X,
  Search,
  Upload,
  FileUp,
  Download,
  FileSearch,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

// Fake function to extract PDF content, to be replaced with actual implementation later
const extractPdfContent = async (file) => {
  // This is a placeholder function that just returns the file name and a fake message
  // Will be replaced with actual PDF extraction logic later
  return {
    fileName: file.name,
    content: "This is fake pdf.",
  };
};

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
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  // 创建报告相关状态
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<
    "deepResearch" | "extendedResearch" | "extraction"
  >("deepResearch");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId] = useState(uuidv4());
  const [reportSaved, setReportSaved] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfContent, setPdfContent] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

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
        pdfContent: pdfContent || null,
      };
    },
    experimental_streamData: true,
  });

  // 处理输入变化
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // 处理文件选择
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset processing states
      setIsPdfProcessing(false);
      setPdfContent("");
      setProcessingProgress(0);
    }
  };

  // 触发文件选择对话框
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // 处理 PDF 处理
  const processPdf = async () => {
    if (!selectedFile) {
      toast.error("请先选择 PDF 文件");
      return;
    }

    setIsPdfProcessing(true);
    setProcessingProgress(0);

    // 模拟处理进度
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);

    try {
      // 使用假函数提取 PDF 内容，后续会替换为实际实现
      const result = await extractPdfContent(selectedFile);
      setPdfContent(`文件名：${result.fileName}\n内容：${result.content}`);

      // 进度达到 100%
      setProcessingProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setIsPdfProcessing(false);
        toast.success("PDF 处理完成");
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setIsPdfProcessing(false);
      toast.error("PDF 处理失败");
      console.error("PDF 处理错误：", error);
    }
  };

  // 开始生成报告
  const startResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 检查是否需要 PDF 内容但尚未处理 PDF
    if (
      (activeMode === "extendedResearch" || activeMode === "extraction") &&
      selectedFile &&
      !pdfContent
    ) {
      toast.error("请先处理选择的 PDF 文件");
      return;
    }

    // 如果选择了扩展研究或提取模式但没有选择文件
    if (
      (activeMode === "extendedResearch" || activeMode === "extraction") &&
      !selectedFile
    ) {
      toast.error("请先上传 PDF 文件");
      return;
    }

    setIsGenerating(true);
    setReportSaved(false);

    let modePrompt = "";

    switch (activeMode) {
      case "deepResearch":
        modePrompt = "Generate a detailed analysis report about this company: ";
        break;
      case "extendedResearch":
        modePrompt =
          "Based on the provided PDF content, conduct extended research about: ";
        break;
      case "extraction":
        modePrompt =
          "Extract structured information from the provided PDF about: ";
        break;
    }

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
            className="bg-amber-50 dark:bg-amber-950/30 rounded-md p-3 my-2 border border-amber-200 dark:border-amber-800/50 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                准备工具: {part.toolInvocation.toolName}
              </span>
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 overflow-x-auto">
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
            className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3 my-2 border border-blue-200 dark:border-blue-900/50 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                执行工具: {part.toolInvocation.toolName}
              </span>
            </div>
            {part.toolInvocation.args && (
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-2 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-blue-500 dark:text-blue-400">
                工具调用中，请稍候...
              </span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse delay-150"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse delay-300"></div>
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
        className="h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.2 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-blue-500 dark:bg-blue-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.4 }}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header - Fixed at the top */}
      <header className="border-b border-gray-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              研究报告
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回对话
          </Button>
        </div>
      </header>

      {/* Main Content - Takes the rest of the screen height */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Input Area - Centered */}
        <form
          onSubmit={startResearch}
          className={cn(
            "p-4 flex flex-col items-center justify-center transition-all duration-300",
            reportContent ? "h-auto" : "h-auto"
          )}
        >
          <div className="relative w-full max-w-3xl">
            <input
              type="text"
              value={input}
              onChange={handleQueryChange}
              placeholder={
                activeMode === "deepResearch"
                  ? "输入公司名称或研究主题..."
                  : activeMode === "extendedResearch"
                  ? "输入需要扩展研究的内容..."
                  : "输入需要提取的结构化信息..."
              }
              className="w-full h-12 px-4 py-2 pl-10 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
              disabled={isLoading}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />

            <div className="mt-3 flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
              {/* 研究模式选择 */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-zinc-700 pb-2 sm:pb-0 sm:pr-2">
                <Button
                  type="button"
                  variant={
                    activeMode === "deepResearch" ? "secondary" : "ghost"
                  }
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setActiveMode("deepResearch");
                    setSelectedFile(null);
                    setPdfContent("");
                  }}
                >
                  <FileText className="h-4 w-4 mr-1 text-blue-500 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    深度研究
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={
                    activeMode === "extendedResearch" ? "secondary" : "ghost"
                  }
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveMode("extendedResearch")}
                >
                  <FileUp className="h-4 w-4 mr-1 text-purple-500 dark:text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    扩展研究
                  </span>
                </Button>
                <Button
                  type="button"
                  variant={activeMode === "extraction" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-full"
                  onClick={() => setActiveMode("extraction")}
                >
                  <FileSearch className="h-4 w-4 mr-1 text-amber-500 dark:text-amber-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    提取内容
                  </span>
                </Button>
              </div>

              {/* PDF 上传按钮 (仅在扩展研究或提取模式下显示) */}
              {(activeMode === "extendedResearch" ||
                activeMode === "extraction") && (
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={triggerFileInput}
                    disabled={isLoading || isPdfProcessing}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    <span>{selectedFile ? "更换PDF" : "上传PDF"}</span>
                  </Button>

                  {selectedFile && !pdfContent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/50 hover:bg-green-100 dark:hover:bg-green-800/30"
                      onClick={processPdf}
                      disabled={isLoading || isPdfProcessing}
                    >
                      {isPdfProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          <span>{Math.round(processingProgress)}%</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          <span>处理PDF</span>
                        </>
                      )}
                    </Button>
                  )}

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf"
                    className="hidden"
                  />
                </div>
              )}

              {/* 研究按钮 */}
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  !input.trim() ||
                  ((activeMode === "extendedResearch" ||
                    activeMode === "extraction") &&
                    (!selectedFile || !pdfContent))
                }
                className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white h-8 w-full sm:w-auto"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "开始研究"
                )}
              </Button>
            </div>

            {/* 显示已选择的文件 */}
            {selectedFile && (
              <div className="mt-2 p-2 rounded-md bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                  <span>{selectedFile.name}</span>
                </div>
                {pdfContent && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    已处理
                  </span>
                )}
              </div>
            )}
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
                    <div className="prose prose-blue dark:prose-invert max-w-none">
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
                                      <div className="flex justify-between items-center py-1 px-3 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-200 text-xs">
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
                                    className="px-1 py-0.5 rounded text-sm bg-gray-100 dark:bg-zinc-800 text-blue-700 dark:text-blue-300"
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
                              <Loader2 className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-400" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="animate-pulse space-y-4">
                          <div className="h-7 bg-gray-200 dark:bg-zinc-800 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-full"></div>
                          <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-5/6"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Card className="w-full max-w-xl bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                  <CardHeader className="text-center pb-6">
                    <div className="mx-auto w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl text-gray-900 dark:text-white">
                      智能研究助手
                    </CardTitle>
                    <CardDescription className="text-gray-500 dark:text-zinc-400 mt-2">
                      报告生成器支持三种模式：
                      <ul className="text-left mt-2 space-y-2">
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-xs">
                              1
                            </span>
                          </div>
                          <span>
                            <strong>深度研究</strong> -
                            根据用户希望了解的内容生成高质量的专业报告
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-xs">
                              2
                            </span>
                          </div>
                          <span>
                            <strong>扩展研究</strong> - 基于已有的 PDF
                            内容，结合用户输入进行补充研究
                          </span>
                        </li>
                        <li className="flex items-start">
                          <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-xs">
                              3
                            </span>
                          </div>
                          <span>
                            <strong>提取内容</strong> - 从上传的 PDF
                            中提取用户指定的结构化信息
                          </span>
                        </li>
                      </ul>
                    </CardDescription>
                  </CardHeader>
                </Card>
              </div>
            )}
          </div>

          {/* Tool results sidebar */}
          {messages.length > 0 && (
            <div className="w-72 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center justify-between">
                  <span>研究过程</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
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
