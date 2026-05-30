'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Phone,
  GitBranch,
  Terminal,
  Menu,
  X,
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/calls', label: 'Call Log', icon: Phone },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/dashboard/control', label: 'Control', icon: Terminal },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 rounded-md border border-white/10 bg-[#111] p-2 text-white lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col border-r border-white/10 bg-[#0f0f0f] transition-transform duration-200 ease-in-out lg:static lg:translate-x-0',
          mobileOpen && 'translate-x-0'
        )}
      >
        <div className="border-b border-white/10 p-6">
          <h1 className="text-lg font-semibold uppercase tracking-wider text-white">
            Level One
          </h1>
          <p className="mt-1 text-xs text-slate-500">Systems Architecture</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'border border-white/10 bg-white/10 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <span className="text-xs text-slate-600">v1.0.0</span>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}
