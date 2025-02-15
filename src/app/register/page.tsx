import { Metadata } from "next";
import { AuthForm } from "../auth/components/auth-form";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Register",
  description: "Create a new account",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: { message: string; error: string };
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data?.user) {
    redirect("/chat");
  }
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
