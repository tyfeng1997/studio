// utils/chat.ts
import { createClient } from "@/utils/supabase/server";
import { Message } from "ai";
import { generateId } from "ai";

export async function createChat(): Promise<string> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Create a new chat (let Supabase generate the UUID)
  const { data, error: chatError } = await supabase
    .from("chats")
    .insert({
      user_id: user.id,
      title: "New Chat",
    })
    .select("id")
    .single();

  if (chatError) throw chatError;
  return data.id;
}

export async function loadChat(id: string): Promise<Message[]> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Load messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, created_at")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  // Convert to AI SDK Message format
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as any,
    content: msg.content,
  }));
}

export async function saveChat({
  id,
  messages,
}: {
  id: string;
  messages: Message[];
}): Promise<void> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // First, delete existing messages for this chat
  const { error: deleteError } = await supabase
    .from("messages")
    .delete()
    .eq("chat_id", id);

  if (deleteError) throw deleteError;

  // Then insert all messages
  if (messages.length > 0) {
    const { error: insertError } = await supabase.from("messages").insert(
      messages.map((msg) => ({
        chat_id: id,
        id: generateId(), // Generate new UUID for each message
        role: msg.role,
        content: msg.content,
      }))
    );

    if (insertError) throw insertError;

    // Update chat title if it's a new chat
    if (messages.length === 1 && messages[0].role === "user") {
      const { error: updateError } = await supabase
        .from("chats")
        .update({ title: messages[0].content.slice(0, 100) })
        .eq("id", id);

      if (updateError) throw updateError;
    }
  }
}

export async function getUserChats() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Get all chats for the user
  const { data: chats, error: chatsError } = await supabase
    .from("chats")
    .select("*")
    .order("updated_at", { ascending: false });

  if (chatsError) throw chatsError;
  return chats;
}

export async function deleteChat(id: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Delete the chat (messages will be cascade deleted)
  const { error: deleteError } = await supabase
    .from("chats")
    .delete()
    .eq("id", id);

  if (deleteError) throw deleteError;
}
