"use client";

import { Github, BarChart3, LineChart, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-blue-100 dark:border-blue-900/30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 shadow-sm">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white p-1.5 transition-transform group-hover:scale-110">
              <BarChart3 className="h-full w-full" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600">
                FinanceInsight
              </span>
              <span className="text-xs text-muted-foreground">
                金融洞察·数据驱动
              </span>
            </div>
          </Link>
        </div>

        <div className="hidden md:flex space-x-1 mx-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            <LineChart className="h-4 w-4 mr-1" />
            产品特性
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            帮助文档
          </Button>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden md:inline-flex text-sm border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            联系我们
          </Button>

          <nav className="flex items-center space-x-2">
            <Link
              href="https://github.com/tyfeng1997/studio.git"
              target="_blank"
              rel="noreferrer"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </Button>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
