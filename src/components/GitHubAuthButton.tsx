// components/GitHubAuthButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";
import { signInWithGitHub } from "@/app/actions/auth";
import { useTransition } from "react";

export function GitHubAuthButton() {
  const [isPending, startTransition] = useTransition();

  const handleGitHubSignIn = () => {
    startTransition(async () => {
      const result = await signInWithGitHub();

      if (result.error) {
        console.error("GitHub auth error:", result.error);
      }

      // 重定向会在服务器端处理，不需要在客户端执行
    });
  };

  return (
    <Button
      variant="outline"
      className="w-full flex items-center gap-2"
      onClick={handleGitHubSignIn}
      disabled={isPending}
    >
      <Github className="h-4 w-4" />
      {isPending ? "linking ..." : " GitHub "}
    </Button>
  );
}
