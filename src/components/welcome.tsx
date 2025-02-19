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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowUpload(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create New Workspace
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Upload your documents and create a searchable workspace
            </DialogDescription>
          </DialogHeader>
          <WorkspaceUpload onSuccess={handleWorkspaceCreated} />
        </DialogContent>
      </Dialog>
    </>
  );
}
