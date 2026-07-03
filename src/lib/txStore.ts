import { create } from "zustand";

export type TxType = "swap" | "supply" | "withdraw" | "borrow" | "repay";
export type TxStatus = "pending" | "success" | "failed";

export interface TxRecord {
  id: string;
  type: TxType;
  amount: string;
  token: string;
  status: TxStatus;
  txHash?: string;
  timestamp: number;
}

interface TxStore {
  transactions: TxRecord[];
  addTransaction: (tx: Omit<TxRecord, "id" | "timestamp">) => void;
  updateTransaction: (id: string, updates: Partial<TxRecord>) => void;
  clearTransactions: () => void;
}

export const useTxStore = create<TxStore>((set) => ({
  transactions: [],
  addTransaction: (tx) =>
    set((state) => ({
      transactions: [
        {
          ...tx,
          id: Math.random().toString(36).slice(2),
          timestamp: Date.now(),
        },
        ...state.transactions,
      ].slice(0, 5),
    })),
  updateTransaction: (id, updates) =>
    set((state) => ({
      transactions: state.transactions.map((tx) =>
        tx.id === id ? { ...tx, ...updates } : tx
      ),
    })),
  clearTransactions: () => set({ transactions: [] }),
}));
