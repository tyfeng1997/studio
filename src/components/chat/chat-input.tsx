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

  // 处理键盘事件，回车键发送消息（Shift+Enter换行）
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // 调用提交函数，传入当前事件作为参数
      handleSubmit(event as any);
    }
  };

  // 处理拖拽文件事件（只接收 PDF 文件）
  const handleDrop = (event: React.DragEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      // 过滤出 PDF 文件
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
        {/* 附件预览 */}
        {files && files.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Paperclip className="h-4 w-4" />
            <span>{files.length} 个文件已选择</span>
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
              placeholder={"发送消息..."}
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
                      <span className="sr-only">停止生成</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>停止生成</TooltipContent>
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
                        <span className="sr-only">附加文件</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>附加文件</TooltipContent>
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
                    <span className="sr-only">发送消息</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>发送消息</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
