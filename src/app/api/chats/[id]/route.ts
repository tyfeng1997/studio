// app/api/chats/[id]/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 首先删除关联的消息
    const { error: messagesError } = await supabase
      .from("messages")
      .delete()
      .eq("chat_id", params.id);

    if (messagesError) {
      throw messagesError;
    }

    // 然后删除对话
    const { error: chatError } = await supabase
      .from("chats")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (chatError) {
      throw chatError;
    }

    return NextResponse.json({
      success: true,
      message: "Chat deleted successfully"
    });

  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json(
      { error: "Failed to delete chat" },
      { status: 500 }
    );
  }
}