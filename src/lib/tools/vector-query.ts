import { z } from "zod";
import type { ToolDefinition, ToolExecuteResult } from "@/app/types/tools";
import type { DataStreamWriter } from "ai";
import { createClient } from "@/utils/supabase/server";
import { cohere } from "@ai-sdk/cohere";
import { embedMany } from "ai";

const embeddingModel = cohere.embedding("embed-multilingual-v3.0", {
  inputType: "search_query",
  truncate: "NONE",
});

const SearchParams = z.object({
  query: z.string().describe("The search query to find similar documents"),
  workspace: z.string().describe("Workspace to scope the search"),
  topK: z
    .number()
    .default(20)
    .describe("Number of similar documents to return"),
});

export const vectorSearchTool: ToolDefinition<typeof SearchParams> = {
  name: "vector_search",
  description:
    "Search for similar documents in the vector database based on semantic meaning.",
  parameters: SearchParams,
  execute: async (
    { query, workspace, topK },
    dataStream?: DataStreamWriter
  ): Promise<ToolExecuteResult> => {
    try {
      // Input validation
      if (!query.trim()) {
        throw new Error("Search query cannot be empty");
      }

      const supabase = await createClient();

      // Check authentication
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Unauthorized");
      }

      // Log the start of search operation
      dataStream?.writeData({
        tool: "vector_search",
        content: {
          params: {
            query,
            workspace: workspace,
            topK,
          },
          timestamp: new Date().toISOString(),
        },
      });

      // Generate embedding for the query
      const { embeddings } = await embedMany({
        model: embeddingModel,
        values: [query],
      });
      console.log("current workspace", workspace);
      // Search documents using the embedding
      const { data: results, error: searchError } = await supabase.rpc(
        "search_documents",
        {
          query_embedding: embeddings[0],
          workspace_name: workspace,
          match_count: topK,
        }
      );

      if (searchError) {
        throw searchError;
      }

      // Log successful search completion
      dataStream?.writeData({
        tool: "vector_search",
        content: {
          result: `Found ${results.length} similar documents`,
          timestamp: new Date().toISOString(),
        },
      });

      // Format the results for better readability
      const formattedResults = results.map((result: any) => ({
        document_id: result.document_id,
        filename: result.filename,
        chunk_content: result.chunk_content,
        similarity: result.similarity,
      }));

      return {
        success: true,
        data: {
          results: formattedResults,
          totalFound: results.length,
        },
      };
    } catch (error) {
      console.error("Vector search error:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? `Vector search failed: ${error.message}`
            : "Failed to perform vector search",
      };
    }
  },
};
