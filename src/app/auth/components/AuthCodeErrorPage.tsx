"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AuthCodeErrorPage() {
  const router = useRouter();

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl text-center font-serif">
            验证链接无效
          </CardTitle>
          <CardDescription className="text-center">
            您的验证链接可能已过期或无效
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">这可能是因为：</p>
          <ul className="text-left list-disc pl-6 space-y-1 mb-4">
            <li>链接已过期（通常在24小时后）</li>
            <li>链接已被使用</li>
            <li>链接格式不正确</li>
          </ul>
          <p>请尝试重新发起密码重置，或联系支持团队获取帮助。</p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/login")}>
            返回登录
          </Button>
          <Button onClick={() => router.push("/reset-password")}>
            重新发送重置链接
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
