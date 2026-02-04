import { AppHeader } from "@/components/layout/app-header";
import { PageContainer } from "@/components/layout/page-container";
import { FloatingTypeform } from "@/components/typeform/fab-feedback";

import { UserProfileProvider } from "@/lib/contexts/user-profile-context";
import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/supabase/user";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getUserProfile();
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <UserProfileProvider profile={profile}>
      <div className="flex flex-col h-screen overflow-hidden">
        <AppHeader />
        <div className="h-full pb-12 overflow-y-auto">
          <PageContainer>{children}</PageContainer>
          <div className="fixed bottom-4 right-4 z-50">
            <FloatingTypeform />
          </div>
        </div>
      </div>
    </UserProfileProvider>
  );
}
