// app/reports/page.tsx (improved version)
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Zap,
  FileText,
  Loader2,
  ArrowLeft,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { v4 as uuidv4 } from "uuid";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  content: string;
  mode: "quick" | "detailed";
  created_at: string;
}

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

export default function ImprovedReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"history" | "create">("history");
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // 报告历史相关状态
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // 创建报告相关状态
  const [query, setQuery] = useState("");
  const [activeMode, setActiveMode] = useState<"quick" | "detailed">("quick");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId] = useState(uuidv4());
  const [isSaving, setIsSaving] = useState(false);
  const [reportSaved, setReportSaved] = useState(false);

  // 获取所有报告
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // 初始化聊天客户端
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
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

  // 更新查询文本
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  // 开始生成报告
  const startResearch = () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    setReportSaved(false);
    const modePrompt =
      activeMode === "quick"
        ? "Generate a quick summary report about this company: "
        : "Generate a detailed analysis report about this company: ";
    const event = {
      target: { value: modePrompt + query },
    } as React.ChangeEvent<HTMLTextAreaElement>;
    handleInputChange(event);
    handleSubmit({ preventDefault: () => {} });
  };

  // 保存报告到数据库
  const saveReport = useCallback(
    async (reportContent: string) => {
      if (!reportContent || reportSaved) return;

      try {
        setIsSaving(true);
        const title = query.trim()
          ? query.length > 30
            ? query.substring(0, 30) + "..."
            : query
          : "Untitled Report";

        console.log("Saving report:", {
          id: reportId,
          titleLength: title.length,
          contentLength: reportContent.length,
          mode: activeMode,
        });

        const response = await fetch("/api/reports", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: reportId,
            title: title,
            content: reportContent,
            mode: activeMode,
          }),
        });

        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error("Failed to parse response JSON:", e);
          data = { error: "Invalid server response" };
        }

        if (!response.ok) {
          console.error("Server response:", data);
          throw new Error(data.error || "Failed to save report");
        }

        // 添加新报告到列表中
        setReports((prev) => [data, ...prev]);
        setReportSaved(true);
        toast.success("Report saved successfully");

        // 完成后重置创建状态
        setTimeout(() => {
          setIsCreatingNew(false);
          setActiveTab("history");
          setQuery("");
        }, 2000);
      } catch (error) {
        console.error("Error saving report:", error);
        toast.error(
          `Failed to save report: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsSaving(false);
      }
    },
    [reportId, query, activeMode, reportSaved]
  );

  // 处理报告内容的流式传输和保存
  const [reportContent, setReportContent] = useState("");
  useEffect(() => {
    const content = extractStreamingReport(messages);
    setReportContent(content);

    if (
      !isLoading &&
      content &&
      content.length > 50 &&
      isGenerating &&
      !reportSaved
    ) {
      console.log("Conditions met for saving report");

      const timer = setTimeout(() => {
        saveReport(content);
        setIsGenerating(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages, isLoading, isGenerating, reportSaved, saveReport]);

  // 删除报告
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setDeleting(id);
      const response = await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      setReports(reports.filter((report) => report.id !== id));
      toast.success("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  // 查看报告详情
  const openReport = (id: string) => {
    router.push(`/report/${id}`);
  };

  // 开始创建新报告
  const startCreatingReport = () => {
    setIsCreatingNew(true);
    setActiveTab("create");
  };

  // 取消创建报告
  const cancelCreatingReport = () => {
    if (isLoading || isGenerating) {
      const confirmed = window.confirm(
        "Are you sure you want to cancel the report generation?"
      );
      if (!confirmed) return;
    }

    setIsCreatingNew(false);
    setQuery("");
    setActiveTab("history");
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
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
      <main className="flex-1 container mx-auto p-4 overflow-hidden">
        {/* Tabs for different sections */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "history" | "create")}
          className="h-full flex flex-col"
        >
          <div className="flex justify-between items-center mb-4 sticky top-0 z-10">
            <TabsList className="grid grid-cols-2 w-[400px]">
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-zinc-800"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Report History</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-purple-600"
                disabled={isCreatingNew}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Create New Report</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {isCreatingNew && (
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelCreatingReport}
                className="text-zinc-400 hover:text-red-500"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>

          {/* Report History Tab - Scrollable content */}
          <TabsContent value="history" className="mt-0 flex-1 overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900 rounded-lg border border-zinc-800">
                <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                <h2 className="text-xl font-medium text-zinc-300 mb-2">
                  No reports yet
                </h2>
                <p className="text-zinc-500 mb-6">
                  Generate your first company analysis report
                </p>
                <Button
                  onClick={startCreatingReport}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-zinc-300">
                    Your Reports
                  </h2>
                  <Button
                    onClick={startCreatingReport}
                    className="bg-purple-600 hover:bg-purple-700"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Report
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map((report) => (
                    <Card
                      key={report.id}
                      className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
                      onClick={() => openReport(report.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {report.mode === "quick" ? (
                              <Zap className="h-4 w-4 text-purple-500" />
                            ) : (
                              <FileText className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="text-xs font-medium text-zinc-500">
                              {report.mode === "quick"
                                ? "Quick Summary"
                                : "Detailed Analysis"}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500">
                            {formatDistanceToNow(new Date(report.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-white">
                          {report.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-24">
                          <p className="text-sm text-zinc-400 line-clamp-3">
                            {report.content
                              .replace(/#{1,6} /g, "")
                              .substring(0, 150)}
                            ...
                          </p>
                        </ScrollArea>
                      </CardContent>
                      <CardFooter className="flex justify-end pt-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-zinc-800"
                          onClick={(e) => handleDelete(report.id, e)}
                          disabled={deleting === report.id}
                        >
                          {deleting === report.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* Create Report Tab - Fixed height with internal scrolling */}
          <TabsContent value="create" className="mt-0 flex-1 overflow-hidden">
            {!isCreatingNew ? (
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
                <h2 className="text-lg font-medium text-zinc-300 mb-4">
                  Create a New Company Analysis Report
                </h2>
                <p className="text-zinc-400 mb-6">
                  Get detailed insights and analysis about any company. Our
                  AI-powered tool will research and generate a comprehensive
                  report in minutes.
                </p>
                <Button
                  onClick={startCreatingReport}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Creating
                </Button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* 左侧面板：查询输入与工具执行过程 - Scrollable */}
                <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-auto pb-4">
                  {/* 查询输入区域 */}
                  <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                    <h2 className="text-lg font-medium mb-4 text-white">
                      Research Query
                    </h2>
                    <Textarea
                      value={query}
                      onChange={handleQueryChange}
                      placeholder="Enter company name or research question..."
                      className="mb-6 h-32 bg-zinc-950 border-zinc-800 text-white"
                    />
                    <h2 className="text-lg font-medium mb-4 text-white">
                      Research Mode
                    </h2>
                    <Tabs
                      defaultValue="quick"
                      value={activeMode}
                      onValueChange={(value) =>
                        setActiveMode(value as "quick" | "detailed")
                      }
                    >
                      <TabsList className="grid grid-cols-2 mb-6">
                        <TabsTrigger
                          value="quick"
                          className="data-[state=active]:bg-purple-600"
                        >
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            <span>Quick Summary</span>
                          </div>
                        </TabsTrigger>
                        <TabsTrigger
                          value="detailed"
                          className="data-[state=active]:bg-blue-600"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span>Detailed Report</span>
                          </div>
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent
                        value="quick"
                        className="text-sm text-zinc-400"
                      >
                        Generated in a few minutes
                      </TabsContent>
                      <TabsContent
                        value="detailed"
                        className="text-sm text-zinc-400"
                      >
                        In-depth analysis (takes longer)
                      </TabsContent>
                    </Tabs>
                    <Button
                      onClick={startResearch}
                      disabled={isLoading || !query.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Report...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          Start Research
                        </>
                      )}
                    </Button>
                  </div>

                  {/* 工具执行日志区域 */}
                  {messages.length > 0 && (
                    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4 flex-1">
                      <h3 className="text-sm font-medium text-zinc-300 mb-3">
                        Research Process
                      </h3>
                      <ScrollArea className="h-64">
                        <div className="space-y-2 p-2">
                          {messages.map(
                            (message) =>
                              message.role === "assistant" &&
                              message.parts?.map((part, idx) => {
                                if (part.type === "tool-invocation") {
                                  return (
                                    <div
                                      key={`tool-${idx}`}
                                      className="text-sm"
                                    >
                                      <ToolResultRenderer
                                        tool={part.toolInvocation.toolName}
                                        data={part.toolInvocation.result}
                                        error={part.toolInvocation.error}
                                        state={part.toolInvocation.state}
                                      />
                                    </div>
                                  );
                                }
                                return null;
                              })
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                {/* 右侧面板：报告输出 - Fixed height with internal scrolling */}
                <div className="w-full lg:w-2/3 bg-zinc-900 rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
                  <div className="border-b border-zinc-800 bg-zinc-800 p-4 sticky top-0">
                    <h2 className="text-xl font-semibold text-zinc-100">
                      {isLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-600" />
                          Generating Report...
                        </div>
                      ) : (
                        "Company Analysis Report"
                      )}
                    </h2>
                    <p className="text-sm text-zinc-400">
                      {activeMode === "quick"
                        ? "Quick Summary Report"
                        : "Detailed Analysis Report"}
                    </p>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-6">
                      <div className="prose prose-invert prose-zinc max-w-none">
                        {reportContent ? (
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
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
