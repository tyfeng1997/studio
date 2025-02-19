// app/api/workspace/delete/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspace } = await request.json();
    console.log("Deleting workspace:", workspace);
    console.log("User ID:", user.id);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace name is required" },
        { status: 400 }
      );
    }

    // 首先获取要删除的文档信息
    const { data: documents, error: documentsError } = await supabase
      .from("documents")
      .select("id, workspace")
      .eq("workspace", workspace)
      .eq("user_id", user.id);

    console.log("Found documents:", documents);

    if (documentsError) {
      console.error("Error fetching documents:", documentsError);
      throw documentsError;
    }

    if (documents && documents.length > 0) {
      const documentIds = documents.map((doc) => doc.id);
      console.log("Document IDs to delete:", documentIds);

      // 删除文档块
      const { data: deletedChunks, error: chunksError } = await supabase
        .from("document_chunks")
        .delete()
        .in("document_id", documentIds)
        .select();

      if (chunksError) {
        console.error("Error deleting chunks:", chunksError);
        throw chunksError;
      }
    }

    // 删除文档
    const { data: deletedDocs, error: docsError } = await supabase
      .from("documents")
      .delete()
      .eq("workspace", workspace)
      .eq("user_id", user.id)
      .select();

    console.log("Deleted documents result:", deletedDocs);

    if (docsError) {
      console.error("Error deleting documents:", docsError);
      throw docsError;
    }

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
      details: {
        documentsFound: documents?.length || 0,
        documentsDeleted: deletedDocs?.length || 0,
      },
    });
  } catch (error) {
    console.error("Delete workspace error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete workspace",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
