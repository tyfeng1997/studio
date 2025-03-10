"use client";

import { useEffect, useState } from "react";
import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText, Code, ExternalLink, Share2 } from "lucide-react";
import { ToolResultRenderer } from "@/components/tools/tool-result-renderer";
import {
  ContentGeneratorIndicator,
  TypingIndicator,
} from "@/components/artifact-manager";
import { Button } from "@/components/ui/button";

// 在ChatMessage组件中增加内容过滤逻辑
function filterMessageContent(content) {
  if (!content) return { visibleContent: "", hasSpecialContent: false };

  // 检查是否包含代码块
  const codeBlockRegex = /```[\s\S]*?```/g;
  const hasCodeBlock = codeBlockRegex.test(content);

  if (hasCodeBlock) {
    // 提取所有代码块
    const codeBlockMatches = content.match(codeBlockRegex) || [];
    let processedContent = content;

    // 替换每个代码块为占位符
    codeBlockMatches.forEach((match, index) => {
      const placeholder = `\n\n[代码块 #${index + 1}]\n\n`;
      processedContent = processedContent.replace(match, placeholder);
    });

    return {
      visibleContent: processedContent,
      hasCodeBlock: true,
      codeBlocks: codeBlockMatches,
      fullContent: content,
    };
  }

  // 检查是否是长文本或复杂markdown (包含多个标题)
  const headingCount = (content.match(/#/g) || []).length;
  if (content.length > 800 || headingCount > 2) {
    // 提取前150个字符作为摘要
    const firstParagraphMatch = content.match(/^(.*?)(\n\n|$)/);
    const firstParagraph = firstParagraphMatch
      ? firstParagraphMatch[1]
      : content.slice(0, 150);

    let summary = firstParagraph;
    if (summary.length < 150 && content.length > summary.length) {
      summary += "...";
    }

    return {
      visibleContent: summary,
      hasLongContent: true,
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

  // 当消息内容更新时重新过滤
  useEffect(() => {
    setFilteredContent(filterMessageContent(message.content));
  }, [message.content]);

  // 在组件挂载时检测是否需要生成artifacts
  useEffect(() => {
    if (
      !artifactsGenerated &&
      message.role === "assistant" &&
      filteredContent.hasSpecialContent
    ) {
      generateArtifactsFromContent();
      setArtifactsGenerated(true);
    }
  }, [filteredContent, artifactsGenerated, message.role]);

  // 生成artifacts的函数
  const generateArtifactsFromContent = () => {
    if (filteredContent.hasCodeBlock && filteredContent.codeBlocks) {
      // 为每个代码块生成一个单独的artifact
      filteredContent.codeBlocks.forEach((codeBlock, index) => {
        const languageMatch = codeBlock.match(/```(\w*)\n/);
        const language = languageMatch ? languageMatch[1] : "plaintext";
        const code = codeBlock.replace(/```(\w*)\n/, "").replace(/```$/, "");

        const artifactId = `code-${message.id}-${index}`;
        onShowArtifact?.(artifactId, code, "code", language);
      });
    } else if (filteredContent.hasLongContent) {
      // 为长文本生成一个markdown artifact
      const artifactId = `markdown-${message.id}`;
      onShowArtifact?.(artifactId, filteredContent.fullContent, "markdown");
    }
  };

  // 处理"查看完整内容"按钮点击
  const handleViewFullContent = () => {
    const artifactId = artifactIds[message.id] || `markdown-${message.id}`;
    onShowArtifact?.(artifactId, filteredContent.fullContent, "markdown");
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

  return (
    <div
      className={cn(
        "group relative mb-4 flex items-start md:mb-6",
        message.role === "user" ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-4 rounded-lg px-4 py-3",
          message.role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted",
          "shadow-md"
        )}
      >
        {/* Message content - 根据过滤后的内容显示 */}
        {filteredContent.visibleContent.trim() ? (
          <div className="whitespace-pre-wrap">
            {filteredContent.visibleContent}
          </div>
        ) : isLoading ? (
          <TypingIndicator />
        ) : null}

        {/* 如果有被过滤的内容，显示查看完整内容按钮 */}
        {(filteredContent.hasCodeBlock || filteredContent.hasLongContent) && (
          <div className="flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewFullContent}
              className="flex items-center gap-1 text-xs"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {filteredContent.hasCodeBlock ? "查看完整代码" : "查看完整内容"}
            </Button>
          </div>
        )}

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
                  message.role === "user"
                    ? "bg-primary-foreground/10"
                    : "bg-background"
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
