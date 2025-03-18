// app/report/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat, Message } from "@ai-sdk/react";
import { createIdGenerator } from "ai";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Zap, FileText, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { v4 as uuidv4 } from "uuid";
const generateUUID = () => uuidv4();

/**
 * 从最后一个 assistant 消息中提取报告内容（移除包装的 <report> 标签）
 * 这样可以支持流式展示，即使报告尚未结束也能实时更新。
 */
function extractStreamingReport(messages: Message[]): string {
  const lastMsg = messages
    .slice()
    .reverse()
    .find((msg) => msg.role === "assistant" && typeof msg.content === "string");
  if (!lastMsg) return "";
  let content = lastMsg.content;
  if (content.startsWith("<report>")) {
    content = content.substring(8); // 去掉 <report>
  }
  if (content.endsWith("</report>")) {
    content = content.substring(0, content.length - 9); // 去掉 </report>
  }
  return content;
}

export default function ReportPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeMode, setActiveMode] = useState<"quick" | "detailed">("quick");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportId] = useState(generateUUID()); // 页面加载时生成一次 UUID

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
        mode: activeMode, // 将模式传递给后端
      };
    },
    experimental_streamData: true,
  });

  // 更新查询输入框
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value);
  };

  // 开始生成报告：构造模式对应的提示，并提交请求
  const startResearch = () => {
    if (!query.trim()) return;
    setIsGenerating(true);
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

  // 由于流式传输，我们动态提取最新的报告内容
  const [reportContent, setReportContent] = useState("");
  useEffect(() => {
    setReportContent(extractStreamingReport(messages));
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-semibold text-white">
              Company Analysis Report
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-zinc-400 hover:text-white"
          >
            Back to Chat
          </Button>
        </div>
      </header>

      {/* Main Content: 左侧为查询和工具日志，右侧为报告输出 */}
      <main className="flex-1 container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* 左侧面板：查询输入与工具执行过程 */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
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
              <TabsContent value="quick" className="text-sm text-zinc-400">
                Generated in a few minutes
              </TabsContent>
              <TabsContent value="detailed" className="text-sm text-zinc-400">
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
              <div className="space-y-2 max-h-64 overflow-y-auto p-2">
                {messages.map(
                  (message) =>
                    message.role === "assistant" &&
                    message.parts?.map((part, idx) => {
                      if (part.type === "tool-invocation") {
                        return (
                          <div key={`tool-${idx}`} className="text-sm">
                            <ToolResultRenderer
                              tool={part.toolInvocation.toolName}
                              data={part.toolInvocation.result}
                              error={part.toolInvocation.error}
                              // 传递状态以便动态展示执行过程（例如：pending、running、result）
                              state={part.toolInvocation.state}
                            />
                          </div>
                        );
                      }
                      return null;
                    })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 右侧面板：报告输出 */}
        <div className="w-full lg:w-2/3 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="border-b border-zinc-200 p-4">
            <h2 className="text-xl font-semibold text-zinc-800">
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-purple-600" />
                  Generating Report...
                </div>
              ) : (
                "Company Analysis Report"
              )}
            </h2>
            <p className="text-sm text-zinc-500">
              {activeMode === "quick"
                ? "Quick Summary Report"
                : "Detailed Analysis Report"}
            </p>
          </div>
          <ScrollArea className="flex-1 p-6">
            <div className="max-w-none prose prose-zinc">
              {reportContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeContent = String(children).replace(/\n$/, "");
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
                          className="px-1 py-0.5 rounded text-sm bg-zinc-200 text-zinc-900"
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
                  <div className="h-7 bg-zinc-200 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-200 rounded w-full"></div>
                  <div className="h-4 bg-zinc-200 rounded w-full"></div>
                  <div className="h-4 bg-zinc-200 rounded w-5/6"></div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
