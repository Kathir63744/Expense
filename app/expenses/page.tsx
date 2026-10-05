'use client';
import { useState, useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Download,
  Eye,
  FileSpreadsheet,
  Paperclip,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { Expense, Branch, Attachment } from '@/lib/types';

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
function catColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? 'bg-slate-100 text-slate-600';
}

const PAYMENT_COLORS: Record<string, string> = {
  Cash: 'bg-green-50 text-green-700',
  Card: 'bg-blue-50 text-blue-700',
  'Bank Transfer': 'bg-indigo-50 text-indigo-700',
  UPI: 'bg-purple-50 text-purple-700',
  Cheque: 'bg-gray-100 text-gray-600',
};
function payColor(pm: string) {
  return PAYMENT_COLORS[pm] ?? 'bg-slate-100 text-slate-600';
}

type SortKey = 'date' | 'amount';

export default function ExpensesPage() {
  const expenses = useStore((s) => s.expenses);
  const settings = useStore((s) => s.settings);
  const deleteExpense = useStore((s) => s.deleteExpense);

  const [filterBranch, setFilterBranch] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Expense | null>(null);
  const [toDelete, setToDelete] = useState<Expense | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortAsc((prev) => !prev);
      } else {
        setSortKey(key);
        setSortAsc(false);
      }
    },
    [sortKey]
  );

  const filtered: Expense[] = useMemo(() => {
    let list = expenses;
    if (filterBranch !== 'all') list = list.filter((e) => e.branch === filterBranch);
    if (filterCategory !== 'all') list = list.filter((e) => e.category === filterCategory);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.description.toLowerCase().includes(s) ||
          e.vendor.toLowerCase().includes(s) ||
          e.category.toLowerCase().includes(s) ||
          e.invoiceNumber.toLowerCase().includes(s)
      );
    }
    return [...list].sort((a, b) => {
      if (sortKey === 'date') {
        return sortAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      }
      return sortAsc ? a.amount - b.amount : b.amount - a.amount;
    });
  }, [expenses, filterBranch, filterCategory, search, sortKey, sortAsc]);

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  const fmt = (n: number) =>
    `${settings.currency}${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const exportExcel = (data: Expense[], fileName = 'expenses') => {
    const rows = data.map((e) => ({
      Date: e.date,
      Branch: e.branch,
      Category: e.category,
      Description: e.description,
      Vendor: e.vendor,
      'Invoice #': e.invoiceNumber,
      'Payment Method': e.paymentMethod,
      Amount: e.amount,
      Notes: e.notes,
      Attachments: e.attachments.map((a) => a.name).join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 30 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([out], { type: 'application/octet-stream' }), `${fileName}_${Date.now()}.xlsx`);
  };

  const exportBranchWise = () => {
    const wb = XLSX.utils.book_new();
    const summary = settings.branches.map((b: Branch) => {
      const bExp = expenses.filter((e) => e.branch === b.name);
      return { Branch: b.name, Address: b.address, Entries: bExp.length, 'Total Amount': bExp.reduce((s, e) => s + e.amount, 0) };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), 'Summary');
    settings.branches.forEach((b: Branch) => {
      const bExp = expenses.filter((e) => e.branch === b.name);
      if (bExp.length === 0) return;
      const rows = bExp.map((e) => ({
        Date: e.date, Category: e.category, Description: e.description,
        Vendor: e.vendor, 'Invoice #': e.invoiceNumber,
        'Payment Method': e.paymentMethod, Amount: e.amount, Notes: e.notes,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), b.name.slice(0, 30));
    });
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([out], { type: 'application/octet-stream' }), `branchwise_${Date.now()}.xlsx`);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown size={13} className="text-slate-300 ml-1" />;
    return sortAsc
      ? <ChevronUp size={13} className="text-indigo-500 ml-1" />
      : <ChevronDown size={13} className="text-indigo-500 ml-1" />;
  };

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Expenses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} &middot; {fmt(total)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportExcel(filtered)}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={14} />
            Export
          </button>
          <button
            onClick={exportBranchWise}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <FileSpreadsheet size={14} />
            Branch-wise
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            placeholder="Search description, vendor, invoice…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition bg-white"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 bg-white text-slate-700"
          >
            <option value="all">All Branches</option>
            {settings.branches.map((b: Branch) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || filterCategory !== 'all'
                ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal size={14} />
            {filterCategory !== 'all' ? '1' : ''}
          </button>
        </div>
        {showFilters && (
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 bg-white text-slate-700 sm:w-40"
          >
            <option value="all">All Categories</option>
            {settings.categories.map((c: string) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => handleSort('date')}
                >
                  <span className="inline-flex items-center">
                    Date <SortIcon col="date" />
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Branch</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</th>
                <th
                  className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => handleSort('amount')}
                >
                  <span className="inline-flex items-center justify-end">
                    Amount <SortIcon col="amount" />
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">Files</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-14 text-slate-400 text-sm">
                    No expenses found
                  </td>
                </tr>
              )}
              {filtered.map((e: Expense) => (
                <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{e.date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">
                      {e.branch}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${catColor(e.category)}`}>
                      {e.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[180px] truncate text-slate-800">{e.description}</td>
                  <td className="px-4 py-3 text-slate-600">{e.vendor || <span className="text-slate-300">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${payColor(e.paymentMethod)}`}>
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{fmt(e.amount)}</td>
                  <td className="px-4 py-3 text-center">
                    {e.attachments.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <Paperclip size={12} /> {e.attachments.length}
                      </span>
                    ) : (
                      <span className="text-slate-200">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelected(e)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        aria-label="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => setToDelete(e)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
            No expenses found
          </div>
        )}
        {filtered.map((e: Expense) => (
          <div
            key={e.id}
            className="bg-white rounded-xl border border-slate-200 p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 text-sm truncate">{e.description}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-medium">{e.branch}</span>
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${catColor(e.category)}`}>{e.category}</span>
                </div>
              </div>
              <span className="font-bold text-slate-900 text-sm shrink-0">{fmt(e.amount)}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="text-xs text-slate-400 space-x-2">
                <span>{e.date}</span>
                {e.vendor && <span>· {e.vendor}</span>}
                {e.attachments.length > 0 && (
                  <span className="inline-flex items-center gap-0.5">
                    <Paperclip size={10} /> {e.attachments.length}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setSelected(e)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                  aria-label="View"
                >
                  <Eye size={15} />
                </button>
                <button
                  onClick={() => setToDelete(e)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <DetailModal
          expense={selected}
          onClose={() => setSelected(null)}
          currency={settings.currency}
        />
      )}

      {/* Delete confirmation modal */}
      {toDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Delete expense?</h3>
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-medium text-slate-700">{toDelete.description}</span>
              {' — '}
              {settings.currency}{toDelete.amount.toLocaleString()} will be permanently removed.
            </p>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setToDelete(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { deleteExpense(toDelete.id); setToDelete(null); }}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailModal({
  expense,
  onClose,
  currency,
}: {
  expense: Expense;
  onClose: () => void;
  currency: string;
}) {
  const settings = useStore((s) => s.settings);

  const downloadBill = () => {
    const rows: (string | number)[][] = [
      ['Company', settings.companyName],
      ['Branch', expense.branch],
      ['Date', expense.date],
      ['Category', expense.category],
      ['Description', expense.description],
      ['Vendor', expense.vendor],
      ['Invoice #', expense.invoiceNumber],
      ['Payment Method', expense.paymentMethod],
      ['Amount', `${currency}${expense.amount}`],
      ['Notes', expense.notes],
      ['Created', new Date(expense.createdAt).toLocaleString()],
    ];
    const ws = XLSX.utils.aoa_to_sheet([['EXPENSE BILL'], [], ...rows]);
    ws['!cols'] = [{ wch: 20 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bill');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(
      new Blob([out], { type: 'application/octet-stream' }),
      `bill_${expense.date}_${expense.branch}.xlsx`
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto scrollbar-thin shadow-xl">
        <div className="sticky top-0 bg-white border-b border-slate-100 px-5 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Expense Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Created {new Date(expense.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5 space-y-5">
          {/* Amount hero */}
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 font-medium mb-1">Amount</p>
            <p className="text-3xl font-bold text-slate-900">
              {currency}{expense.amount.toLocaleString('en-IN')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoField label="Branch" value={expense.branch} />
            <InfoField label="Date" value={expense.date} />
            <InfoField label="Category" value={expense.category} />
            <InfoField label="Payment" value={expense.paymentMethod} />
            {expense.vendor && <InfoField label="Vendor" value={expense.vendor} />}
            {expense.invoiceNumber && <InfoField label="Invoice #" value={expense.invoiceNumber} />}
          </div>

          <InfoField label="Description" value={expense.description} />
          {expense.notes && <InfoField label="Notes" value={expense.notes} />}

          {expense.attachments.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Attachments ({expense.attachments.length})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {expense.attachments.map((a: Attachment) => {
                  const isImage = a.type.startsWith('image/');
                  return (
                    <a
                      key={a.id}
                      href={a.data}
                      download={a.name}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-slate-200 rounded-lg p-2 text-xs hover:bg-slate-50 block transition-colors"
                    >
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.data}
                          alt={a.name}
                          className="w-full h-20 object-cover rounded mb-1.5"
                        />
                      ) : (
                        <div className="w-full h-20 flex items-center justify-center bg-slate-100 rounded mb-1.5 text-2xl">
                          📄
                        </div>
                      )}
                      <p className="truncate text-slate-600">{a.name}</p>
                      <p className="text-slate-400 mt-0.5">{(a.size / 1024).toFixed(1)} KB</p>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={downloadBill}
            className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Download size={16} /> Download Bill
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-800 break-words">{value}</p>
    </div>
  );
}