"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu({ minimal = false }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState<string | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = React.useState(true);

  // Fetch user email on component mount
  React.useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user");
        }
        const data = await response.json();
        setEmail(data.email);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoadingEmail(false);
      }
    };

    fetchUserEmail();
  }, [router]);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to sign out");

      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoading(false);
    }
  };

  if (isLoadingEmail) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!email) {
    return null;
  }

  const initials = email.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {initials}
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {!minimal && (
          <div className="p-2">
            <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
              {email}
            </p>
          </div>
        )}
        {!minimal && <DropdownMenuSeparator />}
        <DropdownMenuItem
          className="text-red-600 dark:text-red-400 cursor-pointer"
          disabled={isLoading}
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "Signing out..." : "Log out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
