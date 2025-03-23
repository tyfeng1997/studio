"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, ArrowLeft } from "lucide-react";

export default function ResearchHeader() {
  const router = useRouter();

  return (
    <header className="border-b border-gray-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-950 sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <FileText className="h-5 w-5 text-purple-500 dark:text-purple-400" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Company Research
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push("/chat")}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-zinc-800"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Financial Insights Assistant
        </Button>
      </div>
    </header>
  );
}
