"use client";

import * as React from "react";
import { ChatView } from "./chat-view";
import { WelcomeView } from "@/components/welcome";
import { Message } from "@ai-sdk/react";

export function ChatContainer({
  id,
  initialMessages,
}: {
  id?: string | undefined;
  initialMessages?: Message[];
} = {}) {
  const [showWelcome, setShowWelcome] = React.useState(
    initialMessages?.length === 0 || initialMessages === undefined
  );

  const handleStartChat = () => {
    setShowWelcome(false);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)]">
      {showWelcome ? (
        <WelcomeView onStartChat={handleStartChat} />
      ) : (
        <ChatView id={id} initialMessages={initialMessages} />
      )}
    </div>
  );
}
