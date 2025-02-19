// app/api/workspaces/route.ts
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("no auth..");

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("here..");
    // 使用原始 SQL 查询
    const { data, error } = await supabase.rpc("get_workspace_stats", {
      user_id_input: user.id,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      workspaces: data,
    });
  } catch (error) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
}
