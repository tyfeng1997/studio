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
import { Loader2, Upload } from "lucide-react";

const WorkspaceUpload = () => {
  const [workspace, setWorkspace] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setSuccess("Files uploaded and indexed successfully!");
      setWorkspace("");
      setFiles(null);
    } catch (err) {
      setError("Failed to upload files. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Create Vector Index
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Upload documents to create searchable vectors for your workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="workspace" className="text-card-foreground">
              Workspace Name
            </Label>
            <Input
              id="workspace"
              type="text"
              placeholder="Enter workspace name"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              className="bg-background border-input text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files" className="text-card-foreground">
              Upload Files
            </Label>
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
                </div>
                <input
                  id="files"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => setFiles(e.target.files)}
                />
              </label>
            </div>
          </div>

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
          ) : (
            "Upload and Index Files"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WorkspaceUpload;
