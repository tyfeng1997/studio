"use client";

import { Message } from "ai";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { FileText } from "lucide-react";
import { ToolResultRenderer } from "@/components/tools/tool-result-renderer";
import {
  ContentGeneratorIndicator,
  TypingIndicator,
} from "@/components/content-generator-indicator";

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
  onShowArtifact?: (artifactId: string) => void;
  pendingArtifacts?: Array<{
    id: string;
    type: "text" | "code" | "image" | "markdown" | "file";
    status: "generating" | "complete";
  }>;
}

export function ChatMessage({
  message,
  isLoading,
  onShowArtifact,
  pendingArtifacts = [],
}: ChatMessageProps) {
  // Separate attachments by type
  const imageAttachments =
    message?.experimental_attachments?.filter((attachment) =>
      attachment?.contentType?.startsWith("image/")
    ) || [];

  const pdfAttachments =
    message?.experimental_attachments?.filter(
      (attachment) => attachment?.contentType === "application/pdf"
    ) || [];

  // Split content to identify code blocks, etc. for artifact generation
  // This is a simplified version - in a real implementation you'd use
  // proper markdown/code block parsing
  const hasMarkdownContent =
    message.content?.includes("```") ||
    message.content?.includes("#") ||
    message.content?.length > 500;

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
        {/* Message content */}
        {message.content.trim() ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
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
