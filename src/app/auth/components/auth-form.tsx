// app/auth/components/auth-form.tsx
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
import { Alert, AlertDescription } from "@/components/ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Loading..." : "Sign In"}
    </Button>
  );
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
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>
          {(error || message) && (
            <Alert variant={message ? "default" : "destructive"}>
              <AlertDescription>{error || message}</AlertDescription>
            </Alert>
          )}
          <SubmitButton />
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
