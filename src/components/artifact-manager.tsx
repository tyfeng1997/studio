"use client";

import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Code,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Artifact types
const ARTIFACT_TYPES = {
  CODE: "code",
  MARKDOWN: "markdown",
  IMAGE: "image",
  FILE: "file",
};

export function ArtifactManager({
  artifacts = [],
  onClose,
  onExpand,
  expanded,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [fullscreen, setFullscreen] = useState(false);

  // Auto expand the latest artifact
  useEffect(() => {
    if (artifacts.length > 0) {
      const latestId = artifacts[artifacts.length - 1].id;
      setExpandedIds(new Set([latestId]));
    }
  }, [artifacts.length]);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getArtifactIcon = (type) => {
    switch (type) {
      case ARTIFACT_TYPES.CODE:
        return <Code className="h-4 w-4" />;
      case ARTIFACT_TYPES.MARKDOWN:
        return <FileText className="h-4 w-4" />;
      case ARTIFACT_TYPES.IMAGE:
        return <ImageIcon className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get color for artifact type badge
  const getArtifactColor = (type) => {
    switch (type) {
      case ARTIFACT_TYPES.CODE:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case ARTIFACT_TYPES.MARKDOWN:
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
      case ARTIFACT_TYPES.IMAGE:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  if (artifacts.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No artifacts generated yet
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-3 border-b sticky top-0 bg-background z-10">
        <span className="text-sm font-medium">
          Artifacts ({artifacts.length})
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onExpand}
          >
            {expanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {artifacts.map((artifact, index) => (
            <ArtifactCard
              key={artifact.id}
              artifact={artifact}
              isExpanded={expandedIds.has(artifact.id)}
              onToggle={() => toggleExpanded(artifact.id)}
              isLatest={index === artifacts.length - 1}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function ArtifactCard({ artifact, isExpanded, onToggle, isLatest }) {
  return (
    <motion.div
      initial={isLatest ? { opacity: 0, y: -10 } : false}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "border border-border rounded-lg overflow-hidden",
        isLatest ? "bg-card shadow-sm" : "bg-muted/30"
      )}
    >
      <div className="p-3 flex items-center cursor-pointer" onClick={onToggle}>
        <div className="flex items-center flex-1 min-w-0 gap-2">
          {getArtifactIcon(artifact.type)}
          <span className="text-sm font-medium truncate">{artifact.title}</span>
          <Badge
            variant="outline"
            className={cn("text-xs", getArtifactColor(artifact.type))}
          >
            {artifact.type}
          </Badge>
          {artifact.language && (
            <Badge variant="outline" className="text-xs">
              {artifact.language}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-0">
              <div className="bg-muted/50 rounded-md p-2 max-h-[400px] overflow-auto">
                <ArtifactContent artifact={artifact} />
              </div>
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="outline" className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ArtifactContent({ artifact }) {
  // Function to render different types of artifacts
  switch (artifact.type) {
    case ARTIFACT_TYPES.CODE:
      return (
        <pre className="text-xs whitespace-pre-wrap break-all overflow-x-auto">
          <code>{artifact.content}</code>
        </pre>
      );
    case ARTIFACT_TYPES.MARKDOWN:
      // Here you might want to use a markdown renderer
      return (
        <div className="text-sm whitespace-pre-wrap break-all">
          {artifact.content}
        </div>
      );
    case ARTIFACT_TYPES.IMAGE:
      return (
        <div className="flex justify-center">
          <img
            src={artifact.url}
            alt={artifact.title || "Generated image"}
            className="max-w-full rounded-md"
          />
        </div>
      );
    default:
      return (
        <div className="text-sm">
          <AlertCircle className="h-4 w-4 inline mr-2 text-yellow-500" />
          Unknown artifact type
        </div>
      );
  }
}

// Helper function that could be exported
export function getArtifactType(contentType) {
  if (contentType?.includes("code")) return ARTIFACT_TYPES.CODE;
  if (contentType?.includes("markdown")) return ARTIFACT_TYPES.MARKDOWN;
  if (contentType?.includes("image")) return ARTIFACT_TYPES.IMAGE;
  return ARTIFACT_TYPES.FILE;
}
