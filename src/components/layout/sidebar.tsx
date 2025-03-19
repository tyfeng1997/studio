"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserMenu } from "@/components/user-menu";
import { formatDistanceToNow } from "date-fns";
import { useSidebar } from "./sidebar-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

export function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const [chats, setChats] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // Fetch chat history
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/chats");
      if (!response.ok) throw new Error("Failed to fetch chats");
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchChats();

    // Set up refresh interval (every 30 seconds)
    const intervalId = setInterval(fetchChats, 30000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle new chat creation
  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to create new chat");
      }

      const data = await response.json();
      router.push(`/chat/${data.id}`);
      await fetchChats();
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("创建新对话失败");
    }
  };

  // Handle chat deletion
  const handleDeleteChat = async (chatId, e) => {
    e.preventDefault(); // Prevent navigating to the chat
    e.stopPropagation(); // Prevent event bubbling to parent elements

    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      // Show success toast
      toast.success("对话已成功删除");

      // Refresh chat list
      await fetchChats();

      // If the current chat was deleted, redirect to home
      if (pathname?.includes(chatId)) {
        router.push("/chat");
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("删除对话失败");
    }
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group relative flex h-full flex-col overflow-hidden border-r bg-background transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[280px]"
        )}
      >
        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-3 z-10 h-7 w-7 rounded-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Header section */}
        <div className="flex h-14 items-center px-4 border-b">
          {!collapsed && (
            <h2 className="mr-auto font-display font-semibold">-Logs-</h2>
          )}
        </div>

        {/* Chat list */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-4">
            {!collapsed && (
              <h3 className="px-4 text-sm font-medium text-muted-foreground">
                Recent Chats
              </h3>
            )}
            <div className="mt-2 space-y-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-4 py-2 transition-colors",
                    pathname?.includes(chat.id)
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 hover:text-accent-foreground",
                    collapsed && "px-2 justify-center"
                  )}
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <div className="flex-1 truncate text-sm">
                      <div className="truncate font-medium">
                        {chat.title || "New Conversation"}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(chat.updated_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  )}
                  {!collapsed && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  )}
                </Link>
              ))}
              {loading && !collapsed && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {!loading && chats.length === 0 && !collapsed && (
                <div className="px-4 py-3 text-sm text-muted-foreground">
                  No conversations yet
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* New Chat button at bottom */}
        <div className="border-t p-4">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-md"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Chat</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={handleNewChat}
              variant="outline"
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Chat
            </Button>
          )}
        </div>

        {/* User section at bottom */}
        <div className="mt-auto border-t p-4">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <UserMenu minimal={true} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">User Settings</TooltipContent>
            </Tooltip>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
