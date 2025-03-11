"use client";

import { useEffect, useState, useRef } from "react";
import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText, Code, ExternalLink } from "lucide-react";
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

// 新的过滤逻辑：只过滤代码块，不过滤常规 Markdown
function filterMessageContent(content) {
  if (!content) return { visibleContent: content, hasSpecialContent: false };

  // 检查是否包含代码块
  const codeBlockRegex = /```[\s\S]*?```/g;
  const hasCodeBlock = codeBlockRegex.test(content);

  if (hasCodeBlock) {
    // 我们现在不替换代码块，而是提取它们用于可能的 Artifact 生成
    const codeBlockMatches = content.match(codeBlockRegex) || [];

    return {
      visibleContent: content, // 保留完整内容用于渲染
      hasCodeBlock: true,
      codeBlocks: codeBlockMatches,
      fullContent: content,
    };
  }

  // 正常内容直接返回
  return {
    visibleContent: content,
    hasSpecialContent: false,
    fullContent: content,
  };
}

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
  artifactIds?: Record<string, string>; // 消息ID到对应的artifactID的映射
}

export function ChatMessage({
  message,
  isLoading,
  onShowArtifact,
  pendingArtifacts = [],
  artifactIds = {},
}: ChatMessageProps) {
  const [filteredContent, setFilteredContent] = useState(() =>
    filterMessageContent(message.content)
  );
  const [artifactsGenerated, setArtifactsGenerated] = useState(false);
  // 使用 ref 来跟踪已生成的 artifact 的 ID，避免重复生成
  const generatedArtifactIds = useRef(new Set());

  // 当消息内容更新时重新过滤
  useEffect(() => {
    setFilteredContent(filterMessageContent(message.content));
  }, [message.content]);

  // 仅为代码块创建 Artifacts（不为普通 Markdown 创建）
  useEffect(() => {
    if (
      !artifactsGenerated &&
      message.role === "assistant" &&
      filteredContent.hasCodeBlock
    ) {
      generateArtifactsFromContent();
      setArtifactsGenerated(true);
    }
  }, [filteredContent, artifactsGenerated, message.role]);

  // 生成artifacts的函数 - 仅为代码块生成，并确保不重复生成
  const generateArtifactsFromContent = () => {
    if (filteredContent.hasCodeBlock && filteredContent.codeBlocks) {
      // 为每个代码块生成一个单独的 artifact
      filteredContent.codeBlocks.forEach((codeBlock, index) => {
        const artifactId = `code-${message.id}-${index}`;

        // 检查是否已经生成过这个 artifact
        if (generatedArtifactIds.current.has(artifactId)) {
          return;
        }

        const languageMatch = codeBlock.match(/```(\w*)\n/);
        const language = languageMatch ? languageMatch[1] : "plaintext";
        const code = codeBlock.replace(/```(\w*)\n/, "").replace(/```$/, "");

        onShowArtifact?.(artifactId, code, "code", language);
        generatedArtifactIds.current.add(artifactId);
      });
    }
  };

  // 处理"复制代码"按钮点击
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code).then(
      () => console.log("Code copied to clipboard"),
      (err) => console.error("Could not copy code: ", err)
    );
  };

  // 处理"在Artifacts中查看"按钮点击
  const handleViewInArtifacts = (index) => {
    const artifactId = `code-${message.id}-${index}`;
    const codeBlock = filteredContent.codeBlocks?.[index];
    if (codeBlock) {
      const languageMatch = codeBlock.match(/```(\w*)\n/);
      const language = languageMatch ? languageMatch[1] : "plaintext";
      const code = codeBlock.replace(/```(\w*)\n/, "").replace(/```$/, "");
      onShowArtifact?.(artifactId, code, "code", language);
    }
  };

  // Separate attachments by type
  const imageAttachments =
    message?.experimental_attachments?.filter((attachment) =>
      attachment?.contentType?.startsWith("image/")
    ) || [];

  const pdfAttachments =
    message?.experimental_attachments?.filter(
      (attachment) => attachment?.contentType === "application/pdf"
    ) || [];

  // 根据消息角色计算样式
  const isUserMessage = message.role === "user";

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
        {/* 使用 ReactMarkdown 渲染消息内容 */}
        {filteredContent.visibleContent.trim() ? (
          <div
            className={cn(
              "markdown-content", // 自定义类，将在下面实现
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
                    // 生成一个稳定唯一的键，包含消息ID、代码内容哈希
                    const codeHash = String(codeContent)
                      .slice(0, 20)
                      .replace(/\s+/g, "");
                    const uniqueKey = `code-${message.id}-${match[1]}-${codeHash}`;

                    return (
                      <div
                        className="relative my-2 rounded-md overflow-hidden"
                        key={uniqueKey}
                      >
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
                              onClick={() => {
                                // 找到当前代码块在所有代码块中的索引
                                const index =
                                  filteredContent.codeBlocks?.findIndex(
                                    (block) => block.includes(codeContent)
                                  );
                                if (index !== undefined && index >= 0) {
                                  handleViewInArtifacts(index);
                                }
                              }}
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
                            fontSize: "14px", // 添加这一行来设置字体大小
                            lineHeight: "1.5", // 可选，添加行高以提高可读性
                          }}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  } else if (!inline) {
                    // 无语言标记的代码块
                    const codeHash = String(codeContent)
                      .slice(0, 20)
                      .replace(/\s+/g, "");
                    const uniqueKey = `code-${message.id}-plain-${codeHash}`;

                    return (
                      <div
                        className="relative my-2 rounded-md overflow-hidden"
                        key={uniqueKey}
                      >
                        <div className="flex justify-between items-center py-1 px-3 bg-zinc-800 text-zinc-200 text-xs">
                          <span>代码</span>
                          <button
                            onClick={() => handleCopyCode(codeContent)}
                            className="hover:text-white"
                          >
                            复制
                          </button>
                        </div>
                        // 对于无语言的代码块也做相同修改
                        <SyntaxHighlighter
                          language="text"
                          style={oneDark}
                          customStyle={{
                            margin: 0,
                            borderRadius: 0,
                            fontSize: "14px", // 添加这一行来设置字体大小
                            lineHeight: "1.5", // 可选，添加行高以提高可读性
                          }}
                        >
                          {codeContent}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }

                  // 内联代码 - 确保在用户消息和暗色主题下都有良好的对比度
                  const inlineKey = `inline-${message.id}-${String(
                    children
                  ).slice(0, 10)}`;
                  return (
                    <code
                      className={cn(
                        "px-1 py-0.5 rounded text-sm",
                        isUserMessage
                          ? "bg-white/20 text-white" // 用户消息中的内联代码
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100" // 助手消息中的内联代码
                      )}
                      key={inlineKey}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // 自定义其他 Markdown 元素样式，确保在用户消息中有足够的对比度
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
                a: ({ href, children }) => {
                  const linkKey = `link-${message.id}-${href
                    ?.toString()
                    .slice(0, 10)}`;
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "hover:underline",
                        isUserMessage
                          ? "text-blue-200" // 用户消息中的链接
                          : "text-blue-600 dark:text-blue-400" // 助手消息中的链接
                      )}
                      key={linkKey}
                    >
                      {children}
                    </a>
                  );
                },
                blockquote: ({ children }) => (
                  <blockquote
                    className={cn(
                      "pl-3 italic my-2 border-l-4",
                      isUserMessage
                        ? "border-white/30" // 用户消息中的引用
                        : "border-zinc-300 dark:border-zinc-700" // 助手消息中的引用
                    )}
                  >
                    {children}
                  </blockquote>
                ),
              }}
            >
              {filteredContent.visibleContent}
            </ReactMarkdown>
          </div>
        ) : isLoading ? (
          <TypingIndicator />
        ) : null}

        {/* Pending artifact indicators */}
        {pendingArtifacts.map((artifact) => (
          <ContentGeneratorIndicator
            key={artifact.id}
            type={artifact.type}
            onClick={() => onShowArtifact?.(artifact.id)}
          />
        ))}

        {/* Display PDF attachments */}
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

        {/* Display image attachments */}
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

        {/* Display tool results */}
        {message.toolInvocations?.map((tool) => (
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
