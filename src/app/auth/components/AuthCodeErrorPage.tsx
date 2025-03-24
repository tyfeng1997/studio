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
            Invalid verification link
          </CardTitle>
          <CardDescription className="text-center">
            Your verification link may have expired or is invalid
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">This may be because:</p>
          <ul className="text-left list-disc pl-6 space-y-1 mb-4">
            <li>The link has expired (usually after 24 hours)</li>
            <li>Link already used</li>
          </ul>
          <p>
            Please try to re-initiate password reset or contact support for
            assistance.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/login")}>
            Back to Login
          </Button>
          <Button onClick={() => router.push("/reset-password")}>
            Resend reset link
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
