"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Loader2, ArrowLeft, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  content: string;
  mode: "quick" | "detailed";
  created_at: string;
}

export default function ReportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (!reportId) {
          throw new Error("Report ID is required");
        }

        const response = await fetch(`/api/reports?id=${reportId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch report");
        }
        const data = await response.json();
        setReport(data);
      } catch (error) {
        console.error("Error fetching report:", error);
        toast.error("Failed to load report");
        router.push("/reports");
      } finally {
        setLoading(false);
      }
    };

    if (reportId) {
      fetchReport();
    }
  }, [reportId, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-zinc-950">
        <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen justify-center items-center bg-zinc-950">
        <div className="text-center">
          <h2 className="text-xl font-medium text-zinc-300 mb-4">
            Report not found
          </h2>
          <Button onClick={() => router.push("/reports")}>
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 p-4 bg-zinc-900">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {report.mode === "quick" ? (
              <Zap className="h-6 w-6 text-purple-500" />
            ) : (
              <FileText className="h-6 w-6 text-blue-500" />
            )}
            <div>
              <h1 className="text-xl font-semibold text-white">
                {report.title}
              </h1>
              <p className="text-sm text-zinc-400">
                {report.mode === "quick"
                  ? "Quick Summary"
                  : "Detailed Analysis"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/reports")}
              className="text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Reports
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 flex justify-center">
        <div className="bg-zinc-900 rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
          <ScrollArea className="h-[calc(100vh-160px)]">
            <div className="p-6">
              <div className="prose prose-invert prose-zinc max-w-none">
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
                          className="px-1 py-0.5 rounded text-sm bg-zinc-700 text-zinc-200"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {report.content}
                </ReactMarkdown>
              </div>
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
