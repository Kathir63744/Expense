'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Branch, Settings } from '@/lib/types';
import { Plus, Trash2, Save, Check, Building2, Tag, CreditCard, Globe, X } from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 transition bg-white';

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);

  const [form, setForm] = useState<Settings>(settings);
  const [saved, setSaved] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newPayment, setNewPayment] = useState('');

  const save = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updateBranch = (id: string, patch: Partial<Branch>) => {
    setForm((f: Settings) => ({
      ...f,
      branches: f.branches.map((b: Branch) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  };

  const addBranch = () => {
    setForm((f) => ({
      ...f,
      branches: [...f.branches, { id: crypto.randomUUID(), name: '', address: '', phone: '' }],
    }));
  };

  const removeBranch = (id: string) => {
    setForm((f) => ({ ...f, branches: f.branches.filter((b: Branch) => b.id !== id) }));
  };

  const addCategory = () => {
    const cat = newCategory.trim();
    if (!cat || form.categories.includes(cat)) return;
    setForm((f) => ({ ...f, categories: [...f.categories, cat] }));
    setNewCategory('');
  };

  const removeCategory = (cat: string) => {
    setForm((f) => ({ ...f, categories: f.categories.filter((c) => c !== cat) }));
  };

  const addPaymentMethod = () => {
    const pm = newPayment.trim();
    if (!pm || form.paymentMethods.includes(pm)) return;
    setForm((f) => ({ ...f, paymentMethods: [...f.paymentMethods, pm] }));
    setNewPayment('');
  };

  const removePaymentMethod = (pm: string) => {
    setForm((f) => ({ ...f, paymentMethods: f.paymentMethods.filter((p) => p !== pm) }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure your company, branches, and preferences</p>
        </div>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : 'Save'}
        </button>
      </div>

      {/* Company Info */}
      <Section icon={<Globe size={15} />} title="Company">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company Name">
            <input
              className={inputCls}
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Acme Corp"
            />
          </Field>
          <Field label="Owner / Admin Name">
            <input
              className={inputCls}
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="Your name"
            />
          </Field>
          <Field label="Currency Symbol">
            <input
              className={inputCls}
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="₹"
              maxLength={5}
            />
          </Field>
        </div>
      </Section>

      {/* Branches */}
      <Section icon={<Building2 size={15} />} title="Branches">
        <div className="space-y-3">
          {form.branches.length === 0 && (
            <p className="text-sm text-slate-400 py-2">No branches yet. Add one below.</p>
          )}
          {form.branches.map((b: Branch, i: number) => (
            <div
              key={b.id}
              className="grid grid-cols-[auto_1fr_1fr_auto] gap-2 items-end"
            >
              <span className="w-5 text-xs text-slate-400 font-medium mb-2.5">{i + 1}</span>
              <Field label={i === 0 ? 'Branch Name' : undefined}>
                <input
                  className={inputCls}
                  value={b.name}
                  onChange={(e) => updateBranch(b.id, { name: e.target.value })}
                  placeholder="Branch name"
                />
              </Field>
              <Field label={i === 0 ? 'Address' : undefined}>
                <input
                  className={inputCls}
                  value={b.address}
                  onChange={(e) => updateBranch(b.id, { address: e.target.value })}
                  placeholder="Address (optional)"
                />
              </Field>
              <button
                onClick={() => removeBranch(b.id)}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors h-9"
                aria-label="Remove branch"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button
            onClick={addBranch}
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            <Plus size={15} /> Add Branch
          </button>
        </div>
      </Section>

      {/* Categories */}
      <Section icon={<Tag size={15} />} title="Expense Categories">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {form.categories.map((cat: string) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-sm"
            >
              {cat}
              <button
                onClick={() => removeCategory(cat)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ${cat}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {form.categories.length === 0 && (
            <p className="text-sm text-slate-400">No categories. Add one below.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCategory())}
            placeholder="New category…"
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={addCategory}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </Section>

      {/* Payment Methods */}
      <Section icon={<CreditCard size={15} />} title="Payment Methods">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {form.paymentMethods.map((pm: string) => (
            <span
              key={pm}
              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-sm"
            >
              {pm}
              <button
                onClick={() => removePaymentMethod(pm)}
                className="text-slate-400 hover:text-red-500 transition-colors"
                aria-label={`Remove ${pm}`}
              >
                <X size={13} />
              </button>
            </span>
          ))}
          {form.paymentMethods.length === 0 && (
            <p className="text-sm text-slate-400">No payment methods. Add one below.</p>
          )}
        </div>
        <div className="flex gap-2">
          <input
            value={newPayment}
            onChange={(e) => setNewPayment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPaymentMethod())}
            placeholder="e.g. UPI, Cash, Card…"
            className={`${inputCls} flex-1`}
          />
          <button
            onClick={addPaymentMethod}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </Section>

      {/* Save row */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-4">
        <p className="text-sm text-slate-500">
          {saved ? (
            <span className="text-emerald-600 font-medium flex items-center gap-1.5">
              <Check size={15} /> Settings saved successfully
            </span>
          ) : (
            'Changes are not saved until you click Save'
          )}
        </p>
        <button
          onClick={save}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <span className="text-slate-500">{icon}</span>
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  if (!label) return <div>{children}</div>;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}