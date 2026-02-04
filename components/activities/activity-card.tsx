import {
  Item,
  ItemHeader,
  ItemTitle,
  ItemDescription,
  ItemContent,
} from "@/components/ui/item";
import Link from "next/link";
import { ArrowUpRightIcon, LockIcon, CheckIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  id: string;
  title: string;
  description?: string | null;
  slug?: string;
  imageUrl?: string | null;
  href?: string;
  status?: "locked" | "unlocked" | "completed";
}

export function ActivityCard({
  id,
  title,
  description,
  imageUrl,
  href,
  status = "unlocked",
}: ActivityCardProps) {
  const activityLink = href || `/activity/${id}`;
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  return (
    <Item
      variant="outline"
      asChild={!isLocked}
      className={cn(
        "p-0 overflow-hidden gap-0 rounded-md",
        isLocked && "opacity-60 pointer-events-none",
        isCompleted && ""
      )}
    >
      {isLocked ? (
        <div className="relative w-full">
          <ItemHeader className="bg-accent aspect-video relative w-full">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover filter dark:invert"
              />
            )}
            {/* Lock overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <LockIcon
                strokeWidth={1}
                className="size-20 text-muted-foreground"
              />
            </div>
            {/* <div className="absolute inset-0 bg-linear-to-tl dark:from-black/50 dark:to-black/5 from-white/80 to-white/20 group-hover:bg-white/80 dark:group-hover:bg-black/80 transition-all duration-500 " /> */}
          </ItemHeader>
          <ItemContent className="gap-2 p-4 sm:p-6 lg:p-8">
            <ItemTitle className="text-xl font-medium">{title}</ItemTitle>
            {description && (
              <ItemDescription className="text-base line-clamp-3">
                {description}
              </ItemDescription>
            )}
          </ItemContent>
        </div>
      ) : (
        <Link href={activityLink} className="group transition-all duration-500">
          <ItemHeader className="bg-accent aspect-video relative">
            {imageUrl && (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover filter dark:invert"
              />
            )}
            {isCompleted && (
              <div className="absolute inset-0 flex items-center justify-center">
                <CheckIcon
                  strokeWidth={1}
                  className="size-20 text-green-500 group-hover:opacity-0 transition-opacity duration-500"
                />
              </div>
            )}
            <ArrowUpRightIcon
              strokeWidth={1}
              className="absolute size-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity duration-500 z-50"
            />
            {/* <div className="absolute inset-0 bg-linear-to-tl dark:from-black/50 dark:to-black/5 from-white/80 to-white/20 group-hover:bg-white/80 dark:group-hover:bg-black/80 transition-all duration-500 " /> */}
          </ItemHeader>
          <ItemContent className="gap-2 p-4 sm:p-6 lg:p-8">
            <ItemTitle className="text-xl font-medium">{title}</ItemTitle>
            {description && (
              <ItemDescription className="text-base line-clamp-3">
                {description}
              </ItemDescription>
            )}
          </ItemContent>
        </Link>
      )}
    </Item>
  );
}
