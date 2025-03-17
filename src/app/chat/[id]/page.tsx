import { loadChat } from "@/utils/store/chat-store";
import { ChatView } from "@/components/chat/chat-view";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ChatContainer } from "@/components/chat/chat-container";
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  const { id } = await props.params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages
  return (
    <div className="flex-1">
      <ChatContainer id={id} initialMessages={messages} />
    </div>
  );
}
