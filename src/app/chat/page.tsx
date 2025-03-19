// app/chat/page.tsx
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
  MessageSquare,
  Database,
  Code,
  BrainCircuit,
  PlusCircle,
} from "lucide-react";

export default async function ChatLandingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <div className="mx-auto max-w-2xl text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          LLM Chat Assistant
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your intelligent AI assistant powered by advanced language models.
          Start a new conversation or select an existing chat from the sidebar.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col items-center rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <BrainCircuit className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">
              AI Powered Conversations
            </h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Leverage cutting-edge language models for natural, helpful
              interactions
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <Database className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Persistent Memory</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Your conversations are saved automatically and can be accessed
              anytime
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <Code className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Dynamic UI Tools</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Interactive components that adapt to your conversation needs
            </p>
          </div>

          <div className="flex flex-col items-center rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <PlusCircle className="h-8 w-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">Start a New Chat</h2>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Click the "New Chat" button in the sidebar to begin a new
              conversation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
