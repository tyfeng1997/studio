import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FolderPlus, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import WorkspaceUpload from "@/components/workspace/ws-uploader";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WelcomeViewProps {
  workspaces: Array<{ workspace: string; document_count: number }>;
  onWorkspaceSelect: (workspace: string) => void;
  onWorkspaceCreated: () => void;
}

export function WelcomeView({
  workspaces,
  onWorkspaceSelect,
  onWorkspaceCreated,
}: WelcomeViewProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadMode, setUploadMode] = useState<"new" | "existing">("new");

  const handleWorkspaceCreated = () => {
    setShowUpload(false);
    onWorkspaceCreated();
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center space-y-8 p-8">
        <div className="text-center space-y-2 max-w-2xl">
          <h1 className="text-2xl font-bold text-card-foreground">
            Welcome to AI Assistant
          </h1>
          <p className="text-muted-foreground">
            I can help you search through your documents and answer questions
            based on your content.
          </p>
        </div>

        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              Workspaces
            </CardTitle>
            <CardDescription>
              Select a workspace or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select onValueChange={onWorkspaceSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.workspace} value={ws.workspace}>
                    {ws.workspace} ({ws.document_count} documents)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setUploadMode("existing");
                  setShowUpload(true);
                }}
                disabled={workspaces.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Files
              </Button>

              <div className="relative px-2 flex items-center">
                <span className="text-xs uppercase text-muted-foreground">
                  or
                </span>
              </div>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setUploadMode("new");
                  setShowUpload(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {uploadMode === "new"
                ? "Create New Workspace"
                : "Add Files to Workspace"}
            </DialogTitle>
            <DialogDescription>
              {uploadMode === "new"
                ? "Upload your documents and create a searchable workspace"
                : "Add more documents to your existing workspace"}
            </DialogDescription>
          </DialogHeader>
          <WorkspaceUpload
            onSuccess={handleWorkspaceCreated}
            workspaces={workspaces}
            defaultMode={uploadMode}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
