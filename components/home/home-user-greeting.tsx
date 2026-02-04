"use client";

import { useUserProfile } from "@/lib/contexts/user-profile-context";
import { PageHeading } from "@/components/layout/page-heading";

export function HomeUserGreeting() {
  const profile = useUserProfile();

  return <PageHeading title={`Hey ${profile?.username || "there"}`} />;
}
