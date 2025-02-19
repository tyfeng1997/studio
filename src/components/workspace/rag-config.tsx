import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Database } from "lucide-react";
import WorkspaceUpload from "./ws-uploader";
import WorkspaceQuery from "./ws-query";
import { WorkspaceManagement } from "./ws-management";

const RAGDialog = () => {
  const [workspaces, setWorkspaces] = React.useState<
    Array<{ workspace: string; document_count: number }>
  >([]);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (response.ok) {
        const data = await response.json();
        setWorkspaces(data.workspaces);
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error);
    }
  };

  React.useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleWorkspaceChange = () => {
    fetchWorkspaces();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 dark:text-zinc-200 dark:hover:text-zinc-100"
        >
          <Database className="h-4 w-4" />
          Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-zinc-200">
            Workspace Management
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-3 dark:bg-zinc-800">
            <TabsTrigger
              value="manage"
              className="dark:text-zinc-200 dark:data-[state=active]:bg-zinc-700"
            >
              Manage Workspaces
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="dark:text-zinc-200 dark:data-[state=active]:bg-zinc-700"
            >
              Create/Update Workspace
            </TabsTrigger>
            <TabsTrigger
              value="query"
              className="dark:text-zinc-200 dark:data-[state=active]:bg-zinc-700"
            >
              Search Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="mt-4">
            <WorkspaceManagement
              workspaces={workspaces}
              onWorkspaceDeleted={handleWorkspaceChange}
            />
          </TabsContent>

          <TabsContent value="upload" className="mt-4">
            <WorkspaceUpload
              workspaces={workspaces}
              onSuccess={handleWorkspaceChange}
            />
          </TabsContent>

          <TabsContent value="query" className="mt-4">
            <WorkspaceQuery workspaces={workspaces} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RAGDialog;
