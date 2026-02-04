import { PageHeading } from "@/components/layout/page-heading";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Markdown } from "@/components/ui/markdown";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default async function ScorecardPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: scorecard, error } = await supabase
    .from("scorecards")
    .select("*")
    .eq("practice_call_id", id)
    .single();

  if (error || !scorecard) {
    console.error("Error fetching practice call:", error);
    notFound();
  }

  const { data: practiceCall, error: practiceCallError } = await supabase
    .from("practice_calls")
    .select("*")
    .eq("id", scorecard.practice_call_id)
    .single();

  if (practiceCallError || !practiceCall) {
    console.error("Error fetching practice call:", practiceCallError);
    notFound();
  }

  return (
    <div className="flex flex-col w-full h-full gap-4 sm:gap-6 lg:gap-8">
      <PageHeading title="Scorecard" />
      <div className="flex flex-col gap-4">
      <div className="border p-6">
        <Accordion type="multiple">
          <AccordionItem value="practice-call">
            <AccordionTrigger className="font-mono text-muted-foreground">Call Details</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-card p-4 overflow-auto text-xs">
                {JSON.stringify(practiceCall, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="scorecard">
            <AccordionTrigger className="font-mono text-muted-foreground">Scorecard Details</AccordionTrigger>
            <AccordionContent>
              <pre className="bg-card p-4 overflow-auto text-xs">
                {JSON.stringify(scorecard, null, 2)}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

        {/* Markdown Feedback Display */}
        {scorecard.feedback && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Feedback</h2>
            <Markdown className="max-w-none">
              {scorecard.feedback}
            </Markdown>
          </div>
        )}

      </div>
    </div>
  );
}