"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion } from "framer-motion";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onReload?: () => void;
  isLastMessage?: boolean;
  status?: string;
  onDelete?: () => void;
}

export function ChatMessage({
  message,
  isLoading,
  onReload,
  isLastMessage = false,
  status,
  onDelete,
}: ChatMessageProps) {
  const [isReasoningVisible, setIsReasoningVisible] = useState(false);

  // 是否有 parts
  const hasParts =
    !!message.parts && Array.isArray(message.parts) && message.parts.length > 0;

  // 主文本内容
  const textContent = hasParts
    ? message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
    : message.content || "";

  // 推理
  const reasoningParts = hasParts
    ? message.parts.filter(
        (part) => part.type === "reasoning" || part.type === "thinking"
      )
    : [];
  const hasReasoningParts = reasoningParts.length > 0;

  // 是否是用户消息
  const isUserMessage = message.role === "user";

  // 附件
  const imageAttachments =
    message?.experimental_attachments?.filter((a) =>
      a?.contentType?.startsWith("image/")
    ) || [];
  const pdfAttachments =
    message?.experimental_attachments?.filter(
      (a) => a?.contentType === "application/pdf"
    ) || [];

  // 渲染推理内容
  const renderReasoningContent = () => {
    if (!hasReasoningParts || !isReasoningVisible) return null;
    return (
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-md p-3 mt-2 text-sm border border-blue-200 dark:border-blue-900/50 overflow-auto max-h-[300px]">
        {reasoningParts.map((part, index) => {
          if (part.details && Array.isArray(part.details)) {
            return (
              <div key={`reasoning-${index}`}>
                {part.details.map((detail, detailIndex) => (
                  <div key={`detail-${detailIndex}`} className="mb-2">
                    {detail.type === "text" && detail.text && (
                      <div className="text-blue-800 dark:text-blue-300">
                        {detail.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          } else if (part.reasoning) {
            return (
              <div
                key={`reasoning-${index}`}
                className="text-blue-800 dark:text-blue-300"
              >
                {typeof part.reasoning === "string"
                  ? part.reasoning
                  : JSON.stringify(part.reasoning)}
              </div>
            );
          } else {
            return (
              <div
                key={`reasoning-${index}`}
                className="text-blue-800 dark:text-blue-300"
              >
                <pre>{JSON.stringify(part, null, 2)}</pre>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // 渲染工具调用状态
  const renderToolInvocationState = (part) => {
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
                准备工具: {part.toolInvocation.toolName}
              </span>
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300 overflow-x-auto">
              {part.toolInvocation.args ? (
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              ) : (
                <span className="italic">收集参数中...</span>
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
                执行工具: {part.toolInvocation.toolName}
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
                工具调用中，请稍候...
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

  // 打字机动画
  const TypingIndicator = () => (
    <div className="flex items-center gap-1 py-1">
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
    <div
      className={cn(
        "group relative mb-4 flex w-full items-start",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      {/* 这层容器不限制高度，让文本部分完全展开 */}
      <div className="flex w-full flex-col md:flex-row gap-4">
        {/* 左侧：主消息文本区域（不滚动） */}
        <div className="flex-1">
          <div
            className={cn(
              "flex flex-col gap-4 rounded-lg px-4 py-3 shadow-md",
              isUserMessage
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                : "bg-white dark:bg-zinc-800 text-foreground border border-gray-100 dark:border-zinc-700"
            )}
          >
            {textContent.trim() ? (
              <div
                className={cn(
                  "markdown-content break-words",
                  isUserMessage ? "user-message" : "assistant-message"
                )}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "");
                      const codeContent = String(children).replace(/\n$/, "");

                      if (!inline && match) {
                        // 代码块(带语言)
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
                        // 代码块(无语言)
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
                      // 行内代码
                      return (
                        <code
                          className={cn(
                            "px-1 py-0.5 rounded text-sm",
                            isUserMessage
                              ? "bg-white/20 text-white"
                              : "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {textContent}
                </ReactMarkdown>
              </div>
            ) : isLoading ? (
              <TypingIndicator />
            ) : null}

            {/* PDF 附件 */}
            {pdfAttachments.length > 0 && (
              <div className="flex flex-col gap-2">
                {pdfAttachments.map((attachment, index) => (
                  <div
                    key={`pdf-${message.id}-${index}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md p-2",
                      isUserMessage
                        ? "bg-white/10"
                        : "bg-blue-50 dark:bg-blue-900/20"
                    )}
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm truncate">
                      {attachment.name || `Document-${index + 1}.pdf`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 图片附件 */}
            {imageAttachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageAttachments.map((attachment, index) => (
                  <Image
                    key={`image-${message.id}-${index}`}
                    src={attachment.url}
                    width={300}
                    height={300}
                    className="rounded-lg object-cover"
                    alt={attachment.name ?? `attachment-${index}`}
                  />
                ))}
              </div>
            )}

            {/* 推理显示按钮 */}
            {hasReasoningParts && !isUserMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 self-start"
                onClick={() => setIsReasoningVisible(!isReasoningVisible)}
              >
                {isReasoningVisible ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    隐藏推理过程
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    显示推理过程
                  </>
                )}
              </Button>
            )}

            {/* 推理内容 */}
            {renderReasoningContent()}
          </div>
        </div>

        {/* 右侧：工具结果区域（可滚动） */}
        <div
          className="
            md:w-72 
            flex-shrink-0 
            flex 
            flex-col 
            gap-4 
            overflow-y-auto   /* 只让右侧滚动 */
            max-h-[400px]     /* 限制高度，超过后滚动 */
            border-l 
            border-gray-200 
            dark:border-zinc-700
            p-2
          "
        >
          {hasParts &&
            message.parts.map((part, idx) => {
              if (part.type === "tool-invocation") {
                return (
                  <React.Fragment key={`tool-${idx}`}>
                    {renderToolInvocationState(part)}
                  </React.Fragment>
                );
              }
              return null;
            })}
          {/* 回退到旧的 toolInvocations */}
          {!hasParts &&
            message.toolInvocations &&
            message.toolInvocations.map((tool) => (
              <ToolResultRenderer
                key={`${tool.toolCallId}`}
                tool={tool.toolName}
                data={tool.result}
                error={tool.error}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
