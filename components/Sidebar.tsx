"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    section: "INTELLIGENCE",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>,
      },
      {
        href: "/dashboard/analytics",
        label: "Call Analytics",
        badge: "LIVE",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      },
      {
        href: "/dashboard/callers",
        label: "Caller Directory",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.26 12 19.79 19.79 0 0 1 1.15 3.42 2 2 0 0 1 3.12 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 16z"/></svg>,
      },
      {
        href: "/dashboard/calls",
        label: "Call Intelligence",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      },
    ],
  },
  {
    section: "CRM",
    items: [
      {
        href: "/dashboard/pipeline",
        label: "CRM Pipeline",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
    ],
  },
  {
    section: "AGENTS",
    items: [
      {
        href: "/dashboard/agents",
        label: "Agent Manager",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
      },
      {
        href: "/dashboard/agents/create",
        label: "Create Agent",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
      },
    ],
  },
  {
    section: "SYSTEM",
    items: [
      {
        href: "/dashboard/control",
        label: "System Control",
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M5.34 18.66l-1.41 1.41M20 12h-2M6 12H4M19.07 19.07l-1.41-1.41M5.34 5.34L3.93 3.93M12 20v-2M12 6V4"/></svg>,
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || (href !== "/dashboard/agents" && pathname.startsWith(href));
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-60 z-30 flex flex-col"
      style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRight: "1px solid rgba(0,0,0,0.06)" }}>
      {/* Logo */}
      <div className="px-6 pt-7 pb-5 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: "#f97316" }}>L1</div>
          <div>
            <div className="font-semibold text-[13px] text-gray-900 leading-tight">Level One</div>
            <div className="text-[11px] text-gray-400 leading-tight mt-0.5">Voice Intelligence</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-3">
        {navItems.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{group.section}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group
                    ${isActive(item.href) ? "bg-orange-500 text-white shadow-sm" : "text-gray-600 hover:bg-black/5 hover:text-gray-900"}`}>
                  <span className={`flex-shrink-0 ${isActive(item.href) ? "text-white" : "text-gray-400 group-hover:text-gray-600"}`}>{item.icon}</span>
                  <span className="flex-1 leading-tight">{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                      ${isActive(item.href) ? "bg-white/25 text-white" : "bg-orange-100 text-orange-500"}`}>{item.badge}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-black/5">
        <div className="text-[11px] text-gray-400">
          <div className="font-medium text-gray-500 mb-0.5">The Architect</div>
          <div>AI Voice Platform v1.0</div>
        </div>
      </div>
    </aside>
  );
}
