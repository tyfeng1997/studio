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
import { updateUserPassword } from "@/app/actions/auth";
import { Check } from "lucide-react";

export function UpdatePasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const password = formData.get("password") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (password.length < 6) {
        setError("Password must contain at least 6 characters");
        return;
      }

      if (password !== confirmPassword) {
        setError("The two passwords you entered do not match");
        return;
      }

      const result = await updateUserPassword(password);

      if (result.error) {
        setError(result.error);
      } else {
        setError(undefined);
        setSuccess(true);
        // 3秒后重定向到登录页面
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    });
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-serif">Set New Password</CardTitle>
        <CardDescription>
          Please create a new password for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!success ? (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
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
              {isPending ? "processing..." : "Update Password"}
            </Button>
          </form>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>Password updated</AlertTitle>
            <AlertDescription>
              Your password has been updated successfully. You will be
              redirected to the login page...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
