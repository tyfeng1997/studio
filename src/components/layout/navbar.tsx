"use client";

import { Github } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ChatHistoryDropdown } from "../chat-history-dropdown";
import { UserMenu } from "../user-menu";
import RAGDialog from "../workspace/rag-config";
export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-display font-bold">LLM Chat</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-2">
            {/*TODO DELETE*/}
            <UserMenu />
            <div className="p-4">
              <ChatHistoryDropdown />
            </div>
            <RAGDialog />

            <Link
              href="https://github.com/tyfeng1997/studio.git"
              target="_blank"
              rel="noreferrer"
            >
              <div className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                <Github className="h-4 w-4" />
                <span className="ml-2">GitHub</span>
              </div>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}
