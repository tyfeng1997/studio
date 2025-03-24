"use client";

import * as React from "react";

export function WelcomeView({
  setPrompt,
}: {
  onStartChat?: () => void;
  setPrompt: (prompt: string) => void;
}) {
  // Using useEffect to ensure only client-side rendering
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // If not client-side, return simple skeleton screen
  if (!mounted) {
    return (
      <div className="w-full py-8" suppressHydrationWarning>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3">
            Intelligent Chat Agent
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center h-full w-full"
      suppressHydrationWarning
    >
      <div className="text-center mt-40">
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
          Financial Insights Agent
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your AI partner for public company analysis, financial data, news
          sentiment, and investment insights
        </p>
      </div>
    </div>
  );
}
