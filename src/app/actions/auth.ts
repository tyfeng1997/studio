// app/actions/auth.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  // Validate form data
  try {
    authSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(`/login?error=${encodeURIComponent(error.errors[0].message)}`);
    }
    redirect("/login?error=Invalid form data");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/", "layout");
  redirect("/chat");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  // Validate form data
  try {
    authSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect(
        `/register?error=${encodeURIComponent(error.errors[0].message)}`
      );
    }
    redirect("/register?error=Invalid form data");
  }

  const { error } = await supabase.auth.signUp({
    email: email as string,
    password: password as string,
  });

  if (error) {
    redirect(`/register?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/register?message=Check your email to confirm your account");
}
