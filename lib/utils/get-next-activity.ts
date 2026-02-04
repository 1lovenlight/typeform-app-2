import { createClient } from "@/lib/supabase/client";
import { getActivityStatus } from "./activity-progress";

export interface NextActivity {
  activity_id: string;
  activity_title: string;
  activity_description: string | null;
  activity_slug: string;
  form_id: string | null;
  level_title: string | null;
}

/**
 * Fetches the next unlocked activity for a user after completing the current activity
 * @param currentActivityId - The ID of the activity just completed
 * @param userId - The user's ID
 * @returns The next unlocked activity or null if none available
 */
export async function getNextActivity(
  currentActivityId: string,
  userId: string
): Promise<NextActivity | null> {
  const supabase = createClient();

  // Fetch all activities from hierarchy
  const { data: activeActivityHierarchy } = await supabase
    .from("active_activity_hierarchy")
    .select("*");

  if (!activeActivityHierarchy || activeActivityHierarchy.length === 0) {
    return null;
  }

  // Fetch user's completed activities (including the one just completed)
  const { data: completions } = await supabase
    .from("user_activity_completions")
    .select("activity_id")
    .eq("user_id", userId);

  const completedActivityIds = new Set(
    completions?.map((c) => c.activity_id) || []
  );

  // Filter out null activities and find the first unlocked, uncompleted activity
  const nextActivity = activeActivityHierarchy
    .filter((item) => item.activity_id !== null)
    .find((item) => {
      const status = getActivityStatus(
        {
          activity_id: item.activity_id!,
          requires_activity_ids: item.requires_activity_ids || [],
        },
        completedActivityIds
      );
      // Find first activity that is unlocked but not completed
      return status === "unlocked";
    });

  if (!nextActivity) {
    return null;
  }

  return {
    activity_id: nextActivity.activity_id!,
    activity_title: nextActivity.activity_title || "Next Activity",
    activity_description: nextActivity.activity_description,
    activity_slug: nextActivity.activity_slug || "",
    form_id: nextActivity.form_id,
    level_title: nextActivity.level_title,
  };
}
