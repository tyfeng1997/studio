"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Folder,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

export default function ResearchHeader() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch saved reports
  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load report by ID - now uses same page with parameter
  const loadReport = (id) => {
    // Instead of navigating to a new page, we'll just change the URL parameter
    const url = new URL(window.location);
    url.searchParams.set("report", id);
    window.history.pushState({}, "", url);

    // Trigger a page reload to fetch the report content
    window.location.reload();
  };

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
        <div className="flex items-center gap-2">
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) fetchReports();
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-zinc-800"
              >
                <Folder className="h-4 w-4 mr-2" />
                Saved Reports
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isLoading ? (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : reports.length > 0 ? (
                <ScrollArea className="max-h-[300px]">
                  {reports.map((report) => (
                    <DropdownMenuItem
                      key={report.id}
                      onClick={() => loadReport(report.id)}
                      className="cursor-pointer"
                    >
                      <span className="truncate">{report.title}</span>
                      <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </ScrollArea>
              ) : (
                <div className="p-3 text-center text-sm text-gray-500 dark:text-gray-400">
                  No saved reports found
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Financial Insights Agent
          </Button>
        </div>
      </div>
    </header>
  );
}
