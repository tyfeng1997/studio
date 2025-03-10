import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, FileType } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface WorkspaceUploadProps {
  onSuccess?: () => void;
  workspaces?: Array<{ workspace: string; document_count: number }>;
  defaultMode?: "new" | "existing";
}

const ACCEPTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/plain": ".txt",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const WorkspaceUpload = ({
  onSuccess,
  workspaces = [],
  defaultMode,
}: WorkspaceUploadProps) => {
  const [mode, setMode] = useState<"new" | "existing">(defaultMode || "new");
  const [workspace, setWorkspace] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const validateFiles = (fileList: FileList): string | null => {
    const files = Array.from(fileList);

    // Check file types
    const invalidFiles = files.filter(
      (file) => !Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)
    );
    if (invalidFiles.length > 0) {
      return `Invalid file type(s): ${invalidFiles
        .map((f) => f.name)
        .join(", ")}. 
              Only PDF, DOCX, and TXT files are supported.`;
    }

    // Check file sizes
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      return `File(s) too large: ${oversizedFiles
        .map((f) => f.name)
        .join(", ")}. 
              Maximum file size is 10MB.`;
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const error = validateFiles(fileList);
    if (error) {
      setError(error);
      e.target.value = ""; // Reset input
      return;
    }

    setFiles(fileList);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace.trim() || !files?.length) {
      setError("Please provide both workspace name and files");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    const formData = new FormData();
    formData.append("workspace", workspace);
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch("/api/workspace/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Upload failed");
      }

      const data = await response.json();
      setSuccess("Files uploaded and indexed successfully!");
      setWorkspace("");
      setFiles(null);
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload files. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          {mode === "new" ? "Create Vector Index" : "Add to Existing Workspace"}
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          {mode === "new"
            ? "Upload documents to create a new searchable workspace"
            : "Add more documents to an existing workspace"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mode Selection */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={mode === "new" ? "default" : "outline"}
              onClick={() => setMode("new")}
              className={cn(
                "flex-1",
                mode === "new" && "bg-primary text-primary-foreground"
              )}
            >
              New Workspace
            </Button>
            <Button
              type="button"
              variant={mode === "existing" ? "default" : "outline"}
              onClick={() => setMode("existing")}
              disabled={workspaces.length === 0}
              className={cn(
                "flex-1",
                mode === "existing" && "bg-primary text-primary-foreground"
              )}
            >
              Existing Workspace
            </Button>
          </div>

          {/* Workspace Input */}
          <div className="space-y-2">
            <Label htmlFor="workspace" className="text-card-foreground">
              Workspace Name
            </Label>
            {mode === "new" ? (
              <Input
                id="workspace"
                type="text"
                placeholder="Enter workspace name"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              />
            ) : (
              <Select value={workspace} onValueChange={setWorkspace}>
                <SelectTrigger className="w-full bg-background border-input">
                  <SelectValue placeholder="Select workspace" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((ws) => (
                    <SelectItem key={ws.workspace} value={ws.workspace}>
                      {ws.workspace} ({ws.document_count} documents)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="files" className="text-card-foreground">
              Upload Files
            </Label>
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="files"
                  className="flex flex-col items-center justify-center w-full h-32 
                    border-2 border-dashed rounded-lg cursor-pointer
                    border-input hover:bg-accent hover:bg-opacity-50
                    transition-colors duration-200"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {files?.length
                        ? `${files.length} files selected`
                        : "Drop files here or click to upload"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Supported formats: PDF, DOCX, TXT (Max 10MB per file)
                    </p>
                  </div>
                  <input
                    id="files"
                    type="file"
                    multiple
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {files && files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    Selected Files:
                  </p>
                  <div className="space-y-1">
                    {Array.from(files).map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center text-sm text-muted-foreground"
                      >
                        <FileType className="w-4 h-4 mr-2" />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert
              variant="destructive"
              className="border-destructive/50 bg-destructive/10"
            >
              <AlertDescription className="text-destructive-foreground">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/50 bg-green-500/10 dark:border-green-900/50 dark:bg-green-900/20">
              <AlertDescription className="text-green-700 dark:text-green-300">
                {success}
              </AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={uploading || !workspace || !files?.length}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90
            disabled:bg-muted disabled:text-muted-foreground"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : mode === "new" ? (
            "Create and Index"
          ) : (
            "Upload to Workspace"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkspaceUpload;
