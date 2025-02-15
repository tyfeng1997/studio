"use client";

import { useTransition } from "react";
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
  error,
  message,
}: {
  type: "login" | "register";
  error?: string;
  message?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const parsedError = error ? parseAuthError(error) : null;

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
        <form action={type === "login" ? login : signup} className="space-y-4">
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
            <Label htmlFor="password">Password</Label>
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

          {type === "register" && message && (
            <Alert>
              <MailCheck className="h-4 w-4" />
              <AlertTitle>Check your email</AlertTitle>
              <AlertDescription>
                We've sent you a verification link. Please check your email to
                complete your registration.
              </AlertDescription>
            </Alert>
          )}

          <SubmitButton type={type} />
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          {type === "login" ? (
            <>
              Don't have an account?{" "}
              <a href="/register" className="text-primary hover:underline">
                Sign up
              </a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Sign in
              </a>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
