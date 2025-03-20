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
  LineChart,
  FileText,
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
    router.push(`/chat`);
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

  // Get a random icon for each chat based on chat ID
  const getChatIcon = (chatId) => {
    const sum = chatId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const icons = [
      <MessageSquare
        key="message"
        className="h-4 w-4 text-blue-500 dark:text-blue-400"
      />,
      <LineChart
        key="chart"
        className="h-4 w-4 text-green-500 dark:text-green-400"
      />,
      <FileText
        key="file"
        className="h-4 w-4 text-purple-500 dark:text-purple-400"
      />,
    ];
    return icons[sum % icons.length];
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "group relative flex h-full flex-col overflow-hidden border-r border-blue-100 dark:border-blue-900/30 bg-white dark:bg-zinc-900 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[280px]"
        )}
      >
        {/* Collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-3 z-10 h-7 w-7 rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>

        {/* Header section */}
        <div className="flex h-14 items-center px-4 border-b border-blue-100 dark:border-blue-900/30 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900">
          {!collapsed && (
            <div className="flex items-center">
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-2">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <h2 className="mr-auto font-display font-semibold text-blue-900 dark:text-blue-100">
                金融洞察
              </h2>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto h-6 w-6 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Chat list and New Chat button moved inside ScrollArea */}
        <ScrollArea className="flex-1">
          <div className="px-2 py-4">
            {/* New Chat button moved here, above Recent Chats */}
            <div className="mb-4 px-2">
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleNewChat}
                      className="h-9 w-9 rounded-md mx-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">新对话</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  onClick={handleNewChat}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新对话
                </Button>
              )}
            </div>

            {!collapsed && (
              <div className="px-4 mb-2">
                <div className="flex items-center">
                  <div className="h-1 flex-1 bg-gradient-to-r from-blue-500/20 to-transparent"></div>
                  <h3 className="px-2 text-sm font-medium text-blue-700 dark:text-blue-400">
                    最近对话
                  </h3>
                  <div className="h-1 flex-1 bg-gradient-to-l from-blue-500/20 to-transparent"></div>
                </div>
              </div>
            )}
            <div className="mt-2 space-y-1">
              {chats.map((chat) => (
                <Link
                  key={chat.id}
                  href={`/chat/${chat.id}`}
                  className={cn(
                    "group flex items-center gap-2 rounded-md px-4 py-2 transition-all duration-200",
                    pathname?.includes(chat.id)
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-2 border-blue-500"
                      : "hover:bg-blue-50/50 dark:hover:bg-blue-900/10 hover:text-blue-700 dark:hover:text-blue-300",
                    collapsed && "px-2 justify-center"
                  )}
                >
                  {getChatIcon(chat.id)}
                  {!collapsed && (
                    <div className="flex-1 truncate text-sm">
                      <div className="truncate font-medium">
                        {chat.title || "新对话"}
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
                      className="ml-auto h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Link>
              ))}
              {loading && !collapsed && (
                <div className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
                  加载中...
                </div>
              )}
              {!loading && chats.length === 0 && !collapsed && (
                <div className="px-4 py-6 text-sm text-center text-muted-foreground">
                  <div className="mb-2 opacity-70">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2" />
                    暂无对话
                  </div>
                  <p className="text-xs opacity-70">点击"新对话"按钮开始</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* User section at bottom */}
        <div className="mt-auto border-t border-blue-100 dark:border-blue-900/30 p-4 bg-gradient-to-r from-blue-50 to-white dark:from-blue-950/20 dark:to-zinc-900">
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex justify-center">
                  <UserMenu minimal={true} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">用户设置</TooltipContent>
            </Tooltip>
          ) : (
            <UserMenu />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
