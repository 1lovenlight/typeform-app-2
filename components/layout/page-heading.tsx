import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  actions,
  className,
}: {
  title: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("md:flex md:items-center md:justify-between", className)}
    >
      <div className="min-w-0 flex">
        <h2 className="text-3xl font-medium sm:truncate sm:text-4xl tracking-tight">
          {title}
        </h2>
      </div>
      {actions && <div className="mt-4 flex md:mt-0">{actions}</div>}
    </div>
  );
}
