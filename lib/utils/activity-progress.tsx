// lib/utils/activity-progress.ts

export type ActivityStatus = "locked" | "unlocked" | "completed";

export function getActivityStatus(
  activity: { activity_id: string; requires_activity_ids: string[] },
  completedActivityIds: Set<string>
): ActivityStatus {
  // Already completed
  if (completedActivityIds.has(activity.activity_id)) {
    return "completed";
  }

  // No prerequisites = always unlocked
  if (
    !activity.requires_activity_ids ||
    activity.requires_activity_ids.length === 0
  ) {
    return "unlocked";
  }

  // Check if ALL prerequisites are completed (AND logic)
  const allPrereqsCompleted = activity.requires_activity_ids.every((reqId) =>
    completedActivityIds.has(reqId)
  );

  return allPrereqsCompleted ? "unlocked" : "locked";
}

export function enrichActivitiesWithStatus<
  T extends { activity_id: string; requires_activity_ids: string[] }
>(
  activities: T[],
  completedActivityIds: Set<string>
): (T & { status: ActivityStatus })[] {
  return activities.map((activity) => ({
    ...activity,
    status: getActivityStatus(activity, completedActivityIds),
  }));
}
