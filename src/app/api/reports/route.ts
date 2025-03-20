// app/api/reports/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/reports - Get all reports for the current user
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("id");

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If reportId is provided, get a specific report
  if (reportId) {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch report" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  }

  // Otherwise, get all reports for the user
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

/**
 * POST /api/reports - Create a new report
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Auth error:", userError);
      return NextResponse.json(
        { error: "Authentication error", details: userError.message },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized - No user found" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { id, title, content, mode } = body;

    if (!id || !content) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: { id: !!id, content: !!content },
        },
        { status: 400 }
      );
    }

    console.log("Creating report:", { id, title, userId: user.id, mode });

    // 准备插入数据
    const insertData: any = {
      id,
      user_id: user.id,
      title: title || "Untitled Report",
      content,
    };

    // 只有当 mode 字段存在时才添加它 - 这样即使表没有这个字段也能工作
    try {
      // 检查表结构是否有 mode 字段
      const { data: columnInfo, error: columnError } = await supabase
        .from("reports")
        .select("mode")
        .limit(1);

      // 如果没有错误，说明 mode 字段存在
      if (!columnError) {
        insertData.mode = mode || "quick";
      } else {
        console.log("Mode 字段可能不存在，跳过此字段");
      }
    } catch (e) {
      console.log("检查 mode 字段时出错，跳过此字段", e);
    }

    // 创建报告
    const { data, error } = await supabase
      .from("reports")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json(
        {
          error: "Failed to create report",
          details: error.message,
          code: error.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected error in POST /api/reports:", error);
    return NextResponse.json(
      { error: "Server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports - Delete a report
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const reportId = searchParams.get("id");

  if (!reportId) {
    return NextResponse.json(
      { error: "Report ID is required" },
      { status: 400 }
    );
  }

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete the report
  const { error } = await supabase
    .from("reports")
    .delete()
    .eq("id", reportId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
