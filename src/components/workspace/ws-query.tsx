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
    <Card className="dark:bg-zinc-900 dark:border-zinc-700">
      <CardHeader>
        <CardTitle className="text-zinc-900 dark:text-zinc-200">
          Search Documents
        </CardTitle>
        <CardDescription className="dark:text-zinc-400">
          Search through your indexed documents by selecting a workspace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label
              htmlFor="workspace"
              className="text-zinc-700 dark:text-zinc-300"
            >
              Select Workspace
            </Label>
            <Select
              value={selectedWorkspace}
              onValueChange={setSelectedWorkspace}
            >
              <SelectTrigger className="w-full dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                <SelectValue placeholder="Select a workspace" />
              </SelectTrigger>
              <SelectContent className="dark:border-zinc-700 dark:bg-zinc-800">
                {workspaces.map((ws) => (
                  <SelectItem
                    key={ws.workspace}
                    value={ws.workspace}
                    className="dark:text-zinc-200 dark:focus:bg-zinc-700"
                  >
                    {ws.workspace} ({ws.document_count} documents)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="query" className="text-zinc-700 dark:text-zinc-300">
              Search Query
            </Label>
            <div className="flex gap-2">
              <Input
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your search query"
                className="dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-400"
              />
              <Button
                onClick={handleSearch}
                disabled={loading || !selectedWorkspace || !query.trim()}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <Alert
              variant="destructive"
              className="dark:bg-red-900/20 dark:text-red-200"
            >
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-200">
                Search Results
              </h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800/50"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {result.filename}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {(result.similarity * 100).toFixed(2)}% match
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300">
                    {result.chunk_content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkspaceQuery;
