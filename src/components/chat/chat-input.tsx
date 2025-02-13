"use client";

import * as React from "react";
import { SendHorizonal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatInputProps) {
  return (
    <form onSubmit={handleSubmit} className="relative">
      <Textarea
        value={input}
        onChange={handleInputChange}
        placeholder="Send a message..."
        className="min-h-[60px] w-full resize-none rounded-lg pr-12"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isLoading}
        className="absolute bottom-2 right-2"
      >
        <SendHorizonal className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
