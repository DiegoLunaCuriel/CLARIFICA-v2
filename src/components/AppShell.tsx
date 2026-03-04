"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import AppNavbar from "@/components/AppNavbar";
import { cn } from "@/lib/utils";

const HIDE_NAV_ROUTES = ["/login"];
const STORAGE_KEY = "clarifica_sidebar_collapsed";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = HIDE_NAV_ROUTES.some((r) => pathname.startsWith(r));

  const [collapsed, setCollapsed] = useState(false);

  // Persistir estado del sidebar en localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  if (hideNav) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <AppNavbar collapsed={collapsed} onToggleCollapse={handleToggle} />
      <main
        className={cn(
          "min-h-screen pt-14 lg:pt-0 transition-all duration-200",
          collapsed ? "lg:pl-16" : "lg:pl-56"
        )}
      >
        <div className="container mx-auto px-4 py-6 lg:py-8">
          {children}
        </div>
      </main>
    </>
  );
}
