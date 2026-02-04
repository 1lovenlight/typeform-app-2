"use client";

import { ResponsiveWrapper } from "@/components/layout/responsive-wrapper";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ResponsiveWrapper minWidth={768} minHeight={768}>
      {children}
    </ResponsiveWrapper>
  );
}
