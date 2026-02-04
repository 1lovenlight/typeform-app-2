import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActivityStatus } from "@/lib/utils/activity-progress";

import {
  Item,
  ItemContent,
  ItemDescription,
  ItemHeader,
  ItemTitle,
} from "../ui/item";

import { ArrowUpRightIcon } from "lucide-react";

import Image from "next/image";

interface RecommendedActivityCardProps {
  id: string;
  title: string;
  description: string | null;
  imageUrl?: string | null;
  link: string;
}

export function RecommendedActivityCard({
  id,
  title,
  description,
  imageUrl,
  link,
}: RecommendedActivityCardProps) {
  return (
    <Item
      key={id}
      variant="outline"
      asChild
      className="p-0 overflow-hidden gap-0 rounded-md"
    >
      <Link href={link} className="group transition-all duration-500">
        <ItemHeader className="bg-accent aspect-video relative">
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover filter dark:invert"
            />
          )}
          <ArrowUpRightIcon
            strokeWidth={1}
            className="absolute size-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-50"
          />
          {/* <div className="absolute inset-0 bg-linear-to-tl dark:from-black/50 dark:to-black/5 from-white/80 to-white/20 group-hover:bg-white/80 dark:group-hover:bg-black/80 transition-all duration-500 " /> */}
        </ItemHeader>
        <ItemContent className="gap-2 p-4 sm:p-6 lg:p-8">
          <ItemTitle className="text-2xl font-medium">{title}</ItemTitle>
          <ItemDescription className="text-base">{description}</ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  );
}

export async function RecommendedActivities() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch all activities from hierarchy
  const { data: activeActivityHierarchy } = await supabase
    .from("active_activity_hierarchy")
    .select("*");

  if (!activeActivityHierarchy || activeActivityHierarchy.length === 0) {
    return null;
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
    return <div />;
  }

  // Static practice activity
  const practiceActivity = {
    id: "practice",
    title: "Practice NBG",
    description: "Practice your NBG skills.",
    link: "/practice",
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 items-start">
      <div className="flex flex-col gap-4">
        <RecommendedActivityCard
          id={nextActivity.activity_id!}
          title={`Up Next: ${nextActivity.activity_title || "Next Activity"}`}
          description={
            nextActivity.activity_description ||
            "Next up in your learning journey."
          }
          imageUrl={null}
          link={`/activity/${nextActivity.activity_id}`}
        />
        <div className="flex flex-row w-full justify-end">
          <Link
            href="/browse"
            className="text-muted-foreground font-normal text-base w-fit hover:text-foreground"
          >
            Browse All{" "}
          </Link>
        </div>
      </div>
      <RecommendedActivityCard
        id={practiceActivity.id}
        title={practiceActivity.title}
        description={practiceActivity.description}
        imageUrl={null}
        link={practiceActivity.link}
      />
    </div>
  );
}
