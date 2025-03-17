"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { cn } from "@/lib/utils";

interface ReportProps {
  reports: { id: string; content: string }[];
  onClose: () => void;
}

export function Report({ reports, onClose }: ReportProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeReport, setActiveReport] = React.useState<string | null>(
    reports.length > 0 ? reports[0].id : null
  );

  React.useEffect(() => {
    if (
      reports.length > 0 &&
      (!activeReport || !reports.some((r) => r.id === activeReport))
    ) {
      setActiveReport(reports[0].id);
    }
  }, [reports, activeReport]);

  const copyToClipboard = async (text: string) => {
    try {
      // Use a fallback method if clipboard API is not available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback method using textarea
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const downloadReport = (content: string, index: number) => {
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${index + 1}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col text-center p-4">
        <p className="text-muted-foreground">No reports available yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Reports will appear here when generated in the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-zinc-900">
        <h2 className="font-medium text-lg">Reports</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {reports.map((report, index) => (
          <Collapsible
            key={report.id}
            open={activeReport === report.id}
            onOpenChange={(open) => {
              console.log("Collapsible state changed:", open);
              setActiveReport(open ? report.id : null);
            }}
            className="border border-zinc-200 dark:border-zinc-800 rounded-md overflow-hidden bg-white dark:bg-zinc-900 shadow-sm"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <span className="font-medium">Report {index + 1}</span>
                {activeReport === report.id ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="flex justify-end gap-2 p-3 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(report.content)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 mr-1" />
                      ) : (
                        <Copy className="h-4 w-4 mr-1" />
                      )}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy to clipboard</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(report.content, index)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Download report</TooltipContent>
                </Tooltip>
              </div>

              <div className="p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
                <div className="markdown-content report-message">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        const codeContent = String(children).replace(/\n$/, "");

                        if (!inline && match) {
                          // 代码块带语言
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
                          // 无语言代码块
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

                        // 内联代码
                        return (
                          <code
                            className={cn(
                              "px-1 py-0.5 rounded text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      // 自定义其他 Markdown 元素
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      h1: ({ children }) => (
                        <h1 className="text-2xl font-bold my-4">{children}</h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-bold my-3">{children}</h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-bold my-2">{children}</h3>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-6 mb-3">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-6 mb-3">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          className={cn(
                            "pl-3 italic my-2 border-l-4 border-zinc-300 dark:border-zinc-700"
                          )}
                        >
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {report.content}
                  </ReactMarkdown>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
