import { AuthButtons } from "@/components/auth/auth-buttons";
import { AuthContainer } from "@/components/layout/page-container";
import { PageHeading } from "@/components/layout/page-heading";

export default function Home() {
  return (
    <AuthContainer>
      <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 w-full">
        <PageHeading title="RH Study" />
        <AuthButtons />
      </div>
    </AuthContainer>
  );
}
