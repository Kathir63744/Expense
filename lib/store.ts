'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Expense, Settings } from './types';

interface Store {
  expenses: Expense[];
  settings: Settings;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  companyName: 'My Company',
  ownerName: 'Owner',
  currency: '₹',
  branches: [
    { id: '1', name: 'Branch 1', address: '', phone: '' },
    { id: '2', name: 'Branch 2', address: '', phone: '' },
    { id: '3', name: 'Branch 3', address: '', phone: '' },
  ],
  categories: ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Marketing', 'Travel', 'Maintenance', 'Other'],
  paymentMethods: ['Cash', 'Card', 'Bank Transfer', 'UPI', 'Cheque'],
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      expenses: [] as Expense[],
      settings: defaultSettings,
      addExpense: (expense: Expense) =>
        set((s) => ({ expenses: [expense, ...s.expenses] })),
      updateExpense: (id: string, expense: Partial<Expense>) =>
        set((s) => ({
          expenses: s.expenses.map((e) =>
            e.id === id ? { ...e, ...expense } : e
          ),
        })),
      deleteExpense: (id: string) =>
        set((s) => ({ expenses: s.expenses.filter((e) => e.id !== id) })),
      updateSettings: (settings: Partial<Settings>) =>
        set((s) => ({ settings: { ...s.settings, ...settings } })),
    }),
    { name: 'expense-manager-store' }
  )
);