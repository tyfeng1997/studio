"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Download, Check, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReportProps {
  reports: { id: string; content: string }[];
  onClose: () => void;
}

export function Report({ reports, onClose }: ReportProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<string>(
    reports.length > 0 ? reports[0].id : ""
  );

  React.useEffect(() => {
    if (reports.length > 0 && !reports.some((r) => r.id === activeTab)) {
      setActiveTab(reports[0].id);
    }
  }, [reports, activeTab]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const downloadReport = (content: string, index: number) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${index + 1}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (reports.length === 0) {
    return (
      <div className="h-full flex items-center justify-center flex-col text-center p-4">
        <p className="text-muted-foreground">No reports available yet</p>
        <p className="text-sm text-muted-foreground mt-2">
          Reports will appear here when generated in the conversation
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border-r">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-medium">Reports</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList
          className="grid mx-4 mt-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(reports.length, 4)}, 1fr)`,
          }}
        >
          {reports.map((report, index) => (
            <TabsTrigger key={report.id} value={report.id}>
              Report {index + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {reports.map((report, index) => (
          <TabsContent
            key={report.id}
            value={report.id}
            className="flex-1 flex flex-col"
          >
            <div className="flex justify-end gap-2 p-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(report.content)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadReport(report.content, index)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download report</TooltipContent>
              </Tooltip>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="whitespace-pre-wrap">{report.content}</div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
