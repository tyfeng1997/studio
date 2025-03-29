// app/api/feedback/route.ts
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the request body
    const { title, content } = await request.json();

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Insert the feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from("feedback")
      .insert([
        {
          user_id: user.id,
          title,
          content,
        },
      ])
      .select()
      .single();

    if (feedbackError) {
      throw feedbackError;
    }

    return NextResponse.json(feedback);
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}
