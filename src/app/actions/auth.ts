// app/actions/auth.ts
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { z } from "zod";
import { redirect } from "next/navigation";

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  try {
    authSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Invalid form data" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email as string,
    password: password as string,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true, redirect: "/chat" };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email");
  const password = formData.get("password");

  try {
    authSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Invalid form data" };
  }

  const { error } = await supabase.auth.signUp({
    email: email as string,
    password: password as string,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: "Check your email to confirm your account",
  };
}

// 新增 GitHub 登录功能
export async function signInWithGitHub() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback/github`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }

  return { success: true };
}

// 密码重置功能
export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient();

  if (!email || !email.includes("@")) {
    return { error: "请输入有效的电子邮件地址" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/account/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// 更新用户密码
export async function updateUserPassword(password: string) {
  const supabase = await createClient();

  if (!password || password.length < 6) {
    return { error: "密码必须至少包含6个字符" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
