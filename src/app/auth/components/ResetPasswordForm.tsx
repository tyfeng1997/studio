"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { resetPasswordForEmail } from "@/app/actions/auth";
import { MailCheck } from "lucide-react";

export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const email = formData.get("email") as string;

      if (!email || !email.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }

      const result = await resetPasswordForEmail(email);

      if (result.error) {
        setError(result.error);
        setSuccess(false);
      } else {
        setError(undefined);
        setSuccess(true);
      }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">Reset Password</CardTitle>
        <CardDescription>
          Enter your email address and we will send you a password reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!success ? (
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

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Processing..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <Alert>
            <MailCheck className="h-4 w-4" />
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              If the account exists, we have sent you a link to reset your
              password. Please check your inbox.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Button
            variant="link"
            className="p-0 h-auto font-normal"
            onClick={() => router.push("/login")}
          >
            Sign In
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
