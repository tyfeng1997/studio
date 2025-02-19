"use client";
import { usePathname } from "next/navigation"; // 添加这个导入

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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Clock, Loader2, Trash2 } from "lucide-react";
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
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // 使用 usePathname hook

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

  async function handleDeleteChat(chatId: string) {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      await loadChats();
      // 使用 pathname 替代 router.pathname
      if (pathname?.includes(chatId)) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
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
                  className="flex items-center justify-between gap-2 px-4 py-3 cursor-pointer"
                  onClick={() => handleSelectChat(chat.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium line-clamp-1">
                      {chat.title || "New Conversation"}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(chat.updated_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      stopPropagation(e);
                      setDeleteTarget(chat.id);
                    }}
                  >
                    {isDeleting && deleteTarget === chat.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuItem>
              ))
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDeleteChat(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
