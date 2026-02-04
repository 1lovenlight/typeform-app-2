import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-start mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 h-full relative",
        className
      )}
    >
      {children}
    </div>
  );
}

export function HeaderContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-full",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AuthContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex mx-auto w-full max-w-md p-4 sm:p-6 lg:p-8 h-full min-h-screen justify-center py-24 sm:py-32 lg:py-40",
        className
      )}
    >
      <div className="w-full h-full">{children}</div>
    </div>
  );
}
