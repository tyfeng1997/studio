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
  showReport: boolean;
  setShowReport: (show: boolean) => void;
  reportCount: number;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  files,
  setFiles,
  stop,
  showReport,
  setShowReport,
  reportCount,
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

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {/* File attachments preview */}
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Paperclip className="h-4 w-4" />
            <span>{files.length} file(s) selected</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0"
              onClick={clearFiles}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            multiple
            ref={fileInputRef}
          />

          <div className="flex items-center">
            <div className="flex items-center mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant={showReport ? "default" : "outline"}
                    onClick={() => setShowReport(!showReport)}
                    className="relative"
                  >
                    <FileText className="h-4 w-4" />
                    {reportCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {reportCount}
                      </Badge>
                    )}
                    <span className="sr-only">
                      {showReport ? "Hide reports" : "Show reports"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {showReport ? "Hide reports" : "Show reports"}
                </TooltipContent>
              </Tooltip>
            </div>

            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder={"Send a message..."}
              className="min-h-[60px] w-full resize-none rounded-lg pr-24 bg-background border-input"
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
                    >
                      <Square className="h-4 w-4" />
                      <span className="sr-only">Stop generating</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Stop generating</TooltipContent>
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
                      >
                        <Paperclip className="h-4 w-4" />
                        <span className="sr-only">Attach files</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach files</TooltipContent>
                  </Tooltip>
                </>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="submit" size="icon" disabled={isLoading}>
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
