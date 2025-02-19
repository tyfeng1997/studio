import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface WorkspaceInfo {
  workspace: string;
  document_count: number;
}

interface SearchResult {
  document_id: string;
  filename: string;
  chunk_content: string;
  similarity: number;
}

const WorkspaceQuery = () => {
  const [workspaces, setWorkspaces] = useState<WorkspaceInfo[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const response = await fetch("/api/workspaces");
      if (!response.ok) {
        throw new Error("Failed to fetch workspaces");
      }
      const data = await response.json();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError("Failed to fetch workspaces");
    }
  };

  const handleSearch = async () => {
    if (!selectedWorkspace || !query.trim()) {
      setError("Please select a workspace and enter a query");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workspace: selectedWorkspace,
          query: query.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Failed to search documents");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="text-card-foreground">Search Documents</CardTitle>
        <CardDescription className="text-muted-foreground">
          Search through your indexed documents by selecting a workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Workspace Selection */}
          <div className="space-y-2">
            <Label htmlFor="workspace" className="text-card-foreground">
              Select Workspace
            </Label>
            <Select
              value={selectedWorkspace}
              onValueChange={setSelectedWorkspace}
            >
              <SelectTrigger className="w-full bg-background border-input text-foreground">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-input">
                {workspaces.map((ws) => (
                  <SelectItem
                    key={ws.workspace}
                    value={ws.workspace}
                    className="text-popover-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {ws.workspace} ({ws.document_count} documents)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="query" className="text-card-foreground">
              Search Query
            </Label>
            <div className="flex gap-2">
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="Enter your search query and press Enter"
                className="bg-background border-input text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !selectedWorkspace || !query.trim()}
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Error Alert */}
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

          {/* Search Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-card-foreground">
                  Search Results
                </h3>
                <span className="text-sm text-muted-foreground">
                  {results.length} results found
                </span>
              </div>

              <ScrollArea className="h-[400px] rounded-md border border-input">
                <div className="p-4 space-y-4">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border border-input bg-background/50"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-card-foreground">
                          {result.filename}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {(result.similarity * 100).toFixed(2)}% match
                        </span>
                      </div>
                      <p className="text-foreground">{result.chunk_content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceQuery;
