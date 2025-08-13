import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PharmacyItem {
  id: string;
  name: string;
  category: 'tablets' | 'syrups' | 'ointments' | 'drugs' | 'syringes' | 'glucose-water' | 'other';
  manufactureDate: string;
  expiryDate: string;
  price: number;
  quantity: number;
  currentStock: number;
  stockStatus: 'in-stock' | 'out-of-stock' | 'low-stock';
  description?: string;
  manufacturer?: string;
  batchNumber?: string;
}

export interface InventoryState {
  items: PharmacyItem[];
  searchTerm: string;
  selectedCategory: string;
  sortBy: 'name' | 'expiryDate' | 'stockStatus' | 'price';
  sortOrder: 'asc' | 'desc';
}

// Dummy data for inventory items
const dummyItems: PharmacyItem[] = [
  {
    id: 'item-1',
    name: 'Paracetamol 500mg',
    category: 'tablets',
    manufactureDate: '2024-01-15',
    expiryDate: '2026-01-15',
    price: 0.25,
    quantity: 1000,
    currentStock: 800,
    stockStatus: 'in-stock',
    description: 'Pain relief and fever reducer',
    manufacturer: 'MedCorp',
    batchNumber: 'PCM2024-001'
  },
  {
    id: 'item-2',
    name: 'Cough Syrup',
    category: 'syrups',
    manufactureDate: '2024-02-10',
    expiryDate: '2025-02-10',
    price: 8.99,
    quantity: 100,
    currentStock: 45,
    stockStatus: 'in-stock',
    description: 'Relief for dry and chesty coughs',
    manufacturer: 'PharmaDist',
    batchNumber: 'CS2024-045'
  },
  {
    id: 'item-3',
    name: 'Antiseptic Cream',
    category: 'ointments',
    manufactureDate: '2024-03-05',
    expiryDate: '2025-12-05',
    price: 4.50,
    quantity: 200,
    currentStock: 85,
    stockStatus: 'in-stock',
    description: 'Prevents infection in minor cuts and wounds',
    manufacturer: 'HealthCare Plus',
    batchNumber: 'AC2024-078'
  },
  {
    id: 'item-4',
    name: 'Insulin Pen',
    category: 'drugs',
    manufactureDate: '2024-01-20',
    expiryDate: '2025-01-20',
    price: 25.00,
    quantity: 50,
    currentStock: 12,
    stockStatus: 'low-stock',
    description: 'Fast-acting insulin for diabetes management',
    manufacturer: 'Diabetes Care Ltd',
    batchNumber: 'INS2024-012'
  },
  {
    id: 'item-5',
    name: 'Disposable Syringes',
    category: 'syringes',
    manufactureDate: '2024-04-01',
    expiryDate: '2027-04-01',
    price: 0.15,
    quantity: 5000,
    currentStock: 2800,
    stockStatus: 'in-stock',
    description: '1ml disposable syringes with safety lock',
    manufacturer: 'MedSupply Co',
    batchNumber: 'SYR2024-234'
  },
  {
    id: 'item-6',
    name: 'Glucose Solution 5%',
    category: 'glucose-water',
    manufactureDate: '2024-02-15',
    expiryDate: '2025-08-15',
    price: 3.20,
    quantity: 100,
    currentStock: 25,
    stockStatus: 'low-stock',
    description: 'IV glucose solution for hypoglycemia',
    manufacturer: 'IV Solutions Ltd',
    batchNumber: 'GLU2024-089'
  },
  {
    id: 'item-7',
    name: 'Aspirin 100mg',
    category: 'tablets',
    manufactureDate: '2024-01-10',
    expiryDate: '2024-12-10',
    price: 0.18,
    quantity: 500,
    currentStock: 0,
    stockStatus: 'out-of-stock',
    description: 'Low-dose aspirin for cardiovascular protection',
    manufacturer: 'CardioMed',
    batchNumber: 'ASP2024-156'
  },
  {
    id: 'item-8',
    name: 'Vitamin D3 Tablets',
    category: 'tablets',
    manufactureDate: '2024-03-01',
    expiryDate: '2026-03-01',
    price: 12.99,
    quantity: 120,
    currentStock: 8,
    stockStatus: 'low-stock',
    description: 'Vitamin D3 1000 IU supplements',
    manufacturer: 'VitaHealth',
    batchNumber: 'VD32024-045'
  },
  {
    id: 'item-9',
    name: 'Antibacterial Gel',
    category: 'ointments',
    manufactureDate: '2024-02-20',
    expiryDate: '2024-11-30',
    price: 6.75,
    quantity: 80,
    currentStock: 15,
    stockStatus: 'low-stock',
    description: 'Hand sanitizing gel with 70% alcohol',
    manufacturer: 'CleanHands Inc',
    batchNumber: 'ABG2024-123'
  },
  {
    id: 'item-10',
    name: 'Blood Pressure Monitor',
    category: 'other',
    manufactureDate: '2024-01-05',
    expiryDate: '2029-01-05',
    price: 89.99,
    quantity: 20,
    currentStock: 5,
    stockStatus: 'low-stock',
    description: 'Digital blood pressure monitor with memory',
    manufacturer: 'HealthTech Pro',
    batchNumber: 'BPM2024-007'
  }
];

const initialState: InventoryState = {
  items: dummyItems,
  searchTerm: '',
  selectedCategory: 'all',
  sortBy: 'name',
  sortOrder: 'asc',
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<PharmacyItem>) => {
      state.items.push(action.payload);
    },
    updateItem: (state, action: PayloadAction<PharmacyItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateStock: (state, action: PayloadAction<{ id: string; quantity: number; operation: 'add' | 'subtract' }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        if (action.payload.operation === 'add') {
          item.currentStock += action.payload.quantity;
        } else {
          item.currentStock = Math.max(0, item.currentStock - action.payload.quantity);
        }
        
        // Update stock status
        if (item.currentStock === 0) {
          item.stockStatus = 'out-of-stock';
        } else if (item.currentStock <= 10) {
          item.stockStatus = 'low-stock';
        } else {
          item.stockStatus = 'in-stock';
        }
      }
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSortBy: (state, action: PayloadAction<'name' | 'expiryDate' | 'stockStatus' | 'price'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
  },
});

export const {
  addItem,
  updateItem,
  deleteItem,
  updateStock,
  setSearchTerm,
  setSelectedCategory,
  setSortBy,
  setSortOrder,
} = inventorySlice.actions;

export default inventorySlice.reducer;