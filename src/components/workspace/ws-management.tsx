import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WorkspaceManagementProps {
  workspaces: Array<{ workspace: string; document_count: number }>;
  onWorkspaceDeleted: () => void;
}

export function WorkspaceManagement({
  workspaces,
  onWorkspaceDeleted,
}: WorkspaceManagementProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string>("");

  const handleDelete = async (workspace: string) => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/workspace/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspace }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete workspace");
      }

      onWorkspaceDeleted();
    } catch (err) {
      setError("Failed to delete workspace. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">
          Manage Workspaces
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          View and manage your existing workspaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert
            variant="destructive"
            className="mb-4 border-destructive/50 bg-destructive/10"
          >
            <AlertDescription className="text-destructive-foreground">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="rounded-md border">
          {/* Header */}
          <div className="grid grid-cols-12 border-b py-3 px-4 text-sm font-medium text-muted-foreground">
            <div className="col-span-6">Workspace Name</div>
            <div className="col-span-4 text-right">Documents</div>
            <div className="col-span-2"></div>
          </div>

          {/* Body */}
          <div className="divide-y">
            {workspaces.map((ws) => (
              <div
                key={ws.workspace}
                className="grid grid-cols-12 py-3 px-4 items-center"
              >
                <div className="col-span-6 font-medium text-card-foreground">
                  {ws.workspace}
                </div>
                <div className="col-span-4 text-right text-muted-foreground">
                  {ws.document_count}
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(ws.workspace)}
                    disabled={isDeleting}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {isDeleting && deleteTarget === ws.workspace ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
            {workspaces.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">
                No workspaces found
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this workspace? This action cannot
              be undone. All documents and their vector embeddings will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
