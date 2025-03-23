"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Upload,
  Download,
  Loader2,
  FileText,
  FileUp,
  FileSearch,
} from "lucide-react";

// Function to extract PDF content using Mistral OCR API
const extractPdfContent = async (file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/ocr", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to process PDF");
    }

    const data = await response.json();
    console.log("PDF extraction result:", data);
    return {
      fileName: data.fileName,
      content: data.content,
    };
  } catch (error) {
    console.error("PDF extraction error:", error);
    throw error;
  }
};

export default function ResearchInput({
  input,
  setInput,
  activeMode,
  setActiveMode,
  isLoading,
  startResearch,
}) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isPdfProcessing, setIsPdfProcessing] = useState(false);
  const [pdfContent, setPdfContent] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);

  // Handle input changes
  const handleQueryChange = (e) => {
    setInput(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is PDF
      if (file.type !== "application/pdf") {
        toast.error("Please select a PDF file");
        return;
      }

      setSelectedFile(file);
      // Reset processing states
      setIsPdfProcessing(false);
      setPdfContent("");
      setProcessingProgress(0);

      toast.success(`File "${file.name}" selected`);
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

    // Set up progress simulation
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        // Cap at 95% during processing to indicate that it's not complete yet
        const newProgress = prev + Math.random() * 10;
        return newProgress >= 95 ? 95 : newProgress;
      });
    }, 500);

    try {
      // Use the OCR API to extract PDF content
      const result = await extractPdfContent(selectedFile);

      // Format the content for display
      const formattedContent =
        typeof result.content === "string"
          ? result.content
          : JSON.stringify(result.content, null, 2);

      setPdfContent(formattedContent);

      // Set progress to 100% to indicate completion
      clearInterval(progressInterval);
      setProcessingProgress(100);
      setIsPdfProcessing(false);
      toast.success("PDF processed successfully");
    } catch (error) {
      clearInterval(progressInterval);
      setIsPdfProcessing(false);
      setProcessingProgress(0);
      toast.error(`PDF processing failed: ${error.message || "Unknown error"}`);
      console.error("PDF processing error:", error);
    }
  };

  const handleFormSubmit = (e) => {
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

    startResearch(e, pdfContent);
  };

  return (
    <form
      onSubmit={handleFormSubmit}
      className={cn(
        "p-4 flex flex-col items-center justify-center transition-all duration-300",
        "h-auto"
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
            className="w-full h-12 px-4 py-2 pl-10 pr-24 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-full text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 focus:border-transparent"
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
                  ? "bg-purple-500 text-white hover:bg-purple-600"
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
            <FileText className="h-4 w-4 mr-1 text-purple-500 dark:text-purple-400" />
            <span className="text-gray-700 dark:text-gray-300">
              Deep Research
            </span>
          </Button>
          <Button
            type="button"
            variant={activeMode === "extendedResearch" ? "secondary" : "ghost"}
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
              <FileText className="h-4 w-4 mr-2 text-purple-500 dark:text-purple-400" />
              <span className="truncate max-w-[200px] sm:max-w-xs">
                {selectedFile.name}
              </span>
            </div>
            {isPdfProcessing ? (
              <div className="flex items-center text-xs text-purple-500 dark:text-purple-400">
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
                className="h-6 px-2 py-0 text-xs rounded-full text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                onClick={processPdf}
              >
                Process
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
