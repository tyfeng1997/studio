import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default function RegisterPage({
  searchParams,
}: {
  searchParams: { message: string; error: string };
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <AuthForm
          type="register"
          error={searchParams.error}
          message={searchParams.message}
        />
      </div>
    </div>
  );
}
