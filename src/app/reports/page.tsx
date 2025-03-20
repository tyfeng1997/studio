// app/reports/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, FileText, Trash2, ArrowLeft, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Report {
  id: string;
  title: string;
  content: string;
  mode: "quick" | "detailed";
  created_at: string;
}

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch all reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        if (!response.ok) {
          throw new Error("Failed to fetch reports");
        }
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Delete a report
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      setDeleting(id);
      const response = await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      setReports(reports.filter((report) => report.id !== id));
      toast.success("Report deleted successfully");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report");
    } finally {
      setDeleting(null);
    }
  };

  // Navigate to a report
  const openReport = (id: string) => {
    router.push(`/report/${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-500" />
            <h1 className="text-xl font-semibold text-white">Report History</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/chat")}
            className="text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-zinc-300 mb-2">
              No reports yet
            </h2>
            <p className="text-zinc-500 mb-6">
              Generate your first company analysis report
            </p>
            <Button
              onClick={() => router.push("/report")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Create Report
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((report) => (
              <Card
                key={report.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 cursor-pointer transition-all"
                onClick={() => openReport(report.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {report.mode === "quick" ? (
                        <Zap className="h-4 w-4 text-purple-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500" />
                      )}
                      <span className="text-xs font-medium text-zinc-500">
                        {report.mode === "quick"
                          ? "Quick Summary"
                          : "Detailed Analysis"}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(report.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <CardTitle className="text-lg text-white">
                    {report.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-24">
                    <p className="text-sm text-zinc-400 line-clamp-3">
                      {report.content.replace(/#{1,6} /g, "").substring(0, 150)}
                      ...
                    </p>
                  </ScrollArea>
                </CardContent>
                <CardFooter className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-zinc-800"
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deleting === report.id}
                  >
                    {deleting === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
