'use client';
import { useStore } from '@/lib/store';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  ArrowUpRight,
  Building2,
  FileText,
  IndianRupee,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { Branch, Expense, Settings } from '@/lib/types';

interface BranchTotal {
  id: string;
  name: string;
  address: string;
  phone: string;
  total: number;
  count: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Rent: 'bg-violet-100 text-violet-700',
  Utilities: 'bg-sky-100 text-sky-700',
  Salaries: 'bg-emerald-100 text-emerald-700',
  Supplies: 'bg-amber-100 text-amber-700',
  Marketing: 'bg-pink-100 text-pink-700',
  Travel: 'bg-orange-100 text-orange-700',
  Maintenance: 'bg-teal-100 text-teal-700',
  Other: 'bg-slate-100 text-slate-600',
};

function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? 'bg-slate-100 text-slate-600';
}

export default function Home() {
  const expenses: Expense[] = useStore((s) => s.expenses);
  const settings: Settings = useStore((s) => s.settings);

  const total: number = expenses.reduce((sum, e) => sum + e.amount, 0);

  // This month vs last month spend
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const thisMonthTotal = expenses
    .filter((e) => e.date.startsWith(thisMonth))
    .reduce((s, e) => s + e.amount, 0);
  const lastMonthTotal = expenses
    .filter((e) => e.date.startsWith(lastMonth))
    .reduce((s, e) => s + e.amount, 0);

  const monthDelta =
    lastMonthTotal > 0
      ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
      : null;

  // Top categories
  const categoryMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of expenses) {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [expenses]);

  const branchTotals: BranchTotal[] = settings.branches.map((b: Branch) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    total: expenses
      .filter((e) => e.branch === b.name)
      .reduce((sum, e) => sum + e.amount, 0),
    count: expenses.filter((e) => e.branch === b.name).length,
  }));

  const needsSetup =
    !settings.companyName ||
    !settings.currency ||
    settings.branches.length === 0;

  const fmt = (n: number) =>
    `${settings.currency}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  // Recent 5 expenses
  const recent = [...expenses]
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {settings.ownerName ? `Good day, ${settings.ownerName}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {settings.companyName || 'Set up your company in Settings'}
          </p>
        </div>
        <Link
          href="/add"
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          Add Expense
        </Link>
      </div>

      {needsSetup && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <div className="w-1 h-full bg-amber-400 rounded-full shrink-0 self-stretch" />
          <div className="text-sm">
            <p className="font-medium text-amber-900">Finish setup</p>
            <p className="text-amber-700 mt-0.5">
              Add your company name, currency, and branches in{' '}
              <Link href="/settings" className="underline font-medium">
                Settings
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Spend"
          value={fmt(total)}
          sub={`${expenses.length} entries`}
          icon={<IndianRupee size={16} />}
          accent="indigo"
        />
        <StatCard
          label="This Month"
          value={fmt(thisMonthTotal)}
          sub={
            monthDelta !== null ? (
              <span
                className={`inline-flex items-center gap-0.5 ${
                  monthDelta >= 0 ? 'text-red-500' : 'text-emerald-600'
                }`}
              >
                {monthDelta >= 0 ? (
                  <TrendingUp size={12} />
                ) : (
                  <TrendingDown size={12} />
                )}
                {Math.abs(monthDelta).toFixed(1)}% vs last month
              </span>
            ) : (
              'vs last month'
            )
          }
          icon={<TrendingUp size={16} />}
          accent="sky"
        />
        <StatCard
          label="Branches"
          value={settings.branches.length.toString()}
          sub="active locations"
          icon={<Building2 size={16} />}
          accent="violet"
        />
        <StatCard
          label="Entries"
          value={expenses.length.toString()}
          sub="total records"
          icon={<FileText size={16} />}
          accent="emerald"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Branch breakdown */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900">Branch Overview</h2>
            <Link
              href="/expenses"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View all <ArrowUpRight size={12} />
            </Link>
          </div>
          {branchTotals.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <Building2 size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No branches configured.</p>
              <Link
                href="/settings"
                className="text-sm text-indigo-600 font-medium mt-1 inline-block"
              >
                Add one in Settings →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {branchTotals.map((b) => {
                const pct =
                  total > 0 ? Math.round((b.total / total) * 100) : 0;
                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{b.name}</p>
                        {b.address && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[160px]">
                            {b.address}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{pct}%</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-900 mt-3">
                      {fmt(b.total)}
                    </p>
                    <div className="mt-2">
                      <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{b.count} entries</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top categories + recent */}
        <div className="space-y-4">
          {/* Top categories */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Top Categories</h2>
            {categoryMap.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
                No data yet
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {categoryMap.map(([cat, amt]) => (
                  <div key={cat} className="flex items-center justify-between px-4 py-2.5">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-md ${getCategoryColor(cat)}`}
                    >
                      {cat}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">
                      {fmt(amt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent expenses */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Recent</h2>
            {recent.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-400">
                No expenses yet
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                {recent.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {e.description}
                      </p>
                      <p className="text-xs text-slate-400">{e.date} · {e.branch}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 shrink-0">
                      {fmt(e.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: React.ReactNode;
  accent: 'indigo' | 'sky' | 'violet' | 'emerald';
}) {
  const accentMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    sky: 'bg-sky-50 text-sky-600',
    violet: 'bg-violet-50 text-violet-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentMap[accent]} mb-3`}>
        {icon}
      </div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-0.5 leading-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  );
}