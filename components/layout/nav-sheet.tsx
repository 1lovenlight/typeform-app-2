"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "../ui/drawer";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import Image from "next/image";

export function NavSheet() {
  const pathname = usePathname();

  const navItems = [
    { href: "/home", label: "Home" },
    { href: "/browse", label: "Browse" },
    { href: "/practice", label: "Practice" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <Drawer direction="left">
      <DrawerTrigger asChild>
        <MenuIcon className="size-5 text-muted-foreground hover:text-foreground cursor-pointer" />
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="min-h-16 border-b flex items-start justify-center py-0">
          <Image src="/rhThumb.png" alt="Logo" width={48} height={48} />
          <DrawerTitle className="sr-only">Navigation</DrawerTitle>
        </DrawerHeader>
        <nav className="flex flex-col gap-2 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <DrawerClose key={item.href} asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className={cn(
                    "justify-start text-2xl h-12 font-normal bg-transparent",
                    isActive && "bg-accent text-accent-foreground font-semibold"
                  )}
                >
                  <Link href={item.href}>{item.label}</Link>
                </Button>
              </DrawerClose>
            );
          })}
        </nav>
      </DrawerContent>
    </Drawer>
  );
}
