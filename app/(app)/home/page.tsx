import { HomeUserGreeting } from "@/components/home/home-user-greeting";
import { RecommendedActivities } from "@/components/home/recommended-activities";

import * as Sentry from "@sentry/nextjs";

function myUndefinedFunction() {
  try {
    // purposely call an undefined function to trigger an error
    (window as any).thisFunctionDoesNotExist();
  } catch (error) {
    Sentry.captureException(error);
    throw error; // rethrow for visibility/testing
  }
}

export default function HomePage() {
  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
        <HomeUserGreeting />
        <RecommendedActivities />
      </div>
    </div>
  );
}
