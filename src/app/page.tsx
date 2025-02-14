// app/page.tsx
import { ChatView } from "@/components/chat/chat-view";
import { ToolConfig } from "@/components/tools/tool-config";
import { SplitView } from "@/components/layout/split-view";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <div className="flex-1">
        <SplitView leftPane={<ChatView />} rightPane={<ToolConfig />} />
      </div>
    </main>
  );
}
