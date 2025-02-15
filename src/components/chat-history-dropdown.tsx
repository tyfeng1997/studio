// components/chat-history-dropdown.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Chat = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export function ChatHistoryDropdown() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadChats();
    }
  }, [open]);

  async function loadChats() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/chats");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch chats");
      }

      const chatHistory = await response.json();
      setChats(chatHistory);
    } catch (error) {
      console.error("Failed to load chats:", error);
      setError(error instanceof Error ? error.message : "Failed to load chats");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectChat(chatId: string) {
    router.push(`/chat/${chatId}`);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 font-serif">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          Chat History
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="font-serif text-lg">
          Recent Conversations
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {error ? (
            <div className="px-4 py-3 text-center text-destructive">
              {error}
            </div>
          ) : chats.length === 0 ? (
            <div className="px-4 py-3 text-center text-muted-foreground">
              {loading ? "Loading..." : "No conversations yet"}
            </div>
          ) : (
            chats.map((chat) => (
              <DropdownMenuItem
                key={chat.id}
                className="flex flex-col items-start gap-1 px-4 py-3 cursor-pointer"
                onClick={() => handleSelectChat(chat.id)}
              >
                <div className="font-medium line-clamp-1 w-full">
                  {chat.title || "New Conversation"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(chat.updated_at), {
                    addSuffix: true,
                  })}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
