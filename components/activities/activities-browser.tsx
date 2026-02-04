import { createClient } from "@/lib/supabase/server";
import { ActivityCard } from "./activity-card";
import { getActivityStatus } from "@/lib/utils/activity-progress";
import { ScrollArea } from "@/components/ui/scroll-area";

export async function ActivitiesBrowser() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch from your new view
  const { data: activeActivityHierarchy, error } = await supabase
    .from("active_activity_hierarchy")
    .select("*");

  if (error) {
    console.error("Error fetching curriculum:", error);
    return <div>Error loading activities</div>;
  }

  // Fetch user's completed activities
  let completedActivityIds = new Set<string>();
  if (user) {
    const { data: completions } = await supabase
      .from("user_activity_completions")
      .select("activity_id")
      .eq("user_id", user.id);

    completedActivityIds = new Set(
      completions?.map((c) => c.activity_id) || []
    );
  }

  type ActivityWithStatus = {
    activity_id: string;
    activity_title: string;
    activity_slug: string;
    activity_description: string | null;
    activity_order: number;
    form_id: string | null;
    hint: string | null;
    requires_activity_ids: string[];
    status: "locked" | "unlocked" | "completed";
  };

  type LevelGroup = {
    level_id: string;
    level_title: string;
    level_description: string | null;
    level_order: number;
    activities: ActivityWithStatus[];
  };

  // Group activities by level and enrich with status
  const groupedByLevel = activeActivityHierarchy?.reduce((acc, item) => {
    const levelId = item.level_id;

    if (!acc[levelId]) {
      acc[levelId] = {
        level_id: item.level_id,
        level_title: item.level_title,
        level_description: item.level_description,
        level_order: item.level_order,
        activities: [],
      };
    }

    // Only add activity if it exists (not null from left join)
    if (item.activity_id) {
      const status = getActivityStatus(
        {
          activity_id: item.activity_id,
          requires_activity_ids: item.requires_activity_ids || [],
        },
        completedActivityIds
      );

      acc[levelId].activities.push({
        activity_id: item.activity_id,
        activity_title: item.activity_title,
        activity_slug: item.activity_slug,
        activity_description: item.activity_description,
        activity_order: item.activity_order,
        form_id: item.form_id,
        hint: item.hint,
        requires_activity_ids: item.requires_activity_ids || [],
        status,
      });
    }

    return acc;
  }, {} as Record<string, LevelGroup>);

  const levels = (Object.values(groupedByLevel || {}) as LevelGroup[]).sort(
    (a, b) => a.level_order - b.level_order
  );

  return (
    <div className="flex flex-col gap-8 pb-4 sm:pb-6 lg:pb-8 h-full">
      {levels.map((level) => (
        <div
          key={level.level_id}
          className="flex flex-col gap-4 divide-y divide-border last:pb-16 "
        >
          {/* Level Heading */}
          <div className="flex flex-col gap-1 pb-2">
            <h2 className="text-2xl font-medium sm:text-3xl tracking-tight">
              {level.level_title}
            </h2>
            {level.level_description && (
              <p className="text-muted-foreground">{level.level_description}</p>
            )}
          </div>

          {/* Activities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {level.activities.length > 0 ? (
              level.activities.map((activity) => (
                <ActivityCard
                  key={activity.activity_id}
                  id={activity.activity_id}
                  title={activity.activity_title}
                  description={activity.activity_description}
                  slug={activity.activity_slug}
                  imageUrl={null}
                  status={activity.status}
                />
              ))
            ) : (
              <p className="text-muted-foreground col-span-full">
                No activities available yet
              </p>
            )}
          </div>
        </div>
      ))}

      {levels.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          No levels or activities found
        </div>
      )}
    </div>
  );
}
