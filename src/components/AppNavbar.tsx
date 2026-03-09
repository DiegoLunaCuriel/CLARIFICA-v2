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
  { href: "/", label: "Inicio", icon: Building2, accentColor: "#f5a400", accentRgb: "245,164,0" },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, accentColor: "#f5a400", accentRgb: "245,164,0", requiresAuth: true },
  { href: "/materials", label: "Materiales", icon: Package, accentColor: "#ff6600", accentRgb: "255,102,0" },
  { href: "/store-search", label: "Buscador", icon: Search, accentColor: "#00cfff", accentRgb: "0,207,255" },
  { href: "/compare", label: "Comparador", icon: ShoppingCart, accentColor: "#00c56e", accentRgb: "0,197,110" },
  { href: "/decision", label: "Asistente IA", icon: Sparkles, accentColor: "#a855f7", accentRgb: "168,85,247" },
];

function NavItem({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: typeof NAV_ITEMS[0];
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 w-full py-2 text-[13px] font-medium transition-all duration-150",
        collapsed ? "justify-center px-0" : "px-3"
      )}
      style={{
        fontFamily: "'DM Sans', sans-serif",
        color: isActive ? item.accentColor : "var(--muted-foreground)",
        background: isActive ? `rgba(${item.accentRgb}, 0.09)` : "transparent",
        borderLeft: isActive ? `2px solid ${item.accentColor}` : "2px solid transparent",
        borderRadius: "0 2px 2px 0",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
          (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
          (e.currentTarget as HTMLElement).style.background = "transparent";
        }
      }}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" style={{ strokeWidth: 1.8 }} />
      {!collapsed && (
        <span style={{ letterSpacing: "-0.01em" }}>{item.label}</span>
      )}
    </button>
  );
}

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
          "flex items-center gap-3 px-4 py-[18px] shrink-0",
          collapsed && "justify-center px-0"
        )}
        style={{ borderBottom: "1px solid var(--sidebar-border)" }}
      >
        {/* Logo icon */}
        <div
          className="shrink-0 h-8 w-8 flex items-center justify-center relative overflow-hidden"
          style={{
            background: "var(--amber)",
            borderRadius: "2px",
          }}
        >
          <HardHat className="h-4 w-4" style={{ color: "#080807", strokeWidth: 2.2 }} />
        </div>

        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <div
              className="font-black text-[15px] leading-none tracking-[-0.04em] truncate"
              style={{ fontFamily: "'Syne', sans-serif", color: "var(--foreground)" }}
            >
              CLARIFICA
            </div>
            <div
              className="text-[9px] tracking-[0.14em] uppercase mt-0.5 truncate"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)" }}
            >
              Hub Construcción
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          if (item.requiresAuth && !user) return null;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <NavItem
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              onClick={() => handleNav(item.href)}
            />
          );
        })}
      </nav>

      {/* ── Divider ── */}
      <div
        className="mx-2 shrink-0"
        style={{ height: "1px", background: "var(--sidebar-border)" }}
      />

      {/* ── Footer ── */}
      <div className={cn("px-2 py-3 space-y-0.5 shrink-0")}>
        {/* Theme toggle */}
        <div
          className={cn(
            "flex items-center py-1.5",
            collapsed ? "justify-center px-0" : "justify-between px-2"
          )}
        >
          {!collapsed && (
            <span
              className="text-[10px] uppercase tracking-[0.12em]"
              style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--muted-foreground)", opacity: 0.6 }}
            >
              Tema
            </span>
          )}
          <ThemeToggle />
        </div>

        {/* Login / Logout */}
        {user ? (
          <button
            className={cn(
              "flex items-center gap-3 w-full py-2 text-[13px] transition-all duration-150",
              collapsed ? "justify-center px-0" : "px-3"
            )}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--muted-foreground)",
              borderRadius: "2px",
              borderLeft: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "#ff3b30";
              (e.currentTarget as HTMLElement).style.background = "rgba(255,59,48,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 shrink-0" style={{ strokeWidth: 1.8 }} />
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        ) : (
          <button
            className={cn(
              "flex items-center gap-3 w-full py-2 text-[13px] transition-all duration-150",
              collapsed ? "justify-center px-0" : "px-3"
            )}
            style={{
              fontFamily: "'DM Sans', sans-serif",
              color: "var(--muted-foreground)",
              borderRadius: "2px",
              borderLeft: "2px solid transparent",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--amber)";
              (e.currentTarget as HTMLElement).style.background = "rgba(245,164,0,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
            onClick={() => handleNav("/login")}
          >
            <LogIn className="h-4 w-4 shrink-0" style={{ strokeWidth: 1.8 }} />
            {!collapsed && <span>Iniciar sesión</span>}
          </button>
        )}

        {/* Privacy */}
        <button
          className={cn(
            "flex items-center gap-3 w-full py-2 text-[13px] transition-all duration-150",
            collapsed ? "justify-center px-0" : "px-3"
          )}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            color: "rgba(122,110,98,0.5)",
            borderRadius: "2px",
            borderLeft: "2px solid transparent",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--muted-foreground)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(122,110,98,0.5)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
          onClick={() => handleNav("/privacidad")}
          title={collapsed ? "Aviso de Privacidad" : undefined}
        >
          <Shield className="h-4 w-4 shrink-0" style={{ strokeWidth: 1.8 }} />
          {!collapsed && <span>Privacidad</span>}
        </button>

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            className="flex items-center justify-center w-full py-2 transition-all duration-150"
            style={{ color: "rgba(122,110,98,0.4)", borderRadius: "2px" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = "var(--amber)";
              (e.currentTarget as HTMLElement).style.background = "rgba(245,164,0,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = "rgba(122,110,98,0.4)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
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
        className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-3 px-4 h-12"
        style={{
          background: "var(--sidebar)",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              style={{ color: "var(--muted-foreground)" }}
            >
              <Menu className="h-5 w-5" style={{ strokeWidth: 1.8 }} />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[220px] p-0"
            style={{
              background: "var(--sidebar)",
              borderRight: "1px solid var(--sidebar-border)",
            }}
          >
            <SidebarContent
              collapsed={false}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        {/* Mobile brand */}
        <div className="flex items-center gap-2">
          <div
            className="h-7 w-7 flex items-center justify-center shrink-0"
            style={{ background: "var(--amber)", borderRadius: "2px" }}
          >
            <HardHat className="h-3.5 w-3.5" style={{ color: "#080807", strokeWidth: 2.2 }} />
          </div>
          <span
            className="font-black text-[15px] tracking-[-0.04em]"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            CLARIFICA
          </span>
        </div>
      </div>

      {/* ── Desktop: fixed sidebar ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-40 transition-all duration-300",
          collapsed ? "w-[60px]" : "w-[220px]"
        )}
        style={{
          background: "var(--sidebar)",
          borderRight: "1px solid var(--sidebar-border)",
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
