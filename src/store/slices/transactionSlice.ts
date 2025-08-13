import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'purchase' | 'sale';
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  date: string;
  customerName?: string;
  supplierName?: string;
  notes?: string;
  batchNumber?: string;
  paymentMethod?: string;
}

export interface TransactionState {
  transactions: Transaction[];
  totalRevenue: number;
  totalCost: number;
}

// Dummy data for transactions
const dummyTransactions: Transaction[] = [
  // Sales from last week
  {
    id: 'sale-1',
    itemId: 'item-1',
    itemName: 'Paracetamol 500mg',
    type: 'sale',
    quantity: 50,
    pricePerUnit: 0.25,
    totalAmount: 12.50,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: 'John Smith',
    paymentMethod: 'cash'
  },
  {
    id: 'sale-2',
    itemId: 'item-2',
    itemName: 'Cough Syrup',
    type: 'sale',
    quantity: 3,
    pricePerUnit: 8.99,
    totalAmount: 26.97,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: 'Mary Johnson',
    paymentMethod: 'card'
  },
  {
    id: 'sale-3',
    itemId: 'item-3',
    itemName: 'Antiseptic Cream',
    type: 'sale',
    quantity: 2,
    pricePerUnit: 4.50,
    totalAmount: 9.00,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    customerName: 'Robert Brown',
    paymentMethod: 'cash'
  },
  // Purchases from last month
  {
    id: 'purchase-1',
    itemId: 'item-1',
    itemName: 'Paracetamol 500mg',
    type: 'purchase',
    quantity: 1000,
    pricePerUnit: 0.12,
    totalAmount: 120.00,
    date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    supplierName: 'MedCorp Supplies',
    batchNumber: 'PCM2024-001',
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'purchase-2',
    itemId: 'item-2',
    itemName: 'Cough Syrup',
    type: 'purchase',
    quantity: 100,
    pricePerUnit: 4.20,
    totalAmount: 420.00,
    date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    supplierName: 'PharmaDist Inc.',
    batchNumber: 'CS2024-045',
    paymentMethod: 'bank_transfer'
  },
  {
    id: 'purchase-3',
    itemId: 'item-4',
    itemName: 'Insulin Pen',
    type: 'purchase',
    quantity: 50,
    pricePerUnit: 15.00,
    totalAmount: 750.00,
    date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    supplierName: 'Diabetes Care Ltd',
    batchNumber: 'INS2024-012',
    paymentMethod: 'bank_transfer'
  }
];

const initialState: TransactionState = {
  transactions: dummyTransactions,
  totalRevenue: dummyTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalAmount, 0),
  totalCost: dummyTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0),
};

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.push(action.payload);
      
      if (action.payload.type === 'sale') {
        state.totalRevenue += action.payload.totalAmount;
      } else {
        state.totalCost += action.payload.totalAmount;
      }
    },
    deleteTransaction: (state, action: PayloadAction<string>) => {
      const transaction = state.transactions.find(t => t.id === action.payload);
      if (transaction) {
        if (transaction.type === 'sale') {
          state.totalRevenue -= transaction.totalAmount;
        } else {
          state.totalCost -= transaction.totalAmount;
        }
        state.transactions = state.transactions.filter(t => t.id !== action.payload);
      }
    },
    clearTransactions: (state) => {
      state.transactions = [];
      state.totalRevenue = 0;
      state.totalCost = 0;
    },
  },
});

export const { addTransaction, deleteTransaction, clearTransactions } = transactionSlice.actions;

export default transactionSlice.reducer;