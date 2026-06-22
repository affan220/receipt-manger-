import { NavLink } from "react-router-dom";
import { BellRing, LayoutDashboard, FileBarChart, Settings, Upload, Printer } from "lucide-react";
import { APP_VERSION } from "@/lib/store";
import { useApp } from "@/lib/app-context";
import { initialsOf } from "@/lib/store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/follow-up", label: "Follow Up", icon: BellRing },
  { to: "/reports", label: "Reports", icon: FileBarChart },
  { to: "/import", label: "Import CSV/TXT", icon: Upload },
  { to: "/print", label: "Print Center", icon: Printer },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { settings } = useApp();
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-gradient-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground font-display font-bold shadow-glow overflow-hidden">
          {settings.logoDataUrl ? (
            <img src={settings.logoDataUrl} alt="Logo" className="h-full w-full object-cover" />
          ) : (
            <span>{initialsOf(settings.name)}</span>
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-base font-bold leading-tight truncate">{settings.name}</h1>
          <p className="text-[11px] text-sidebar-foreground/60 truncate">Receipt Manager</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-5 py-4 text-[11px] text-sidebar-foreground/55">
        <div className="flex items-center justify-between">
          <span>v{APP_VERSION}</span>
        </div>
        <p className="mt-1 truncate">Developed by Affan</p>
        <p className="mt-1 truncate">© {new Date().getFullYear()} {settings.name}</p>
      </div>
    </aside>
  );
}
