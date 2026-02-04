"use client";

import { ResponsiveWrapper } from "@/components/layout/responsive-wrapper";

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveWrapper minWidth={1088} minHeight={768}>
      {children}
    </ResponsiveWrapper>
  );
}
