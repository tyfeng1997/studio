"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Code, Image as ImageIcon, Click } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ContentGeneratorIndicatorProps {
  type: "text" | "code" | "image" | "markdown" | "file";
  onClick: () => void;
  className?: string;
}

export function ContentGeneratorIndicator({
  type,
  onClick,
  className,
}: ContentGeneratorIndicatorProps) {
  // Choose the appropriate icon based on content type
  const getIcon = () => {
    switch (type) {
      case "code":
        return <Code className="h-5 w-5" />;
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "file":
      case "markdown":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Get label text based on content type
  const getLabel = () => {
    switch (type) {
      case "code":
        return "Generating code...";
      case "image":
        return "Creating image...";
      case "markdown":
        return "Formatting content...";
      case "file":
        return "Preparing file...";
      default:
        return "Generating content...";
    }
  };

  return (
    <div
      className={cn(
        "my-2 p-3 bg-muted/30 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          {getIcon()}
          <motion.div
            className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.8, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="flex-1">
          <div className="text-sm font-medium">{getLabel()}</div>
          <div className="text-xs text-muted-foreground mt-1 flex items-center">
            <Click className="h-3 w-3 mr-1" />
            Click to view in artifact panel
          </div>
        </div>

        <motion.div
          className="w-16 h-1.5 bg-muted rounded-full overflow-hidden"
          initial={{ opacity: 0.7 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// Animated typing indicator (can be used for text generation)
export function TypingIndicator() {
  return (
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
}
