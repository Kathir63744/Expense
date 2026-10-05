'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { Attachment, Expense, Branch } from '@/lib/types';
import { Upload, X, Save, ArrowLeft, Paperclip } from 'lucide-react';
import Link from 'next/link';

export default function AddExpense() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const addExpense = useStore((s) => s.addExpense);

  const [form, setForm] = useState({
    branch: settings.branches[0]?.name || '',
    date: new Date().toISOString().split('T')[0],
    category: settings.categories[0] || '',
    description: '',
    amount: '',
    paymentMethod: settings.paymentMethods[0] || '',
    vendor: '',
    invoiceNumber: '',
    notes: '',
  });
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const list: Attachment[] = [];
    for (const file of Array.from(files)) {
      const data = await toBase64(file);
      list.push({ id: crypto.randomUUID(), name: file.name, type: file.type, size: file.size, data });
    }
    setAttachments((prev) => [...prev, ...list]);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)
      e.amount = 'Enter a valid amount';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.branch) e.branch = 'Select a branch';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const expense: Expense = {
      id: crypto.randomUUID(),
      branch: form.branch,
      date: form.date,
      category: form.category,
      description: form.description.trim(),
      amount: parseFloat(form.amount),
      paymentMethod: form.paymentMethod,
      vendor: form.vendor.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      notes: form.notes.trim(),
      attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addExpense(expense);
    router.push('/expenses');
  };

  const update = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const inputCls = (field?: string) =>
    `w-full px-3 py-2 border rounded-lg text-sm outline-none transition bg-white ${
      field && errors[field]
        ? 'border-red-300 focus:border-red-400 focus:ring-1 focus:ring-red-100'
        : 'border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100'
    }`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link
          href="/expenses"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">New Expense</h1>
          <p className="text-sm text-slate-400 mt-0.5">Fill in the details below</p>
        </div>
      </div>

      {settings.branches.length === 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          No branches configured.{' '}
          <Link href="/settings" className="font-medium underline">
            Add branches in Settings
          </Link>{' '}
          before adding expenses.
        </div>
      )}

      <form onSubmit={submit} noValidate>
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {/* Section: Core details */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Core Details</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Branch" required error={errors.branch}>
                <select
                  value={form.branch}
                  onChange={(e) => update('branch', e.target.value)}
                  className={inputCls('branch')}
                >
                  {settings.branches.map((br: Branch) => (
                    <option key={br.id} value={br.name}>{br.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Date" required>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => update('date', e.target.value)}
                  className={inputCls()}
                />
              </Field>
              <Field label="Category" required>
                <select
                  value={form.category}
                  onChange={(e) => update('category', e.target.value)}
                  className={inputCls()}
                >
                  {settings.categories.map((cat: string) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </Field>
              <Field label="Amount" required error={errors.amount}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                    {settings.currency}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => update('amount', e.target.value)}
                    placeholder="0.00"
                    className={`${inputCls('amount')} pl-7`}
                  />
                </div>
              </Field>
            </div>
            <Field label="Description" required error={errors.description}>
              <input
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Brief description of the expense"
                className={inputCls('description')}
              />
            </Field>
          </div>

          {/* Section: Payment & vendor */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment & Vendor</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Payment Method">
                <select
                  value={form.paymentMethod}
                  onChange={(e) => update('paymentMethod', e.target.value)}
                  className={inputCls()}
                >
                  {settings.paymentMethods.map((pm: string) => (
                    <option key={pm} value={pm}>{pm}</option>
                  ))}
                </select>
              </Field>
              <Field label="Vendor">
                <input
                  value={form.vendor}
                  onChange={(e) => update('vendor', e.target.value)}
                  placeholder="Vendor / supplier name"
                  className={inputCls()}
                />
              </Field>
              <Field label="Invoice Number">
                <input
                  value={form.invoiceNumber}
                  onChange={(e) => update('invoiceNumber', e.target.value)}
                  placeholder="INV-001"
                  className={inputCls()}
                />
              </Field>
            </div>
          </div>

          {/* Section: Notes */}
          <div className="p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes & Files</p>
            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={3}
                placeholder="Any additional notes or remarks…"
                className={`${inputCls()} resize-none`}
              />
            </Field>

            {/* File upload */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Attachments</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-6 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors group">
                <Upload size={20} className="text-slate-300 group-hover:text-indigo-400 mb-2 transition-colors" />
                <span className="text-sm text-slate-500 group-hover:text-indigo-600 transition-colors font-medium">
                  Click to upload
                </span>
                <span className="text-xs text-slate-400 mt-0.5">Images, PDFs, docs — any format</span>
                <input type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              </label>

              {attachments.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  {attachments.map((att: Attachment) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg"
                    >
                      <Paperclip size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 truncate flex-1">{att.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">{(att.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== att.id))}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                        aria-label="Remove file"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 justify-end">
          <Link
            href="/expenses"
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={settings.branches.length === 0}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={15} />
            Save Expense
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}