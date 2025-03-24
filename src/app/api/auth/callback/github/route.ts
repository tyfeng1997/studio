// app/api/auth/callback/github/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // 如果 "next" 参数存在，使用它作为重定向 URL
  const next = searchParams.get("next") ?? "/chat";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host"); // 负载均衡器之前的原始主机名
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // 在开发环境中，不需要考虑 X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        console.log(`${origin}${next}`);
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // 如果出错，将用户重定向到错误页面
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
