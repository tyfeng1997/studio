// app/chat/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ChatView } from "@/components/chat/chat-view";

export default async function ChatPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    redirect("/login");
  }

  return (
    <div className="flex-1">
      <ChatView />
    </div>
  );
}
