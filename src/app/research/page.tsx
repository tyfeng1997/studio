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

export default function SimplifiedReportsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const fileInputRef = useRef(null);

  // Report-related state
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

  // Handle input changes
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      // Reset processing states
      setIsPdfProcessing(false);
      setPdfContent("");
      setProcessingProgress(0);
    }
  };

  // Trigger file selection dialog
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Process PDF file
  const processPdf = async () => {
    if (!selectedFile) {
      toast.error("Please select a PDF file first");
      return;
    }

    setIsPdfProcessing(true);
    setProcessingProgress(0);

    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress((prev) => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 500);

    try {
      // Use fake function to extract PDF content; replace later with actual logic
      const result = await extractPdfContent(selectedFile);
      setPdfContent(
        `File Name: ${result.fileName}\nContent: ${result.content}`
      );

      // Set progress to 100%
      setProcessingProgress(100);
      setTimeout(() => {
        clearInterval(interval);
        setIsPdfProcessing(false);
        toast.success("PDF processed successfully");
      }, 500);
    } catch (error) {
      clearInterval(interval);
      setIsPdfProcessing(false);
      toast.error("PDF processing failed");
      console.error("PDF processing error:", error);
    }
  };

  // Start generating report
  const startResearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check if PDF content is needed but not processed yet
    if (
      (activeMode === "extendedResearch" || activeMode === "extraction") &&
      selectedFile &&
      !pdfContent
    ) {
      toast.error("Please process the selected PDF file first", {
        position: "top-center",
        duration: 3000,
      });
      return;
    }

    // If file is required but not uploaded
    if (
      (activeMode === "extendedResearch" || activeMode === "extraction") &&
      !selectedFile
    ) {
      toast.error("Please upload a PDF file first", {
        position: "top-center",
        duration: 3000,
      });
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
            className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3 my-2 border border-blue-200 dark:border-blue-900/50 break-words whitespace-pre-wrap"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                Executing tool: {part.toolInvocation.toolName}
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
                Tool is being called, please wait...
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

  // Typing indicator animation
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
              Company Research
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Financial Insights Assistant
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Input Area */}
        <form
          onSubmit={startResearch}
          className={cn(
            "p-4 flex flex-col items-center justify-center transition-all duration-300",
            reportContent ? "h-auto" : "h-auto"
          )}
        >
          <div className="relative w-full max-w-3xl">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={handleQueryChange}
                placeholder={
                  activeMode === "deepResearch"
                    ? "Enter company name or research topic..."
                    : activeMode === "extendedResearch"
                    ? "Enter content for extended research..."
                    : "Enter structured information to extract..."
                }
                className="w-full h-12 px-4 py-2 pl-10 pr-24 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-transparent"
                disabled={isLoading}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />

              {/* Right-side action buttons */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-2">
                {/* PDF upload button (only for Extended Research or Extract Content modes) */}
                {(activeMode === "extendedResearch" ||
                  activeMode === "extraction") && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={triggerFileInput}
                      disabled={isLoading || isPdfProcessing}
                    >
                      <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </Button>

                    {selectedFile && !pdfContent && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-green-600 dark:text-green-400"
                        onClick={processPdf}
                        disabled={isLoading || isPdfProcessing}
                      >
                        {isPdfProcessing ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
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
                  </>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={
                    isLoading ||
                    !input.trim() ||
                    ((activeMode === "extendedResearch" ||
                      activeMode === "extraction") &&
                      (!selectedFile || !pdfContent))
                  }
                  className={`h-8 w-8 rounded-full ${
                    input.trim() &&
                    !(
                      (activeMode === "extendedResearch" ||
                        activeMode === "extraction") &&
                      (!selectedFile || !pdfContent)
                    )
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "text-gray-400"
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                    >
                      <path d="M22 2L11 13"></path>
                      <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                    </svg>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
              {/* Mode selection buttons */}
              <Button
                type="button"
                variant={activeMode === "deepResearch" ? "secondary" : "ghost"}
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
                  Deep Research
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
                  Extended Research
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
                  Extract Content
                </span>
              </Button>
            </div>

            {/* Display selected file */}
            {selectedFile && (
              <div className="mt-2 p-2 rounded-md bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-blue-500 dark:text-blue-400" />
                  <span className="truncate max-w-[200px] sm:max-w-xs">
                    {selectedFile.name}
                  </span>
                </div>
                {isPdfProcessing ? (
                  <div className="flex items-center text-xs text-blue-500 dark:text-blue-400">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    <span>{Math.round(processingProgress)}%</span>
                  </div>
                ) : pdfContent ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                    Processed
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 py-0 text-xs rounded-full text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                    onClick={processPdf}
                  >
                    Process
                  </Button>
                )}
              </div>
            )}
          </div>
        </form>

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
                <Card className="w-full max-w-xl bg-white dark:bg-zinc-900 shadow-lg p-6">
                  <div className="text-center">
                    <div className="mx-auto w-16 h-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Intelligent Research Assistant
                    </h2>
                    <p className="text-gray-500 dark:text-zinc-400 mt-2">
                      This report generator supports three modes:
                    </p>
                    <ul className="text-left mt-4 space-y-2">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                          <span className="text-blue-600 dark:text-blue-400 text-xs">
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
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                          <span className="text-blue-600 dark:text-blue-400 text-xs">
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
                        <div className="h-5 w-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-2">
                          <span className="text-blue-600 dark:text-blue-400 text-xs">
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
