"use client";

import * as React from "react";
import { Paperclip, SendHorizonal, X, Square, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  files?: FileList;
  setFiles: (files: FileList | undefined) => void;
  stop: () => void;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  files,
  setFiles,
  stop,
}: ChatInputProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(event.target.files);
    }
  };

  const clearFiles = () => {
    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle keyboard events: Enter to send message (Shift+Enter for newline)
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Call the submit function with the current event as parameter
      handleSubmit(event as any);
    }
  };

  // Handle file drop event (accept only PDF files)
  const handleDrop = (event: React.DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      // Filter PDF files
      const pdfFiles = Array.from(event.dataTransfer.files).filter(
        (file) => file.type === "application/pdf"
      );
      if (pdfFiles.length > 0) {
        const dataTransfer = new DataTransfer();
        pdfFiles.forEach((file) => dataTransfer.items.add(file));
        setFiles(dataTransfer.files);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* Attachment preview */}
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Paperclip className="h-4 w-4" />
            <span>{files.length} file(s) selected</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={clearFiles}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="relative"
        >
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            ref={fileInputRef}
          />

          <div className="flex items-center">
            <Textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={"Send message..."}
              className="min-h-[60px] w-full resize-none rounded-lg pr-24 bg-white dark:bg-zinc-800 border-blue-100 dark:border-blue-900/30 focus:border-blue-300 dark:focus:border-blue-700 shadow-sm"
            />
            <div className="absolute bottom-2 right-2 flex gap-2">
              {isLoading ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => stop()}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Square className="h-4 w-4" />
                      <span className="sr-only">Stop generation</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generation</TooltipContent>
                </Tooltip>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">Attach file</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach file</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <SendHorizonal className="h-4 w-4" />
                    <span className="sr-only">Send message</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Send message</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
