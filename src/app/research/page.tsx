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
import { Zap, FileText, Loader2, X, Search } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ToolResultRenderer } from "@/components/tool-result-render";

// Import the components we created
import ResearchHeader from "@/components/research/research-header";
import ResearchInput from "@/components/research/research-input";

// Extract report content from streaming messages
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

export default function ResearchPage() {
  const router = useRouter();
  const { theme } = useTheme();

  // Report-related state
  const [input, setInput] = useState("");
  const [activeMode, setActiveMode] = useState<
    "deepResearch" | "extendedResearch" | "extraction"
  >("deepResearch");
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

  // State to track PDF content from the input component
  const [pdfContent, setPdfContent] = useState("");

  // Start generating report
  const startResearch = (e, pdfContentFromInput) => {
    e.preventDefault();
    if (!input.trim()) return;

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

  // Handle streaming report content
  const [reportContent, setReportContent] = useState("");
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const content = extractStreamingReport(messages);
    setReportContent(content);

    // Show loader only when content exists and still loading
    setShowLoader(isLoading && content.length > 0);

    if (!isLoading && content && content.length > 50 && isGenerating) {
      setIsGenerating(false);
    }
  }, [messages, isLoading, isGenerating]);

  // Render tool invocation status
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
                                    className="px-1 py-0.5 rounded text-sm bg-gray-100 dark:bg-zinc-800 text-purple-700 dark:text-purple-300"
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
                      Intelligent Research Assistant
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 mt-2">
                      This report generator supports three modes:
                    </p>
                    <ul className="text-left mt-4 space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            1
                          </span>
                        </div>
                        <span>
                          <strong>Deep Research</strong> - Generates a
                          high-quality professional report based on the user's
                          inquiry.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            2
                          </span>
                        </div>
                        <span>
                          <strong>Extended Research</strong> - Conducts extended
                          research by combining uploaded PDF content with user
                          input.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-2">
                          <span className="text-purple-500 dark:text-purple-400 text-xs">
                            3
                          </span>
                        </div>
                        <span>
                          <strong>Extract Content</strong> - Extracts structured
                          information specified by the user from the uploaded
                          PDF.
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
