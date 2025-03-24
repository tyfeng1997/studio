"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { login, signup } from "@/app/actions/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MailCheck } from "lucide-react";
import { GitHubAuthButton } from "@/components/GitHubAuthButton"; // 导入 GitHub 登录按钮组件

function SubmitButton({ type }: { type: "login" | "register" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Loading..." : type === "login" ? "Sign In" : "Create Account"}
    </Button>
  );
}

interface AuthError {
  type: "InvalidCredentials" | "UserNotFound" | "Other";
  message: string;
}

function parseAuthError(error: string): AuthError {
  if (
    error.includes("Invalid credentials") ||
    error.includes("incorrect password")
  ) {
    return {
      type: "InvalidCredentials",
      message:
        "Invalid email or password. Please check your credentials and try again.",
    };
  }
  if (error.includes("user not found") || error.includes("no user")) {
    return {
      type: "UserNotFound",
      message:
        "We couldn't find an account with that email. Please check your email or create a new account.",
    };
  }
  return {
    type: "Other",
    message: error,
  };
}

export function AuthForm({
  type,
  error: initialError,
  message: initialMessage,
}: {
  type: "login" | "register";
  error?: string;
  message?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState(initialError);
  const [message, setMessage] = useState(initialMessage);
  const router = useRouter();
  const parsedError = error ? parseAuthError(error) : null;

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await (type === "login"
        ? login(formData)
        : signup(formData));

      if (result.error) {
        setError(result.error);
        setMessage(undefined);
      } else if (result.success) {
        setError(undefined);
        if (result.message) {
          setMessage(result.message);
        }
        if (result.redirect) {
          router.push(result.redirect);
        }
      }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription>
          {type === "login"
            ? "Enter your credentials to access your account"
            : "Fill in your details to create a new account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className={
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {type === "login" && (
                <Button
                  variant="link"
                  className="p-0 h-auto font-normal text-xs"
                  onClick={() => router.push("/reset-password")}
                >
                  forget the password?
                </Button>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className={
                error ? "border-red-500 focus-visible:ring-red-500" : ""
              }
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription>{parsedError?.message}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <SubmitButton type={type} />

          {/* 添加分割线 */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
          </div>

          {/* GitHub 登录按钮 */}
          <GitHubAuthButton />
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {type === "login" ? (
            <>
              Don't have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/register")}
              >
                Sign up
              </Button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => router.push("/login")}
              >
                Sign in
              </Button>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
