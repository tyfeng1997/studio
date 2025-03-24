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
        setError("密码必须至少包含6个字符");
        return;
      }

      if (password !== confirmPassword) {
        setError("两次输入的密码不匹配");
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
        <CardTitle className="text-2xl font-serif">设置新密码</CardTitle>
        <CardDescription>请为您的账户设置一个新密码</CardDescription>
      </CardHeader>
      <CardContent>
        {!success ? (
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">新密码</Label>
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
              <Label htmlFor="confirmPassword">确认新密码</Label>
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
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "更新中..." : "更新密码"}
            </Button>
          </form>
        ) : (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertTitle>密码已更新</AlertTitle>
            <AlertDescription>
              您的密码已成功更新。即将跳转到登录页面...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
