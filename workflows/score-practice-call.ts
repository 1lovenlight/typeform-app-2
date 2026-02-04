import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { createAdminClient } from "@/lib/supabase/admin";

// Step: Fetch practice call from database
async function fetchPracticeCall(practiceCallId: string) {
  "use step";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("practice_calls")
    .select("id, user_id, transcript_text, scoring_status")
    .eq("id", practiceCallId)
    .single();

  if (error || !data) {
    throw new Error(`Practice call not found: ${practiceCallId}`);
  }

  // Transcript text is already parsed and formatted before insertion
  const transcriptText = data.transcript_text;

  if (!transcriptText || transcriptText.trim().length === 0) {
    throw new Error(
      `No valid transcript found for practice call: ${practiceCallId}. Transcript text is empty or invalid.`
    );
  }

  return {
    id: data.id,
    user_id: data.user_id,
    transcript_text: transcriptText,
  };
}

// Step: Fetch rubric prompt from prompts table (just get the first one)
async function fetchRubric() {
  "use step";

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("prompts")
    .select("id, template")
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error(
      "No prompts found in the prompts table. Please add at least one prompt to use as a rubric."
    );
  }

  if (!data.template) {
    throw new Error("Prompt template is empty");
  }

  return { id: data.id, prompt: data.template };
}

// Step: Score transcript using AI
async function scoreWithAI(
  transcriptText: string,
  rubricPrompt: string
): Promise<string> {
  "use step";

  const { text } = await generateText({
    model: openai("gpt-4o"),
    system: `You are an expert conversation evaluator.
Score the following conversation transcript according to the provided rubric.
Be fair, constructive, and specific in your feedback.
Provide detailed feedback that helps the user improve their conversation skills.`,
    prompt: `## Rubric
${rubricPrompt}

## Transcript
${transcriptText}

Evaluate this conversation according to the rubric criteria above. Provide comprehensive feedback.`,
  });

  return text;
}

// Step: Save scorecard to database
async function saveScorecard(
  practiceCallId: string,
  userId: string,
  feedback: string
) {
  "use step";

  const supabase = createAdminClient();

  // Insert scorecard
  const { error: scorecardError } = await supabase.from("scorecards").insert({
    practice_call_id: practiceCallId,
    user_id: userId,
    feedback: feedback,
  });

  if (scorecardError) {
    // Update practice call status to failed
    await supabase
      .from("practice_calls")
      .update({ scoring_status: "failed" })
      .eq("id", practiceCallId);
    throw new Error(`Failed to save scorecard: ${scorecardError.message}`);
  }

  // Update practice call status to complete
  await supabase
    .from("practice_calls")
    .update({ scoring_status: "complete" })
    .eq("id", practiceCallId);

  return { success: true };
}

// Helper: Update practice call status with error
async function updatePracticeCallError(
  practiceCallId: string,
  error: Error
) {
  "use step";

  const supabase = createAdminClient();
  
  // Truncate error message if too long (database field limit)
  const errorMessage = error.message.length > 500 
    ? error.message.substring(0, 497) + "..."
    : error.message;

  await supabase
    .from("practice_calls")
    .update({
      scoring_status: "failed",
      status_reason: `Workflow error: ${errorMessage}`,
    })
    .eq("id", practiceCallId);
}

// Main workflow orchestrator
export async function scorePracticeCallWorkflow(practiceCallId: string) {
  "use workflow";

  try {
    // Step 1: Fetch the practice call
    const practiceCall = await fetchPracticeCall(practiceCallId);

    // Step 2: Fetch the rubric from prompts table (first one)
    const rubric = await fetchRubric();

    // Step 3: Score with AI
    const feedback = await scoreWithAI(practiceCall.transcript_text, rubric.prompt);

    // Step 4: Save results
    await saveScorecard(
      practiceCall.id,
      practiceCall.user_id,
      feedback
    );

    return {
      practice_call_id: practiceCallId,
      status: "complete",
    };
  } catch (error) {
    // Update database with error details
    await updatePracticeCallError(
      practiceCallId,
      error instanceof Error ? error : new Error(String(error))
    );

    // Re-throw so workflow system knows it failed
    throw error;
  }
}
