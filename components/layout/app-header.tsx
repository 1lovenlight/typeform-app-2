"use client";

import { HeaderContainer } from "./page-container";
import { NavSheet } from "./nav-sheet";

export function AppHeader() {
  return (
    <header className="min-h-16 w-full border-b">
      <HeaderContainer>
        <div className="flex flex-row items-center justify-between">
          <NavSheet />
        </div>
      </HeaderContainer>
    </header>
  );
}
