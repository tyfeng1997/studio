import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cohere } from "@ai-sdk/cohere";
import { embedMany } from "ai";

const embeddingModel = cohere.embedding("embed-multilingual-v3.0", {
  inputType: "search_query",
  truncate: "NONE",
});
export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace, query } = await request.json();

    if (!workspace || !query) {
      return NextResponse.json(
        { error: "Workspace and query are required" },
        { status: 400 }
      );
    }

    // Generate embedding for the query
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: [query],
    });

    // Search documents using the embedding
    const { data: results, error: searchError } = await supabase.rpc(
      "search_documents",
      {
        query_embedding: embeddings[0],
        workspace_name: workspace,
        match_count: 10,
      }
    );

    if (searchError) {
      throw searchError;
    }

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search documents" },
      { status: 500 }
    );
  }
}
