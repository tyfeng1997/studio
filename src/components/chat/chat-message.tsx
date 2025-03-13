"use client";

import * as React from "react";
import { useEffect, useState, useRef } from "react";
import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { ToolResultRenderer } from "@/components/tool-result-render";
import {
  ContentGeneratorIndicator,
  TypingIndicator,
} from "@/components/artifact-manager";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onShowArtifact?: (
    artifactId: string,
    content?: string,
    type?: string,
    language?: string
  ) => void;
  pendingArtifacts?: Array<{
    id: string;
    type: "text" | "code" | "image" | "markdown" | "file";
    status: "generating" | "complete";
  }>;
  artifactIds?: Record<string, string>;
  onReload?: () => void;
  isLastMessage?: boolean;
  status?: string;
}

export function ChatMessage({
  message,
  isLoading,
  onShowArtifact,
  pendingArtifacts = [],
  artifactIds = {},
  onReload,
  isLastMessage = false,
  status,
}: ChatMessageProps) {
  const [isReasoningVisible, setIsReasoningVisible] = useState(false);
  const [artifactsGenerated, setArtifactsGenerated] = useState(false);
  const generatedArtifactIds = useRef(new Set());

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

  // 代码块正则表达式
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;

  // 处理代码块生成 artifacts
  useEffect(() => {
    if (!artifactsGenerated && message.role === "assistant" && textContent) {
      const codeBlocks = [...textContent.matchAll(codeBlockRegex)];
      if (codeBlocks.length > 0) {
        codeBlocks.forEach((match, index) => {
          const [fullMatch, language, code] = match;
          const artifactId = `code-${message.id}-${index}`;

          // 检查是否已生成
          if (generatedArtifactIds.current.has(artifactId)) return;

          onShowArtifact?.(artifactId, code, "code", language || "plaintext");
          generatedArtifactIds.current.add(artifactId);
        });
        setArtifactsGenerated(true);
      }
    }
  }, [
    textContent,
    artifactsGenerated,
    message.role,
    message.id,
    onShowArtifact,
  ]);

  // 处理代码复制
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(
      () => console.log("Code copied"),
      (err) => console.error("Copy failed", err)
    );
  };

  // 处理在 artifacts 中查看
  const handleViewInArtifacts = (code, language) => {
    const artifactId = `code-${message.id}-${Date.now()}`;
    onShowArtifact?.(artifactId, code, "code", language || "plaintext");
  };

  // 是否是用户消息
  const isUserMessage = message.role === "user";

  // 是否显示重新生成按钮 - 支持多种可能的状态名称
  const showReloadButton =
    !isUserMessage &&
    isLastMessage &&
    (status === "ready" ||
      status === "completed" ||
      status === "done" ||
      !isLoading);

  // 调试信息
  React.useEffect(() => {
    if (!isUserMessage && isLastMessage) {
      console.log(`Message ${message.id} conditions:`, {
        isUserMessage,
        isLastMessage,
        status,
        shouldShowButton: showReloadButton,
      });
    }
  }, [isUserMessage, isLastMessage, status, showReloadButton, message.id]);

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
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyCode(codeContent)}
                              className="hover:text-white"
                            >
                              复制
                            </button>
                            <button
                              onClick={() =>
                                handleViewInArtifacts(codeContent, match[1])
                              }
                              className="hover:text-white"
                            >
                              在Artifacts中查看
                            </button>
                          </div>
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
                        <div className="flex justify-between items-center py-1 px-3 bg-zinc-800 text-zinc-200 text-xs">
                          <span>代码</span>
                          <button
                            onClick={() => handleCopyCode(codeContent)}
                            className="hover:text-white"
                          >
                            复制
                          </button>
                        </div>
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

        {/* Pending artifact indicators */}
        {pendingArtifacts.map((artifact) => (
          <ContentGeneratorIndicator
            key={artifact.id}
            type={artifact.type}
            onClick={() => onShowArtifact?.(artifact.id)}
          />
        ))}

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

        {/* 工具调用结果 */}
        {message.toolInvocations?.map((tool) => (
          <ToolResultRenderer
            key={`${tool.toolCallId}`}
            tool={tool.toolName}
            data={tool.result}
            error={tool.error}
          />
        ))}

        {/* 重新生成按钮 - 始终为非用户消息显示 */}
        {!isUserMessage && (
          <div className="flex justify-end mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={onReload}
              // 禁用条件：正在加载或不是最后一条消息
              disabled={isLoading || !isLastMessage}
            >
              <RefreshCw className="h-3 w-3" />
              重新生成
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
