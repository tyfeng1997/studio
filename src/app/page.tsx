import { ChatView } from "@/components/chat/chat-view";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1">
        <ChatView />
      </div>
    </main>
  );
}
