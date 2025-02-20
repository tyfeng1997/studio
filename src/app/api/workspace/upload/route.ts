import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { cohere } from "@ai-sdk/cohere";
import { embedMany } from "ai";
import { splitIntoChunks } from "@/utils/chunker";

// 文件类型和大小限制配置
const ACCEPTED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/plain": ".txt",
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const embeddingModel = cohere.embedding("embed-multilingual-v3.0", {
  inputType: "search_document",
  truncate: "NONE",
});

// 文件验证函数
const validateFile = (file: File): string | null => {
  if (!Object.keys(ACCEPTED_FILE_TYPES).includes(file.type)) {
    return `Invalid file type: ${file.name}. Only PDF, DOCX, and TXT files are supported.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${file.name}. Maximum file size is 10MB.`;
  }
  return null;
};

import { parseDocumentWithLlama } from "@/lib/llamaindex";

// 文档内容提取函数
const extractDocumentContent = async (file: File): Promise<string> => {
  console.log(`Processing file: ${file.name}`);
  console.log(`File type: ${file.type}`);
  console.log(`File size: ${file.size} bytes`);

  // 根据文件类型调用不同的处理方法
  switch (file.type) {
    case "application/pdf":
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return await parseDocumentWithLlama(file);
    case "text/plain":
      return await file.text();
    default:
      throw new Error(`Unsupported file type: ${file.type}`);
  }
};

const generateEmbeddings = async (
  chunks: string[]
): Promise<Array<{ embedding: number[]; content: string }>> => {
  const BATCH_SIZE = 96;
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

    // 验证所有文件
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        return NextResponse.json({ error }, { status: 400 });
      }
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
          file_type: file.type,
          file_size: file.size,
        })
        .select()
        .single();

      if (docError) {
        throw docError;
      }

      try {
        // 提取文档内容
        const text = await extractDocumentContent(file);

        if (!text.trim()) {
          console.log(
            `No content extracted from ${file.name}, skipping embedding generation`
          );
          continue;
        }

        const chunks = splitIntoChunks(text, 150);
        const embeddedChunks = await generateEmbeddings(chunks);

        // Store chunks with embeddings in batches
        const chunkRecords = embeddedChunks.map((chunk, index) => ({
          document_id: document.id,
          content: chunk.content,
          embedding: chunk.embedding,
          chunk_index: index,
          token_count: Math.ceil(chunk.content.length / 4),
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
          file_type: file.type,
          file_size: file.size,
          chunks_count: chunkRecords.length,
        });
      } catch (error) {
        // 如果处理单个文件失败，记录错误但继续处理其他文件
        console.error(`Error processing file ${file.name}:`, error);
        // 更新文档状态为处理失败
        await supabase
          .from("documents")
          .update({ processing_error: error.message })
          .eq("id", document.id);
      }
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
