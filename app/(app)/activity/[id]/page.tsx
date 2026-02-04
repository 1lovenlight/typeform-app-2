import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { TypeformReactWidget } from "@/components/typeform/typeform-react-widget";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface ActivityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id || null;

  // Fetch the activity by ID with level information
  const { data: activity, error } = await supabase
    .from("typeforms")
    .select(
      `
      *,
      levels (
        id,
        title
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !activity) {
    console.error("Error fetching activity:", error);
    notFound();
  }

  // Check if activity is published
  if (!activity.published) {
    notFound();
  }

  return (
    <div className="flex flex-col w-full h-full gap-4 sm:gap-6 lg:gap-8">
      <PageHeading
        title={activity.title}
        actions={
          activity.hint ? (
            <Button variant="secondary" title={activity.hint}>
              Show Hint
            </Button>
          ) : undefined
        }
      />

      {activity.description && (
        <p className="text-muted-foreground -mt-2">{activity.description}</p>
      )}

      {activity.form_id ? (
        <TypeformReactWidget
          formId={activity.form_id}
          userId={userId}
          activityId={activity.id}
          hiddenFields={{
            supabase_typeform_id: activity.id,
            activity_slug: activity.activity_slug,
            level_id: activity.level_id || "",
            // TODO: rename modules_title in tupeform to "level_title"
            modules_title: activity.levels?.title || "",
            // TODO: rename activities_display_name in typeform to "activity_title"
            activities_display_name: activity.title,
            // TODO: fix module_id (should be level_id), course_id in typeform/make.com
            // TODO: deprecate topics_title in typeform
          }}
        />
      ) : (
        <div className="flex border aspect-video items-center justify-center text-muted-foreground">
          No form configured for this activity
        </div>
      )}
    </div>
  );
}
