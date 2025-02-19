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

const RAGDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 dark:text-zinc-200 dark:hover:text-zinc-100"
        >
          <Database className="h-4 w-4" />
          Vector Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] dark:border-zinc-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold dark:text-zinc-200">
            Vector Search
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="query" className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-zinc-800">
            <TabsTrigger
              value="query"
              className="dark:text-zinc-200 dark:data-[state=active]:bg-zinc-700"
            >
              Search Documents
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="dark:text-zinc-200 dark:data-[state=active]:bg-zinc-700"
            >
              Upload Documents
            </TabsTrigger>
          </TabsList>
          <TabsContent value="query" className="mt-4">
            <WorkspaceQuery />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <WorkspaceUpload />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RAGDialog;
