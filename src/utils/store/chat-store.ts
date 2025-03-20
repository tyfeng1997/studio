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

/**
 * Generate a chat title from the first user message
 * Takes the first line of text and truncates it if needed
 */
function generateChatTitle(content: string): string {
  // Get the first line (or full content if no line breaks)
  const firstLine = content.split("\n")[0].trim();

  // Truncate to a reasonable length (30 characters) and add ellipsis if needed
  const maxLength = 30;
  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  // Find a good breakpoint (space) near the desired length
  const breakPoint = firstLine.lastIndexOf(" ", maxLength);
  if (breakPoint > maxLength / 2) {
    // If we found a space in the latter half, break there
    return firstLine.substring(0, breakPoint) + "...";
  } else {
    // Otherwise just cut at the max length
    return firstLine.substring(0, maxLength) + "...";
  }
}

export async function loadChat(id: string): Promise<Message[]> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Check if the chat exists
  const { data: chatData, error: chatError } = await supabase
    .from("chats")
    .select("id")
    .eq("id", id)
    .single();

  // If chat doesn't exist, create it with the given ID
  if (!chatData) {
    const { error: createError } = await supabase.from("chats").insert({
      id: id,
      user_id: user.id,
      title: "New Chat",
    });

    if (createError) throw createError;

    // Return empty messages array for the new chat
    return [];
  }

  // If chat exists, load messages
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("id, role, content, created_at, parts, tool_results, reasoning")
    .eq("chat_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  // Convert to AI SDK Message format
  return messages.map((msg) => {
    // Base message with required fields
    const message: any = {
      id: msg.id,
      role: msg.role as any,
      content: msg.content,
    };

    // Add optional fields if they exist
    if (msg.parts) message.parts = msg.parts;
    if (msg.tool_results) message.toolInvocations = msg.tool_results;
    if (msg.reasoning) message.reasoning = msg.reasoning;

    return message;
  });
}

export async function updateChatTitle(
  id: string,
  content: string
): Promise<void> {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) throw new Error("Unauthorized");

  // Generate the new title
  const title = generateChatTitle(content);

  // Update the chat title
  const { error: updateError } = await supabase
    .from("chats")
    .update({ title })
    .eq("id", id);

  if (updateError) throw updateError;
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
      messages.map((msg) => {
        // Extract tool invocations
        const toolResults = msg.toolInvocations || null;

        // Extract reasoning parts if available
        let reasoning = null;
        if (Array.isArray(msg.parts)) {
          const reasoningParts = msg.parts.filter(
            (part) => part.type === "reasoning" || part.type === "thinking"
          );
          if (reasoningParts.length > 0) {
            reasoning = reasoningParts;
          }
        }

        return {
          chat_id: id,
          id: msg.id || generateId(), // Use existing ID or generate new one
          role: msg.role,
          content: msg.content,
          parts: msg.parts || null,
          tool_results: toolResults,
          reasoning: reasoning,
        };
      })
    );

    if (insertError) throw insertError;

    // Update chat title if it's a new chat with only a user message
    if (messages.length === 1 && messages[0].role === "user") {
      await updateChatTitle(id, messages[0].content);
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
