"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { v4 as uuidv4 } from "uuid";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, FileText, Loader2, X, Search, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { toast } from "@/components/ui/use-toast";

// Import the components we created
import ResearchHeader from "@/components/research/research-header";
import ResearchInput from "@/components/research/research-input";

import { Download, FileDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import html2pdf from "html2pdf.js";

// Function to extract content between <report> tags
function extractReportContent(content) {
  if (!content) return "";

  const reportRegex = /<report>([\s\S]*?)<\/report>/;
  const match = content.match(reportRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  return "";
}

// Function to get title from report content
function getReportTitle(reportContent) {
  if (!reportContent) return "Untitled Report";

  // Get the first line
  const firstLine = reportContent.split("\n")[0];

  // Take up to 30 characters
  return firstLine.substring(0, 30) + (firstLine.length > 30 ? "..." : "");
}

// Extract complete message content for display
function extractStreamingContent(messages) {
  const lastMsg = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string");

  if (!lastMsg) return "";

  return lastMsg.content;
}

// Extract only report content for saving
function extractReportForSaving(messages) {
  const lastMsg = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string");

  if (!lastMsg) return "";

  return extractReportContent(lastMsg.content);
}

export default function ResearchPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // Report-related state
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState("deepResearch");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId] = useState(uuidv4());
  const [reportSaved, setReportSaved] = useState(false);

  // Initialize chat client
  const {
    messages,
    handleInputChange,
    handleSubmit,
    isLoading,
    input: chatInput,
    setInput: setChatInput,
  } = useChat({
    api: "/api/research",
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

  // State to track PDF content from the input component
  const [pdfContent, setPdfContent] = useState("");
  // State to track if we're loading a saved report
  const [loadingReport, setLoadingReport] = useState(false);

  // Function to load saved report from URL parameter
  useEffect(() => {
    const fetchReportFromURL = async () => {
      // Check for report ID in URL
      const searchParams = new URLSearchParams(window.location.search);
      const reportId = searchParams.get("report");

      if (reportId) {
        setLoadingReport(true);
        try {
          // Fetch the report data
          const response = await fetch(`/api/reports?id=${reportId}`);

          if (!response.ok) {
            throw new Error("Failed to load report");
          }

          const reportData = await response.json();

          // Set the report content to display
          setDisplayContent(reportData.content);
          // Also save it for potential citation extraction
          setReportContentForSaving(reportData.content);
          // Mark as saved since it's coming from the database
          setReportSaved(true);
        } catch (error) {
          console.error("Error loading report:", error);
          toast({
            title: "Error",
            description: "Failed to load the saved report",
            variant: "destructive",
          });
        } finally {
          setLoadingReport(false);
        }
      }
    };

    fetchReportFromURL();
  }, []);

  // Start generating report
  const startResearch = (e, pdfContentFromInput) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Clear any existing report data
    setDisplayContent("");
    setReportContentForSaving("");

    // Remove report ID from URL without reloading the page
    const url = new URL(window.location);
    url.searchParams.delete("report");
    window.history.pushState({}, "", url);

    setIsGenerating(true);
    setReportSaved(false);
    setPdfContent(pdfContentFromInput || "");

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

  // Handle streaming content
  const [displayContent, setDisplayContent] = useState("");
  const [reportContentForSaving, setReportContentForSaving] = useState("");
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    // Get full content for display
    const content = extractStreamingContent(messages);
    setDisplayContent(content);

    // Get only report content for saving
    const reportContent = extractReportForSaving(messages);
    setReportContentForSaving(reportContent);

    // Show loader only when content exists and still loading
    setShowLoader(isLoading && content.length > 0);

    if (!isLoading && content && content.length > 50 && isGenerating) {
      setIsGenerating(false);
    }
  }, [messages, isLoading, isGenerating]);

  // Save report to database
  const saveReport = async () => {
    if (!reportContentForSaving || reportSaved) return;

    try {
      const title = getReportTitle(reportContentForSaving);

      const response = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: reportId,
          title: title,
          content: reportContentForSaving,
          mode: activeMode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save report");
      }

      setReportSaved(true);
      toast({
        title: "Report saved",
        description: "Your report has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving report:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save report",
        variant: "destructive",
      });
    }
  };
  // 优化 PDF 导出函数
  const exportAsPDF = () => {
    if (!displayContent) return;

    // 创建临时 div 用于渲染内容
    const element = document.createElement("div");
    element.className = "pdf-export";

    // 应用更好的样式
    element.style.padding = "40px";
    element.style.maxWidth = "800px";
    element.style.margin = "0 auto";
    element.style.fontFamily = "'Segoe UI', Arial, sans-serif";
    element.style.backgroundColor = "#ffffff";
    element.style.color = "#333333";

    // 创建标题元素并应用样式
    const titleEl = document.createElement("div");
    titleEl.style.textAlign = "center";
    titleEl.style.marginBottom = "30px";
    element.appendChild(titleEl);

    // 添加 Logo 或标题图片（可选）
    // const logoImg = document.createElement("img");
    // logoImg.src = "/logo.png";
    // logoImg.style.height = "60px";
    // logoImg.style.marginBottom = "20px";
    // titleEl.appendChild(logoImg);

    // 转换 Markdown 为增强的 HTML
    const markdownToHtml = displayContent
      // 标题样式
      .replace(
        /# (.*)/g,
        '<h1 style="font-size: 28px; margin-bottom: 20px; color: #111; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 10px;">$1</h1>'
      )
      .replace(
        /## (.*)/g,
        '<h2 style="font-size: 22px; margin-top: 30px; margin-bottom: 15px; color: #222; font-weight: 600;">$1</h2>'
      )
      .replace(
        /### (.*)/g,
        '<h3 style="font-size: 18px; margin-top: 25px; margin-bottom: 10px; color: #333; font-weight: 600;">$1</h3>'
      )

      // 文本格式
      .replace(
        /\*\*(.*?)\*\*/g,
        '<strong style="font-weight: 600; color: #111;">$1</strong>'
      )
      .replace(
        /\*(.*?)\*/g,
        '<em style="font-style: italic; color: #444;">$1</em>'
      )

      // 链接样式
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" style="color: #0066cc; text-decoration: none; border-bottom: 1px solid #0066cc;">$1</a>'
      )

      // 引用样式 - 加强引用的视觉效果
      .replace(
        /\n> (.*)/g,
        '<blockquote style="border-left: 4px solid #0066cc; padding-left: 15px; margin-left: 0; margin-right: 0; color: #555; font-style: italic;">$1</blockquote>'
      )

      // 列表样式
      .replace(
        /\n- (.*)/g,
        '<div style="margin: 5px 0; display: flex;"><span style="min-width: 18px; color: #0066cc; font-weight: bold; margin-right: 8px;">•</span><span>$1</span></div>'
      )
      .replace(
        /\n(\d+)\. (.*)/g,
        '<div style="margin: 5px 0; display: flex;"><span style="min-width: 25px; color: #0066cc; font-weight: bold; margin-right: 8px;">$1.</span><span>$2</span></div>'
      )

      // 引用编号加强显示 [1], [2] 等
      .replace(
        /\[(\d+)\]/g,
        '<span style="display: inline-block; min-width: 25px; color: #0066cc; font-weight: bold;">[$1]</span>'
      )

      // 段落间距
      .replace(/\n\n/g, '<div style="margin: 15px 0;"></div>');

    // 为引用部分添加特殊样式（通常在报告底部）
    const referencesSection = markdownToHtml.match(
      /<h2[^>]*>References<\/h2>([\s\S]*?)(<h2|$)/i
    );
    let processedHtml = markdownToHtml;

    if (referencesSection && referencesSection[1]) {
      const refContent = referencesSection[1];
      const styledRefContent =
        '<div style="background-color: #f9f9f9; border: 1px solid #eee; padding: 15px; border-radius: 5px; margin-top: 10px;">' +
        refContent +
        "</div>";

      processedHtml = markdownToHtml.replace(refContent, styledRefContent);
    }

    // 设置 HTML 内容
    element.innerHTML = processedHtml;

    // 添加页码
    const pageFooter = document.createElement("div");
    pageFooter.style.position = "fixed";
    pageFooter.style.bottom = "20px";
    pageFooter.style.right = "20px";
    pageFooter.style.fontSize = "12px";
    pageFooter.style.color = "#666";
    pageFooter.innerHTML = "Page _page_ of _total_";
    element.appendChild(pageFooter);

    // 临时添加到文档
    document.body.appendChild(element);

    // 生成 PDF 选项
    const opt = {
      margin: [20, 20],
      filename: "financial-report.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      footer: {
        height: "15mm",
        contents: {
          default:
            '<div style="text-align: right; font-size: 10px; color: #666;">Page {{page}} of {{pages}}</div>',
        },
      },
    };

    // 生成 PDF
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 删除临时元素
        document.body.removeChild(element);

        // 显示成功消息
        toast({
          title: "PDF 导出成功",
          description: "您的报告已成功导出为 PDF 格式。",
        });
      });
  };
  const exportAsMarkdown = () => {
    if (!displayContent) return;

    // Create a blob with the markdown content
    const blob = new Blob([displayContent], { type: "text/markdown" });

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "financial-report.md";

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    toast({
      title: "Markdown Exported",
      description: "Your report has been exported as Markdown successfully.",
    });
  };

  // Render tool invocation status
  const renderToolInvocation = (part) => {
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
                Preparing tool: {part.toolInvocation.toolName}
              </span>
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 overflow-x-auto">
              {part.toolInvocation.args ? (
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              ) : (
                <span className="italic">Collecting parameters...</span>
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
            className="bg-purple-50 dark:bg-purple-950/30 rounded-md p-3 my-2 border border-purple-200 dark:border-purple-800/50 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                Executing tool: {part.toolInvocation.toolName}
              </span>
            </div>
            {part.toolInvocation.args && (
              <div className="text-sm text-purple-700 dark:text-purple-300 mb-2 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-purple-500 dark:text-purple-400">
                Tool is being called, please wait...
              </span>
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse delay-150"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 animate-pulse delay-300"></div>
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

  // Typing indicator animation
  const TypingIndicator = () => (
    <div className="flex items-center gap-1 py-2 px-4">
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 dark:bg-purple-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.2 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 dark:bg-purple-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-purple-500 dark:bg-purple-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.4 }}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-zinc-950">
      {/* Header Component */}
      <ResearchHeader />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Input Component */}
        <ResearchInput
          input={input}
          setInput={setInput}
          activeMode={activeMode}
          setActiveMode={setActiveMode}
          isLoading={isLoading}
          startResearch={startResearch}
        />

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {displayContent || isLoading || loadingReport ? (
              <>
                {/* Report Content */}
                <div className="flex justify-end px-6 py-2">
                  {loadingReport ? (
                    <div className="flex items-center text-gray-500 dark:text-gray-400">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading saved report...
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Button
                        onClick={saveReport}
                        disabled={
                          !reportContentForSaving || reportSaved || isLoading
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                        size="sm"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {reportSaved ? "Saved" : "Save Report"}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!displayContent || isLoading}
                            className="text-gray-600 dark:text-zinc-400"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={exportAsPDF}
                            disabled={!displayContent || isLoading}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            Export as PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={exportAsMarkdown}
                            disabled={!displayContent || isLoading}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export as Markdown
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                <ScrollArea className="flex-1">
                  <div className="max-w-4xl mx-auto p-6">
                    <div className="prose prose-blue dark:prose-invert max-w-none">
                      {displayContent ? (
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
                                    className="px-1 py-0.5 rounded text-sm bg-gray-100 dark:bg-zinc-800 text-purple-700 dark:text-purple-300"
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                            }}
                          >
                            {displayContent}
                          </ReactMarkdown>
                          {showLoader && (
                            <span className="inline-flex ml-2">
                              <Loader2 className="h-5 w-5 animate-spin text-purple-500 dark:text-purple-400" />
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
                <Card className="w-full max-w-xl bg-white dark:bg-zinc-900 shadow-lg p-6">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 mb-4 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Financial Intelligence Agent
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 mt-2">
                      Powerful AI-driven financial analysis in three specialized
                      modes:
                    </p>
                    <ul className="text-left mt-4 space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            1
                          </span>
                        </div>
                        <span>
                          <strong>Deep Research</strong> - Comprehensive
                          analysis of public companies with financial metrics,
                          market position, competitive landscape, and investment
                          outlook.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            2
                          </span>
                        </div>
                        <span>
                          <strong>Extended Research</strong> - Enhanced analysis
                          by combining uploaded financial reports (10-K, 10-Q,
                          earnings) with targeted inquiries for deeper insights.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            3
                          </span>
                        </div>
                        <span>
                          <strong>Extract Content</strong> - Precise extraction
                          of key financial data, metrics, and disclosures from
                          uploaded reports in structured format.
                        </span>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Tool results sidebar */}
          {messages.length > 0 && (
            <div className="w-72 border-l border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3 flex items-center justify-between">
                  <span>Research Process</span>
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
