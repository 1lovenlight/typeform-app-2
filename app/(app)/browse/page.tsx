import { PageHeading } from "@/components/layout/page-heading";
import { ActivitiesBrowser } from "@/components/activities/activities-browser";

export default function BrowsePage() {
  return (
    <div className="flex flex-col w-full h-full gap-4 sm:gap-6 lg:gap-8">
      <PageHeading title="Browse" />
      <ActivitiesBrowser />
    </div>
  );
}
