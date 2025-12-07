export interface Product {
  id: string;
  name: string;
  sku: string;
  purchasePrice: number;
  sellingPrice: number;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockEntry {
  id: string;
  productId: string;
  productName: string;
  type: 'add' | 'adjust' | 'sale';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  notes?: string;
  createdAt: Date;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  profit: number;
  createdAt: Date;
}

export interface StockLevel {
  productId: string;
  productName: string;
  quantity: number;
}

