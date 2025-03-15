"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Loader2,
  Trash2,
} from "lucide-react";
import { ToolResultRenderer } from "@/components/tool-result-render";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { motion, AnimatePresence } from "framer-motion";

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

  // 检查消息是否有 parts 属性且包含推理部分
  const hasParts =
    !!message.parts && Array.isArray(message.parts) && message.parts.length > 0;

  // 提取文本内容和推理内容
  const textContent = hasParts
    ? message.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join("")
    : message.content || "";

  const reasoningParts = hasParts
    ? message.parts.filter(
        (part) => part.type === "reasoning" || part.type === "thinking"
      )
    : [];

  const hasReasoningParts = reasoningParts.length > 0;

  // 是否是用户消息
  const isUserMessage = message.role === "user";

  // 附件处理
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
      <div className="bg-zinc-100 dark:bg-zinc-900 rounded-md p-3 mt-2 text-sm border border-zinc-200 dark:border-zinc-800 overflow-auto max-h-[300px]">
        {reasoningParts.map((part, index) => {
          if (part.details && Array.isArray(part.details)) {
            return (
              <div key={`reasoning-${index}`}>
                {part.details.map((detail, detailIndex) => (
                  <div key={`detail-${detailIndex}`} className="mb-2">
                    {detail.type === "text" && detail.text && (
                      <div className="text-zinc-800 dark:text-zinc-300">
                        {detail.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          } else if (part.reasoning) {
            // 处理不同结构的推理
            return (
              <div
                key={`reasoning-${index}`}
                className="text-zinc-800 dark:text-zinc-300"
              >
                {typeof part.reasoning === "string"
                  ? part.reasoning
                  : JSON.stringify(part.reasoning)}
              </div>
            );
          } else {
            // 最后的备选方案
            return (
              <div
                key={`reasoning-${index}`}
                className="text-zinc-800 dark:text-zinc-300"
              >
                <pre>{JSON.stringify(part, null, 2)}</pre>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // 渲染工具调用状态的动画
  const renderToolInvocationState = (part) => {
    switch (part.toolInvocation.state) {
      case "partial-call":
        return (
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            className="bg-zinc-100 dark:bg-zinc-800 rounded-md p-3 my-2 border border-zinc-200 dark:border-zinc-700"
          >
            <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                准备工具: {part.toolInvocation.toolName}
              </span>
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-400 overflow-x-auto">
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
            className="bg-blue-50 dark:bg-blue-950/30 rounded-md p-3 my-2 border border-blue-200 dark:border-blue-900"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="font-medium">
                执行工具: {part.toolInvocation.toolName}
              </span>
            </div>
            {part.toolInvocation.args && (
              <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-2 overflow-x-auto">
                <pre className="text-xs">
                  {JSON.stringify(part.toolInvocation.args, null, 2)}
                </pre>
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
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
        // 使用 ToolResultRenderer 来渲染结果，结合动画效果
        return (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="my-2"
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

  // Simple typing indicator component
  const TypingIndicator = () => (
    <div className="flex items-center gap-1 py-1">
      <motion.div
        className="h-1.5 w-1.5 bg-primary rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.2 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-primary rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.3 }}
      />
      <motion.div
        className="h-1.5 w-1.5 bg-primary rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 0.4 }}
      />
    </div>
  );

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start md:mb-6",
        isUserMessage ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-4 rounded-lg px-4 py-3 shadow-md",
          isUserMessage
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {/* 消息内容 */}
        {textContent.trim() ? (
          <div
            className={cn(
              "markdown-content",
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
                        "px-1 py-0.5 rounded text-sm",
                        isUserMessage
                          ? "bg-white/20 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
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
                li: ({ children }) => <li className="mb-1">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote
                    className={cn(
                      "pl-3 italic my-2 border-l-4",
                      isUserMessage
                        ? "border-white/30"
                        : "border-zinc-300 dark:border-zinc-700"
                    )}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {textContent}
            </ReactMarkdown>
          </div>
        ) : isLoading ? (
          <TypingIndicator />
        ) : null}

        {/* 动态渲染工具调用部分 */}
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

        {/* 推理显示按钮 */}
        {hasReasoningParts && !isUserMessage && (
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground self-start"
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
                    : "bg-background dark:bg-zinc-800"
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

        {/* 工具调用结果 - 只在没有 parts 的情况下使用，避免重复显示 */}
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
  );
}
