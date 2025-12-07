"use client";

import { Product, StockEntry, Sale, StockLevel, Customer } from "@/types";

const PRODUCTS_KEY = "zag_products";
const STOCK_KEY = "zag_stock";
const SALES_KEY = "zag_sales";
const STOCK_LEVELS_KEY = "zag_stock_levels";
const CUSTOMERS_KEY = "zag_customers";

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substring(2, 15);

// Products
export const getProducts = (): Product[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(PRODUCTS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProduct = (product: Omit<Product, "id" | "createdAt" | "updatedAt">): Product => {
  const products = getProducts();
  const newProduct: Product = {
    ...product,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  products.push(newProduct);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  
  // Initialize stock level for new product
  const stockLevels = getStockLevels();
  stockLevels.push({
    productId: newProduct.id,
    productName: newProduct.name,
    quantity: 0,
  });
  localStorage.setItem(STOCK_LEVELS_KEY, JSON.stringify(stockLevels));
  
  return newProduct;
};

export const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index === -1) return null;
  
  products[index] = {
    ...products[index],
    ...updates,
    updatedAt: new Date(),
  };
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  
  // Update product name in stock levels if changed
  if (updates.name) {
    const stockLevels = getStockLevels();
    const levelIndex = stockLevels.findIndex(s => s.productId === id);
    if (levelIndex !== -1) {
      stockLevels[levelIndex].productName = updates.name;
      localStorage.setItem(STOCK_LEVELS_KEY, JSON.stringify(stockLevels));
    }
  }
  
  return products[index];
};

export const deleteProduct = (id: string): boolean => {
  const products = getProducts();
  const filtered = products.filter(p => p.id !== id);
  if (filtered.length === products.length) return false;
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
  
  // Remove stock level
  const stockLevels = getStockLevels();
  const filteredLevels = stockLevels.filter(s => s.productId !== id);
  localStorage.setItem(STOCK_LEVELS_KEY, JSON.stringify(filteredLevels));
  
  return true;
};

// Stock Levels
export const getStockLevels = (): StockLevel[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STOCK_LEVELS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getStockLevel = (productId: string): number => {
  const levels = getStockLevels();
  const level = levels.find(l => l.productId === productId);
  return level?.quantity ?? 0;
};

// Stock Entries (History)
export const getStockEntries = (): StockEntry[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STOCK_KEY);
  return data ? JSON.parse(data) : [];
};

export const addStockEntry = (
  productId: string,
  type: 'add' | 'adjust' | 'sale',
  quantity: number,
  notes?: string
): StockEntry => {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");
  
  const stockLevels = getStockLevels();
  const levelIndex = stockLevels.findIndex(l => l.productId === productId);
  const previousQuantity = levelIndex !== -1 ? stockLevels[levelIndex].quantity : 0;
  
  let newQuantity: number;
  if (type === 'add') {
    newQuantity = previousQuantity + Math.abs(quantity);
  } else if (type === 'sale') {
    newQuantity = Math.max(0, previousQuantity - Math.abs(quantity));
  } else {
    newQuantity = quantity; // adjust sets to exact value
  }
  
  // Update stock level
  if (levelIndex !== -1) {
    stockLevels[levelIndex].quantity = newQuantity;
  } else {
    stockLevels.push({
      productId,
      productName: product.name,
      quantity: newQuantity,
    });
  }
  localStorage.setItem(STOCK_LEVELS_KEY, JSON.stringify(stockLevels));
  
  // Add entry to history
  const entries = getStockEntries();
  const entry: StockEntry = {
    id: generateId(),
    productId,
    productName: product.name,
    type,
    quantity: type === 'adjust' ? newQuantity : Math.abs(quantity),
    previousQuantity,
    newQuantity,
    notes,
    createdAt: new Date(),
  };
  entries.unshift(entry);
  localStorage.setItem(STOCK_KEY, JSON.stringify(entries));
  
  return entry;
};

// Sales
export const getSales = (): Sale[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(SALES_KEY);
  return data ? JSON.parse(data) : [];
};

export const recordSale = (
  productId: string,
  quantity: number,
  unitPrice?: number,
  customerId?: string
): Sale => {
  const products = getProducts();
  const product = products.find(p => p.id === productId);
  if (!product) throw new Error("Product not found");
  
  const currentStock = getStockLevel(productId);
  if (currentStock < quantity) throw new Error("Insufficient stock");
  
  const price = unitPrice ?? product.sellingPrice;
  const totalPrice = price * quantity;
  const profit = (price - product.purchasePrice) * quantity;
  
  // Get customer info if provided
  let customerName: string | undefined;
  if (customerId) {
    const customer = getCustomer(customerId);
    if (customer) {
      customerName = `${customer.firstName} ${customer.lastName}`;
    }
  }
  
  // Record sale
  const sales = getSales();
  const sale: Sale = {
    id: generateId(),
    productId,
    productName: product.name,
    customerId,
    customerName,
    quantity,
    unitPrice: price,
    totalPrice,
    profit,
    createdAt: new Date(),
  };
  sales.unshift(sale);
  localStorage.setItem(SALES_KEY, JSON.stringify(sales));
  
  // Update stock
  addStockEntry(productId, 'sale', quantity, `Sale: ${quantity} units`);
  
  return sale;
};

// Customers
export const getCustomers = (): Customer[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(CUSTOMERS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getCustomer = (id: string): Customer | null => {
  const customers = getCustomers();
  return customers.find(c => c.id === id) || null;
};

export const saveCustomer = (customer: Omit<Customer, "id" | "createdAt" | "updatedAt">): Customer => {
  const customers = getCustomers();
  
  // Check for unique username
  if (customers.some(c => c.username.toLowerCase() === customer.username.toLowerCase())) {
    throw new Error("Username already exists");
  }
  
  // Check for unique email if provided
  if (customer.email && customers.some(c => c.email?.toLowerCase() === customer.email?.toLowerCase())) {
    throw new Error("Email already exists");
  }
  
  const newCustomer: Customer = {
    ...customer,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  customers.push(newCustomer);
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  
  return newCustomer;
};

export const updateCustomer = (id: string, updates: Partial<Customer>): Customer | null => {
  const customers = getCustomers();
  const index = customers.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  // Check for unique username (excluding current customer)
  if (updates.username && customers.some(c => c.id !== id && c.username.toLowerCase() === updates.username?.toLowerCase())) {
    throw new Error("Username already exists");
  }
  
  // Check for unique email (excluding current customer)
  if (updates.email && customers.some(c => c.id !== id && c.email?.toLowerCase() === updates.email?.toLowerCase())) {
    throw new Error("Email already exists");
  }
  
  customers[index] = {
    ...customers[index],
    ...updates,
    updatedAt: new Date(),
  };
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  
  return customers[index];
};

export const deleteCustomer = (id: string): boolean => {
  const customers = getCustomers();
  const filtered = customers.filter(c => c.id !== id);
  if (filtered.length === customers.length) return false;
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(filtered));
  return true;
};

export const generateUsernameSuggestion = (firstName?: string, lastName?: string): string => {
  const customers = getCustomers();
  const existingUsernames = new Set(customers.map(c => c.username.toLowerCase()));
  
  // If we have first and last name, use them to generate username
  if (firstName && lastName) {
    const first = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const last = lastName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
    const baseUsername = `${first}${last}`;
    
    if (baseUsername && !existingUsernames.has(baseUsername)) {
      return baseUsername;
    }
    
    let counter = 1;
    let username = `${baseUsername}${counter}`;
    while (existingUsernames.has(username.toLowerCase()) && counter < 1000) {
      counter++;
      username = `${baseUsername}${counter}`;
    }
    return username;
  }
  
  // If we only have first name
  if (firstName) {
    const cleanBase = firstName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 15);
    if (cleanBase && !existingUsernames.has(cleanBase)) {
      return cleanBase;
    }
    let counter = 1;
    let username = `${cleanBase}${counter}`;
    while (existingUsernames.has(username.toLowerCase()) && counter < 1000) {
      counter++;
      username = `${cleanBase}${counter}`;
    }
    return username;
  }
  
  // Generate random username
  const randomNum = Math.floor(Math.random() * 10000);
  let username = `customer${randomNum}`;
  let counter = 1;
  while (existingUsernames.has(username.toLowerCase())) {
    username = `customer${randomNum}${counter}`;
    counter++;
  }
  return username;
};

// Dashboard stats
export const getDashboardStats = () => {
  const products = getProducts();
  const stockLevels = getStockLevels();
  const sales = getSales();
  
  const totalProducts = products.length;
  const totalStock = stockLevels.reduce((sum, l) => sum + l.quantity, 0);
  const lowStockCount = stockLevels.filter(l => l.quantity < 10).length;
  
  const totalRevenue = sales.reduce((sum, s) => sum + s.totalPrice, 0);
  const totalProfit = sales.reduce((sum, s) => sum + s.profit, 0);
  const totalSales = sales.length;
  
  // Recent sales (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const recentSales = sales.filter(s => new Date(s.createdAt) > weekAgo);
  const weekRevenue = recentSales.reduce((sum, s) => sum + s.totalPrice, 0);
  
  return {
    totalProducts,
    totalStock,
    lowStockCount,
    totalRevenue,
    totalProfit,
    totalSales,
    weekRevenue,
  };
};

