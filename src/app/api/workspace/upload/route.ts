// app/api/upload/route.ts
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cohere } from "@ai-sdk/cohere";
import { embedMany } from "ai";
import { splitIntoChunks } from "@/utils/chunker";

const embeddingModel = cohere.embedding("embed-english-v3.0", {
  inputType: "search_document",
  truncate: "NONE",
});

const generateEmbeddings = async (
  chunks: string[]
): Promise<Array<{ embedding: number[]; content: string }>> => {
  // Process chunks in batches to avoid rate limits
  const BATCH_SIZE = 96; // Cohere's recommended batch size
  const results: Array<{ embedding: number[]; content: string }> = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchChunks = chunks.slice(i, i + BATCH_SIZE);
    const { embeddings } = await embedMany({
      model: embeddingModel,
      values: batchChunks,
    });

    results.push(
      ...embeddings.map((embedding, index) => ({
        embedding,
        content: batchChunks[index],
      }))
    );
  }

  return results;
};

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

    const formData = await request.formData();
    const workspace = formData.get("workspace") as string;
    const files = formData.getAll("files") as File[];

    if (!workspace || !files.length) {
      return NextResponse.json(
        { error: "Workspace and files are required" },
        { status: 400 }
      );
    }

    const processedFiles = [];

    for (const file of files) {
      // Create document record
      const { data: document, error: docError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          workspace,
          filename: file.name,
        })
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      // Process file content
      const text = await file.text();
      const chunks = splitIntoChunks(text, 200);

      // Generate embeddings
      const embeddedChunks = await generateEmbeddings(chunks);

      // Store chunks with embeddings in batches
      const chunkRecords = embeddedChunks.map((chunk, index) => ({
        document_id: document.id,
        content: chunk.content,
        embedding: chunk.embedding,
        chunk_index: index,
        token_count: Math.ceil(chunk.content.length / 4), // Approximate token count
      }));

      // Insert chunks in batches of 100
      const CHUNK_BATCH_SIZE = 100;
      for (let i = 0; i < chunkRecords.length; i += CHUNK_BATCH_SIZE) {
        const batch = chunkRecords.slice(i, i + CHUNK_BATCH_SIZE);
        const { error: chunksError } = await supabase
          .from("document_chunks")
          .insert(batch);

        if (chunksError) {
          throw chunksError;
        }
      }

      processedFiles.push({
        id: document.id,
        filename: document.filename,
        workspace: document.workspace,
        chunks_count: chunkRecords.length,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Files processed successfully",
      files: processedFiles,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process files" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
