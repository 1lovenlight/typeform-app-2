import { PageHeading } from "@/components/layout/page-heading";

import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoiceChat from "@/components/practice/voice-chat";

export default function PracticePage() {
  return (
    <div className="flex flex-col w-full h-full gap-4 sm:gap-6 lg:gap-8">
      <PageHeading
        className="md:justify-start gap-4 sm:gap-x-6 lg:gap-x-8"
        title="Practice"
        actions={
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Choose Character" />
            </SelectTrigger>
          </Select>
        }
      />
      <div className="flex flex-row w-full h-full gap-4 sm:gap-6 lg:gap-8">
        <VoiceChat />
        <div className="flex h-full w-full border rounded-md border-dashed items-center justify-center text-muted-foreground">
          {/* Live Guidance */}
        </div>
      </div>
    </div>
  );
}
