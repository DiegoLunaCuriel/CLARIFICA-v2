"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Building2,
  LayoutDashboard,
  Package,
  Search,
  ShoppingCart,
  Sparkles,
  LogIn,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  HardHat,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Inicio", icon: Building2, color: "amber" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "amber", requiresAuth: true },
  { href: "/materials", label: "Materiales", icon: Package, color: "orange" },
  { href: "/store-search", label: "Buscador", icon: Search, color: "blue" },
  { href: "/compare", label: "Comparador", icon: ShoppingCart, color: "emerald" },
  { href: "/decision", label: "Asistente IA", icon: Sparkles, color: "purple" },
];

const ICON_COLORS: Record<string, string> = {
  amber: "text-amber-400",
  orange: "text-orange-400",
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  purple: "text-purple-400",
};

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleNav = (href: string) => {
    router.push(href);
    onNavigate?.();
  };

  const handleLogout = async () => {
    await logout();
    onNavigate?.();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Brand ── */}
      <div
        className={cn(
          "relative flex items-center gap-3 px-4 py-5 shrink-0",
          collapsed && "justify-center px-2"
        )}
      >
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(245,158,11,0.12), transparent 80%)",
          }}
        />
        <div
          className="relative shrink-0 h-9 w-9 rounded-xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.25) 0%, rgba(251,146,60,0.15) 100%)",
            border: "1px solid rgba(245,158,11,0.35)",
            boxShadow: "0 0 16px rgba(245,158,11,0.25), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          <HardHat className="h-5 w-5 text-amber-400" />
        </div>
        {!collapsed && (
          <div className="relative flex flex-col leading-tight min-w-0">
            <span
              className="font-extrabold tracking-tight text-sm"
              style={{
                background: "linear-gradient(90deg, #fbbf24, #fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              CLARIFICA
            </span>
            <span className="text-[9px] text-muted-foreground tracking-widest uppercase">
              Hub de Construcción
            </span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="h-px mx-3 shrink-0" style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)" }} />

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          if (item.requiresAuth && !user) return null;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          const iconColor = ICON_COLORS[item.color];

          return (
            <button
              key={item.href}
              onClick={() => handleNav(item.href)}
              className={cn(
                "group relative flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-amber-300"
                  : "text-muted-foreground hover:text-foreground",
                collapsed && "justify-center px-2"
              )}
              style={
                isActive
                  ? {
                    background: "linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(251,146,60,0.08) 100%)",
                    border: "1px solid rgba(245,158,11,0.25)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 12px rgba(245,158,11,0.1)",
                  }
                  : {
                    border: "1px solid transparent",
                  }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-all duration-200",
                  isActive ? iconColor : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <span
                  className="ml-auto h-1.5 w-1.5 rounded-full"
                  style={{
                    background: "#f59e0b",
                    boxShadow: "0 0 6px rgba(245,158,11,0.9)",
                  }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="h-px mx-3 shrink-0" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />

      {/* ── Footer ── */}
      <div className="px-2 py-4 space-y-1 shrink-0">
        <div className={cn("flex items-center px-1 py-1", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <span className="text-[11px] text-muted-foreground px-2">Tema</span>}
          <ThemeToggle />
        </div>

        {user ? (
          <button
            className="group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-red-400 transition-all duration-200"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(239,68,68,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        ) : (
          <button
            className="group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-all duration-200"
            style={{ border: "1px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.08)";
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "";
              (e.currentTarget as HTMLElement).style.borderColor = "transparent";
            }}
            onClick={() => handleNav("/login")}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Iniciar sesión</span>}
          </button>
        )}

        <button
          className={cn(
            "group flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:text-amber-400 transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
          style={{ border: "1px solid transparent" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(245,158,11,0.08)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(245,158,11,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "";
            (e.currentTarget as HTMLElement).style.borderColor = "transparent";
          }}
          onClick={() => handleNav("/privacidad")}
          title={collapsed ? "Aviso de Privacidad" : undefined}
        >
          <Shield className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Privacidad</span>}
        </button>

        {onToggleCollapse && (
          <button
            className="flex items-center justify-center w-full rounded-xl p-2 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/8 transition-all duration-200"
            onClick={onToggleCollapse}
          >
            {collapsed
              ? <ChevronRight className="h-4 w-4" />
              : <ChevronLeft className="h-4 w-4" />
            }
          </button>
        )}
      </div>
    </div>
  );
}

interface AppNavbarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function AppNavbar({ collapsed, onToggleCollapse }: AppNavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* ── Mobile: topbar + Sheet ── */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-14"
        style={{
          background: "rgba(9, 9, 16, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 1px 0 rgba(245,158,11,0.08)",
        }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-60 p-0"
            style={{
              background: "oklch(0.11 0.016 260)",
              borderRight: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <HardHat className="h-4 w-4 text-amber-400" />
          </div>
          <span
            className="font-extrabold tracking-tight text-sm"
            style={{
              background: "linear-gradient(90deg, #fbbf24, #fb923c)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CLARIFICA
          </span>
        </div>
      </div>

      {/* ── Desktop: fixed sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300",
          collapsed ? "w-16" : "w-56"
        )}
        style={{
          background: "oklch(0.11 0.016 260)",
          borderRight: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "1px 0 0 rgba(245,158,11,0.05), 4px 0 32px rgba(0,0,0,0.3)",
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </aside>
    </>
  );
}

