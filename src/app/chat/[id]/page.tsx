import { loadChat } from "@/utils/store/chat-store";
import { ChatView } from "@/components/chat/chat-view";
import { ToolConfig } from "@/components/tools/tool-config";
import { SplitView } from "@/components/layout/split-view";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params; // get the chat ID from the URL
  const messages = await loadChat(id); // load the chat messages
  return (
    <div className="flex-1">
      <SplitView
        leftPane={<ChatView id={id} initialMessages={messages} />}
        rightPane={<ToolConfig />}
      />
    </div>
  );
}
