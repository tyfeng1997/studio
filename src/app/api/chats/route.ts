// app/api/chats/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getUserChats } from "@/utils/store/chat-store";
import { createChat } from "@/utils/store/chat-store";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all chats for the user
    const { data: chats, error: chatsError } = await supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false });

    if (chatsError) {
      throw chatsError;
    }

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create a new chat
    const id = await createChat();

    return NextResponse.json({
      success: true,
      message: "Chat created successfully",
      id,
    });
  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 }
    );
  }
}
