"use client";

import * as React from "react";
import { Paperclip, SendHorizonal, X, Square, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  files?: FileList;
  setFiles: (files: FileList | undefined) => void;
  stop: () => void;
  selectedWorkspace?: string;
  onWorkspaceChange?: (workspace: string) => void;
  workspaces?: Array<{ workspace: string; document_count: number }>;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  files,
  setFiles,
  stop,
  selectedWorkspace,
  onWorkspaceChange,
  workspaces = [],
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
      {/* Workspace selector */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>Workspace:</span>
        </div>
        <Select
          value={selectedWorkspace || "none"}
          onValueChange={(value) =>
            onWorkspaceChange?.(value === "none" ? "" : value)
          }
        >
          <SelectTrigger className="h-8 w-[200px] bg-background border-input">
            <SelectValue placeholder="Select workspace" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No workspace</SelectItem>
            {workspaces.map((ws) => (
              <SelectItem key={ws.workspace} value={ws.workspace}>
                {ws.workspace} ({ws.document_count} docs)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedWorkspace && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-muted-foreground hover:text-foreground"
                  onClick={() => onWorkspaceChange?.("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear workspace selection</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

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
          <Textarea
            value={input}
            onChange={handleInputChange}
            placeholder={
              selectedWorkspace
                ? `Ask me anything about ${selectedWorkspace}...`
                : "Send a message..."
            }
            className="min-h-[60px] w-full resize-none rounded-lg pr-24 bg-background border-input"
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => stop()}
              >
                <Square className="h-4 w-4" />
                <span className="sr-only">Stop generating</span>
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-4 w-4" />
                <span className="sr-only">Attach files</span>
              </Button>
            )}
            <Button type="submit" size="icon" disabled={isLoading}>
              <SendHorizonal className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
