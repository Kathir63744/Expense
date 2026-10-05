'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { BarChart3, LayoutDashboard, Plus, List, Settings2, X, Menu } from 'lucide-react';
import { useStore } from '@/lib/store';

const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/add', label: 'Add Expense', icon: Plus },
  { href: '/expenses', label: 'Expenses', icon: List },
  { href: '/settings', label: 'Settings', icon: Settings2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const settings = useStore((s) => s.settings);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-14 items-center">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
              <BarChart3 size={15} className="text-white" />
            </div>
            <div className="leading-none">
              <span className="font-semibold text-slate-900 text-sm tracking-tight">
                {settings.companyName || 'Expense Manager'}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {links.map((l) => {
              const Icon = l.icon;
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 2} />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white py-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? 'text-indigo-700 bg-indigo-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}