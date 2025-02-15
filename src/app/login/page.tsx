import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message: string; error: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <AuthForm
          type="login"
          error={searchParams.error}
          message={searchParams.message}
        />
      </div>
    </div>
  );
}
