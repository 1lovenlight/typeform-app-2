import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { scorePracticeCallWorkflow } from "@/workflows/score-practice-call";
import { createClient } from "@/lib/supabase/server";

const MINIMUM_CALL_DURATION_SECS = 60;

export async function POST(req: Request) {
  try {
    // Check API key authentication (for database trigger calls)
    const authHeader = req.headers.get("authorization");
    const expectedKey = process.env.WORKFLOW_API_KEY;

    // If API key is configured, verify it
    if (expectedKey) {
      if (!authHeader || authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json(
          { error: "Unauthorized - Invalid API key" },
          { status: 401 }
        );
      }
    }

    // Parse body - handle both JSON and form-urlencoded
    const contentType = req.headers.get("content-type") || "";
    let practice_call_id: string;

    if (contentType.includes("application/json")) {
      // JSON format
      const body = await req.json();
      practice_call_id = body.practice_call_id;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Form-urlencoded format (from Make.com)
      const rawBody = await req.text();
      const params = new URLSearchParams(rawBody);
      practice_call_id = params.get("practice_call_id") || "";
    } else {
      // Try JSON as fallback
      const body = await req.json();
      practice_call_id = body.practice_call_id;
    }

    if (!practice_call_id) {
      return NextResponse.json(
        { error: "practice_call_id is required" },
        { status: 400 }
      );
    }

    // Fetch practice call with call_duration_secs
    const supabase = await createClient();
    const { data: practiceCall, error } = await supabase
      .from("practice_calls")
      .select("id, user_id, call_duration_secs")
      .eq("id", practice_call_id)
      .single();

    if (error || !practiceCall) {
      return NextResponse.json(
        { error: "Practice call not found" },
        { status: 404 }
      );
    }

    // Check call duration - skip if too short
    const duration = practiceCall.call_duration_secs ?? 0;
    if (duration < MINIMUM_CALL_DURATION_SECS) {
      // Update to skipped status
      await supabase
        .from("practice_calls")
        .update({
          scoring_status: "skipped",
          status_reason: `Call too short: ${duration} seconds (minimum ${MINIMUM_CALL_DURATION_SECS}s required)`,
        })
        .eq("id", practice_call_id);

      return NextResponse.json({
        message: "Practice call skipped - too short",
        practice_call_id,
        duration_secs: duration,
        minimum_required: MINIMUM_CALL_DURATION_SECS,
      });
    }

    // Call is valid - start the scoring workflow
    const run = await start(scorePracticeCallWorkflow, [practice_call_id]);

    return NextResponse.json({
      message: "Scoring workflow started",
      run_id: run.runId,
      practice_call_id,
      duration_secs: duration,
    });
  } catch (error) {
    console.error("Error in /api/practice/score-practice-call:", error);
    return NextResponse.json(
      {
        error: "Failed to process practice call",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
