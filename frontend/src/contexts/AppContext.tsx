import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import apiClient from '../lib/api';
import { 
  APP_MODULES, 
  ModuleConfig, 
  UserRole, 
  NavigationItem, 
  QuickAction,
  getBottomNavigationForRole,
  getQuickActionsForRole,
  getAvailableModulesForUser,
  hasModuleAccess,
  findRoleConfig,
  normalizePermissionList,
  normalizePermissionKey
} from '../utils/appConfig';

export interface TaxRule {
  id: string;
  name: string; // GST, VAT, SGST, CGST, Cess, etc.
  rate: number; // percentage
  isActive: boolean;
  applicableCategories: string[]; // ['food', 'beverage', 'bar', 'all']
  description?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  available: boolean;
  description?: string;
  isVeg: boolean;
  spiceLevel: 'mild' | 'medium' | 'hot';
  cookingTime: number; // in minutes
  rating?: number;
  isPopular: boolean;
  allergens: string[];
  taxCategory: string; // 'food', 'beverage', 'bar', 'none'
  applicableTaxes?: string[]; // array of tax rule IDs
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface CreateMenuItemPayload {
  name: string;
  price: number;
  category: string;
  description?: string;
  available?: boolean;
  isVeg?: boolean;
  spiceLevel?: MenuItem['spiceLevel'];
  cookingTime?: number;
  isPopular?: boolean;
  allergens?: string[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export type UpdateMenuItemPayload = Partial<CreateMenuItemPayload>;

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber?: string;
  rating: number;
  status: 'active' | 'inactive';
  creditDays: number;
  totalOrders: number;
  totalAmount: number;
  lastOrderDate: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  totalOrders?: number;
  totalSpent?: number;
  loyaltyPoints?: number;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  lastVisit?: string;
  averageRating?: number;
  preferredCuisine?: string;
  tags?: string[];
  status?: 'active' | 'inactive';
  referredBy?: string; // Customer ID who referred this customer
  referralCode?: string; // Unique referral code for this customer
  referralCount?: number; // Number of customers referred by this customer
  joinDate?: string; // Date when customer joined the loyalty program
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  costPerUnit: number;
  supplierId: string;
  expiryDate?: string;
  lastPurchase: string;
  usedThisMonth: number;
}

export type InventoryWastageReason = 'expired' | 'damaged' | 'overcooked' | 'customer-return' | 'other';

export interface InventoryWastageRecord {
  id: string;
  inventoryItemId: string;
  itemName: string;
  unit: string;
  quantity: number;
  reason: InventoryWastageReason;
  notes?: string;
  recordedAt: string;
  costPerUnit: number;
  valueLost: number;
}

export interface CreateInventoryWastageRecordPayload {
  inventoryItemId: string;
  quantity: number;
  reason: InventoryWastageReason;
  notes?: string;
  recordedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'menu' | 'expense' | 'inventory' | 'supplier';
  description?: string;
  color?: string;
  itemCount?: number;
  createdAt?: string;
  isActive: boolean;
}

export interface CreateCategoryPayload {
  name: string;
  type: Category['type'];
  description?: string;
  color?: string;
  isActive?: boolean;
}

export type UpdateCategoryPayload = Partial<CreateCategoryPayload>;

export interface Role {
  id: string;
  name: string;
  permissions: string[];
  dashboardModules: string[];
  description?: string;
  staffCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRolePayload {
  name: string;
  permissions?: string[];
  dashboardModules?: string[];
  description?: string;
}

export type UpdateRolePayload = Partial<CreateRolePayload>;

export type TableStatus = 'free' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance' | 'blocked';

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: TableStatus;
  name?: string | null;
  area?: string | null;
  waiter?: string;
  customer?: string;
  orderAmount?: number;
  timeOccupied?: string;
  guests?: number;
  reservationTime?: string;
  reservationName?: string;
  reservationPhone?: string;
  lastOrderId?: string;
  location?: string | null;
  notes?: string | null;
  currentOrderId?: string | null;
  currentBillId?: string | null;
  lastOrderAt?: string | null;
  cleaningAssignedTo?: string;
  cleaningEstimatedTime?: number;
  cleaningStartTime?: string;
  cleaningNotes?: string;
}

export interface TableStats {
  total: number;
  occupied: number;
  free: number;
  reserved: number;
  cleaning: number;
  revenue: number;
}

export interface CreateTablePayload {
  number: number;
  capacity: number;
  status?: TableStatus;
  name?: string | null;
  area?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface UpdateTablePayload {
  number?: number;
  capacity?: number;
  status?: TableStatus;
  name?: string | null;
  area?: string | null;
  location?: string | null;
  notes?: string | null;
  guests?: number;
  currentOrderId?: string | null;
  currentBillId?: string | null;
  lastOrderAt?: string | null;
}

export interface LoyaltyMember {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  totalVisits: number;
  joinDate: string;
  lastVisit: string;
  status: 'active' | 'inactive';
}

export interface LoyaltyReward {
  id: string;
  title: string;
  description: string;
  pointsRequired: number;
  type: 'discount' | 'free_item' | 'cashback';
  value: number;
  validUntil?: string;
  maxRedemptions?: number;
  currentRedemptions: number;
  isActive: boolean;
}

export interface LoyaltyRule {
  id: string;
  name: string;
  type: 'earn' | 'bonus';
  condition: string;
  pointsPerRupee?: number;
  bonusPoints?: number;
  minOrderValue?: number;
  isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  role: string;
  permissions: string[];
  dashboardModules: string[];
  avatar?: string;
  shift?: string;
  email?: string;
  phone?: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  pin?: string;
  isActive?: boolean;
  joinDate?: string;
  salary?: number;
  currentShift?: string;
  permissions?: string[];
  dashboardModules?: string[];
  performance?: {
    ordersHandled: number;
    avgOrderTime: number;
    customerRating: number;
  };
  salaryDetails?: {
    baseSalary: number;
    allowances: number;
    deductions: number;
    overtime: number;
    totalSalary: number;
  };
  paymentHistory?: PaymentRecord[];
}

export interface PaymentRecord {
  id: string;
  month: string;
  year: number;
  amount: number;
  paymentDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Completed';
  bonus?: number;
  deductions?: number;
  type: 'Full Salary' | 'Partial Payment' | 'Advance' | 'Bonus' | 'Overtime' | string;
  description?: string;
  paidBy?: string;
}

export interface Shift {
  id: string;
  staffId: string;
  startTime: string;
  endTime?: string;
  openingCash: number;
  closingCash?: number;
  totalSales: number;
  tips: number;
  date: string;
  status: 'Active' | 'Completed' | 'Scheduled';
  shiftType: 'Morning' | 'Evening' | 'Night';
}

export interface SalaryPayment {
  id: string;
  staffId: string;
  amount: number;
  paymentDate: string;
  paymentType: 'Full Salary' | 'Partial Payment' | 'Advance' | 'Bonus' | 'Overtime';
  description: string;
  paidBy: string;
  status: 'Completed' | 'Pending';
  month?: string;
  year?: number;
  staffName?: string;
  staffRole?: string;
}

export interface CreateStaffPayload {
  name: string;
  phone: string;
  email?: string;
  pin: string;
  roleId?: string;
  roleName?: string;
  salary?: number;
  permissions?: string[];
  dashboardModules?: string[];
  joinDate?: string;
  password?: string;
  isActive?: boolean;
}

export interface UpdateStaffPayload extends Partial<CreateStaffPayload> {
  currentShift?: string | null;
  performance?: Staff['performance'];
  salaryDetails?: Staff['salaryDetails'];
  paymentHistory?: PaymentRecord[];
}

export interface CreateShiftPayload {
  staffId: string;
  shiftType: Shift['shiftType'];
  openingCash: number;
  startTime: string;
  endTime?: string;
  totalSales?: number;
  tips?: number;
  closingCash?: number;
  status?: Shift['status'];
  date?: string;
}

export interface UpdateShiftPayload extends Partial<CreateShiftPayload> {
  status?: Shift['status'];
}

export interface CreateSalaryPaymentPayload {
  staffId: string;
  amount: number;
  paymentType: SalaryPayment['paymentType'];
  description?: string;
  paidBy?: string;
  status?: SalaryPayment['status'];
  paymentDate?: string;
  month?: string;
  year?: number;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  moduleId?: string;
  actionUrl?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
  category: string;
}

export interface Order {
  id: string;
  tableNumber?: number;
  orderSource: 'dine-in' | 'zomato' | 'swiggy' | 'own-app' | 'website' | 'takeaway' | 'qr-code';
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  orderNumber?: string;
  items: OrderItem[];
  status: 'new' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  orderTime: string;
  orderDate: string;
  estimatedTime: number;
  actualCookingTime?: number;
  priority: 'normal' | 'high' | 'urgent';
  waiter?: string;
  specialInstructions?: string;
  deliveryType?: 'dine-in' | 'delivery' | 'pickup' | 'takeaway';
  deliveryAddress?: string;
  completedAt?: string;
  preparedBy?: string;
  totalAmount: number;
  subtotal: number;
  taxes: Array<{name: string, rate: number, amount: number}>;
  paymentMethod?: 'cash' | 'card' | 'upi' | 'split';
  feedback?: string;
  rating?: number;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  menuItemName: string;
  ingredients: Array<{
    inventoryItemId: string;
    inventoryItemName: string;
    quantity: number;
    unit: string;
  }>;
  yield: number; // Number of servings this recipe makes
  cost: number; // Calculated cost per serving
  preparationTime: number; // in minutes
  instructions?: string[];
}

export interface ExtendedCustomer extends Customer {
  whatsappOptIn: boolean;
  birthDate?: string;
  anniversary?: string;
  preferences?: string[];
  orderHistory?: Array<{
    id: string;
    date: string;
    items: string[];
    amount: number;
    table?: number;
  }>;
  totalSpent?: number;
  visitCount?: number;
  averageOrderValue?: number;
  lastVisit?: string;
  loyaltyPoints?: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  vendor: string;
  description?: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'credit_card' | 'upi' | 'cheque';
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  receiptUrl?: string;
  receiptNumber?: string;
  recurring?: boolean;
  recurringPeriod?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  approvedBy?: string;
  supplierId?: string;
  tags?: string[];
  taxAmount?: number;
  netAmount: number;
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    itemName: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
  }>;
  notes?: string;
  deliveredDate?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  spent: number;
  icon: string;
  color: string;
  description?: string;
  isActive: boolean;
}

export interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  tableNumber?: number;
  status: 'confirmed' | 'pending' | 'seated' | 'completed' | 'cancelled' | 'no-show';
  specialRequests?: string;
  occasion?: string;
  createdAt: string;
  source: 'phone' | 'online' | 'walk-in' | 'app';
  prepayment?: number;
  priority: 'normal' | 'high' | 'vip';
  reminderSent?: boolean;
  arrivalStatus?: 'early' | 'on-time' | 'late' | 'no-show';
  diningDuration?: number; // in minutes
  orderTotal?: number;
  rating?: number;
  feedback?: string;
}

export interface CreateReservationPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerId?: string;
  date: string;
  time: string;
  partySize: number;
  tableId?: string;
  tableNumber?: number;
  status?: Reservation['status'];
  specialRequests?: string;
  occasion?: string;
  source?: Reservation['source'];
  priority?: Reservation['priority'];
}

export type UpdateReservationPayload = Partial<CreateReservationPayload>;

export interface AppSettings {
  restaurantName: string;
  country: string;
  currency: string;
  currencySymbol: string;
  whatsappApiKey: string;
  whatsappPhoneNumber: string;
  taxRules: TaxRule[];
  defaultTaxCategory: string;
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
  autoBackup: boolean;
  multiLocation: boolean;
  loyaltyEnabled: boolean;
  loyaltyPointsPerCurrency: number; // Points earned per 1 unit of currency spent
  // Business Information
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  taxNumber: string;
  fssaiNumber: string;
}

interface AppContextType {
  // App Configuration & Modules
  appModules: ModuleConfig[];
  availableModules: ModuleConfig[];
  bottomNavigation: NavigationItem[];
  quickActions: QuickAction[];
  
  // User Management
  currentUser: User | null;
  userRole: UserRole | null;
  
  // App State
  currentModule: string;
  selectedTable: string | null;
  currentOrder: any;
  notifications: AppNotification[];
  isDataLoading: boolean;
  dataError: string | null;
  refreshAppData: () => Promise<void>;
  
  // Settings & Data
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  menuItems: MenuItem[];
  updateMenuItems: (items: MenuItem[]) => void;
  addMenuItem: (payload: CreateMenuItemPayload) => Promise<MenuItem>;
  updateMenuItem: (id: string, updates: UpdateMenuItemPayload) => Promise<MenuItem>;
  deleteMenuItem: (id: string) => Promise<void>;
  orders: Order[];
  updateOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrdersByTable: (tableNumber: number) => Order[];
  getOrdersByStatus: (status: Order['status']) => Order[];
  getOrderById: (id: string) => Order | undefined;
  suppliers: Supplier[];
  updateSuppliers: (suppliers: Supplier[]) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  customers: Customer[];
  updateCustomers: (customers: Customer[]) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  inventoryItems: InventoryItem[];
  updateInventoryItems: (items: InventoryItem[]) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  inventoryWastageRecords: InventoryWastageRecord[];
  recordInventoryWastage: (payload: CreateInventoryWastageRecordPayload) => InventoryWastageRecord;
  deleteInventoryWastageRecord: (id: string) => void;
  categories: Category[];
  updateCategories: (categories: Category[]) => void;
  addCategory: (payload: CreateCategoryPayload) => Promise<Category>;
  updateCategory: (id: string, updates: UpdateCategoryPayload) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoriesByType: (type: Category['type']) => Category[];
  roles: Role[];
  updateRoles: (roles: Role[]) => void;
  addRole: (payload: CreateRolePayload) => Promise<Role>;
  updateRole: (id: string, updates: UpdateRolePayload) => Promise<Role>;
  deleteRole: (id: string) => Promise<void>;
  addTaxRule: (taxRule: TaxRule) => Promise<TaxRule>;
  updateTaxRule: (id: string, updates: Partial<TaxRule>) => Promise<TaxRule>;
  deleteTaxRule: (id: string) => Promise<void>;
  calculateTaxes: (baseAmount: number, taxCategory: string) => { taxes: Array<{name: string, rate: number, amount: number}>, totalTax: number };
  
  // Loyalty Management
  loyaltyMembers: LoyaltyMember[];
  updateLoyaltyMembers: (members: LoyaltyMember[]) => void;
  addLoyaltyMember: (member: LoyaltyMember) => void;
  updateLoyaltyMember: (id: string, updates: Partial<LoyaltyMember>) => void;
  deleteLoyaltyMember: (id: string) => void;
  loyaltyRewards: LoyaltyReward[];
  updateLoyaltyRewards: (rewards: LoyaltyReward[]) => void;
  addLoyaltyReward: (reward: LoyaltyReward) => void;
  updateLoyaltyReward: (id: string, updates: Partial<LoyaltyReward>) => void;
  deleteLoyaltyReward: (id: string) => void;
  loyaltyRules: LoyaltyRule[];
  updateLoyaltyRules: (rules: LoyaltyRule[]) => void;
  addLoyaltyRule: (rule: LoyaltyRule) => void;
  updateLoyaltyRule: (id: string, updates: Partial<LoyaltyRule>) => void;
  deleteLoyaltyRule: (id: string) => void;
  calculateLoyaltyTier: (totalSpent: number) => 'bronze' | 'silver' | 'gold' | 'platinum';
  awardLoyaltyPoints: (customerId: string, orderAmount: number) => void;
  redeemLoyaltyPoints: (customerId: string, points: number) => boolean;
  handleReferral: (newCustomerId: string, referrerCode: string) => void;
  generateReferralCode: (customerId: string) => string;
  
  // Table Management
  tables: Table[];
  updateTables: (tables: Table[]) => void;
  addTable: (payload: CreateTablePayload) => Promise<Table>;
  updateTable: (id: string, updates: UpdateTablePayload) => Promise<Table>;
  deleteTable: (id: string) => Promise<void>;
  getTableById: (id: string) => Table | undefined;
  getTableByNumber: (number: number) => Table | undefined;
  getAvailableTables: () => Table[];
  getTableStats: () => TableStats;
  
  // New Dynamic Methods
  setCurrentUser: (user: User | null) => void;
  setCurrentModule: (moduleId: string) => void;
  setSelectedTable: (tableId: string | null) => void;
  setCurrentOrder: (order: any) => void;
  hasPermission: (permission: string) => boolean;
  hasModuleAccess: (moduleId: string) => boolean;
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  getModuleByComponent: (componentName: string) => ModuleConfig | undefined;
  
  // Revenue and Analytics Methods
  getTodayRevenue: () => number;
  getRevenueBetweenDates: (startDate: string, endDate: string) => number;
  getRevenueByPaymentMethod: (dateFilter?: string) => { cash: number; digital: number; split: number };
  getRevenueByOrderSource: (dateFilter?: string) => Record<string, number>;
  getOrderStats: (dateFilter?: string) => {
    total: number;
    completed: number;
    pending: number;
    cancelled: number;
    totalRevenue: number;
    avgOrderValue: number;
  };
  
  // Shared date filtering utilities for consistency
  getOrdersByDateRange: (startDate: string, endDate: string) => Order[];
  getOrdersByDateFilter: (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all') => Order[];
  getOrderStatsByDateFilter: (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    totalOrders: number;
    totalRevenue: number;
    avgOrderValue: number;
    cashAmount: number;
    digitalAmount: number;
    completed: number;
    pending: number;
    cancelled: number;
    orders: Order[];
  };
  
  // Recipes Management
  recipes: Recipe[];
  updateRecipes: (recipes: Recipe[]) => void;
  addRecipe: (recipe: Recipe) => void;
  updateRecipe: (id: string, updates: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
  getRecipesByMenuItem: (menuItemId: string) => Recipe[];
  calculateRecipeCost: (recipeId: string) => number;
  
  // Extended Customers Management
  extendedCustomers: ExtendedCustomer[];
  updateExtendedCustomers: (customers: ExtendedCustomer[]) => void;
  addExtendedCustomer: (customer: ExtendedCustomer) => void;
  updateExtendedCustomer: (id: string, updates: Partial<ExtendedCustomer>) => void;
  deleteExtendedCustomer: (id: string) => void;
  getCustomerOrderHistory: (customerId: string) => ExtendedCustomer['orderHistory'];
  updateCustomerStats: (customerId: string, newOrder: { amount: number; date: string; items: string[] }) => void;
  
  // Expenses Management
  expenses: Expense[];
  updateExpenses: (expenses: Expense[]) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpensesByCategory: (category: string) => Expense[];
  getExpensesByDateRange: (startDate: string, endDate: string) => Expense[];
  getTotalExpenses: (dateFilter?: string) => number;
  getExpensesBySupplier: (supplierId: string) => Expense[];
  
  // Purchase Orders Management
  purchaseOrders: PurchaseOrder[];
  updatePurchaseOrders: (orders: PurchaseOrder[]) => void;
  addPurchaseOrder: (order: PurchaseOrder) => void;
  updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => void;
  deletePurchaseOrder: (id: string) => void;
  getPurchaseOrdersBySupplier: (supplierId: string) => PurchaseOrder[];
  getPurchaseOrdersByStatus: (status: PurchaseOrder['status']) => PurchaseOrder[];
  
  // Budget Categories Management
  budgetCategories: BudgetCategory[];
  updateBudgetCategories: (categories: BudgetCategory[]) => void;
  addBudgetCategory: (category: BudgetCategory) => void;
  updateBudgetCategory: (id: string, updates: Partial<BudgetCategory>) => void;
  deleteBudgetCategory: (id: string) => void;
  getBudgetCategorySpent: (categoryId: string) => number;
  updateBudgetCategorySpent: (categoryId: string, amount: number) => void;
  
  // Reservations Management
  reservations: Reservation[];
  updateReservations: (reservations: Reservation[]) => void;
  addReservation: (payload: CreateReservationPayload) => Promise<Reservation>;
  updateReservation: (id: string, updates: UpdateReservationPayload) => Promise<Reservation>;
  deleteReservation: (id: string) => Promise<void>;
  getReservationsByDate: (date: string) => Reservation[];
  getReservationsByTable: (tableId: string) => Reservation[];
  getReservationsByStatus: (status: Reservation['status']) => Reservation[];
  
  // Customer synchronization
  syncAllCustomers: () => void;

  // Staff Management
  staff: Staff[];
  addStaff: (staff: CreateStaffPayload) => Promise<Staff>;
  updateStaff: (id: string, updates: UpdateStaffPayload) => Promise<Staff>;
  deleteStaff: (id: string) => Promise<void>;

  // Shift Management
  shifts: Shift[];
  addShift: (shift: CreateShiftPayload) => Promise<Shift>;
  updateShift: (id: string, updates: UpdateShiftPayload) => Promise<Shift>;
  deleteShift: (id: string) => Promise<void>;

  // Salary Management
  salaryPayments: SalaryPayment[];
  addSalaryPayment: (payment: CreateSalaryPaymentPayload) => Promise<SalaryPayment>;
}

// Default tax rules for different countries
const getDefaultTaxRules = (country: string): TaxRule[] => {
  switch (country) {
    case 'India':
      return [
        {
          id: 'cgst',
          name: 'CGST',
          rate: 9,
          isActive: true,
          applicableCategories: ['food', 'beverage'],
          description: 'Central Goods and Services Tax'
        },
        {
          id: 'sgst',
          name: 'SGST',
          rate: 9,
          isActive: true,
          applicableCategories: ['food', 'beverage'],
          description: 'State Goods and Services Tax'
        },
        {
          id: 'bar_cgst',
          name: 'CGST (Bar)',
          rate: 14,
          isActive: true,
          applicableCategories: ['bar'],
          description: 'Central GST for alcoholic beverages'
        },
        {
          id: 'bar_sgst',
          name: 'SGST (Bar)',
          rate: 14,
          isActive: true,
          applicableCategories: ['bar'],
          description: 'State GST for alcoholic beverages'
        }
      ];
    case 'United Kingdom':
    case 'Germany':
    case 'France':
      return [
        {
          id: 'vat',
          name: 'VAT',
          rate: 20,
          isActive: true,
          applicableCategories: ['food', 'beverage', 'bar'],
          description: 'Value Added Tax'
        }
      ];
    case 'United States':
      return [
        {
          id: 'sales_tax',
          name: 'Sales Tax',
          rate: 8.5,
          isActive: true,
          applicableCategories: ['food', 'beverage', 'bar'],
          description: 'State and Local Sales Tax'
        }
      ];
    default:
      return [
        {
          id: 'tax',
          name: 'Tax',
          rate: 10,
          isActive: true,
          applicableCategories: ['food', 'beverage', 'bar'],
          description: 'General Tax'
        }
      ];
  }
};

const defaultSettings: AppSettings = {
  restaurantName: 'Eat With Me Demo',
  country: 'India',
  currency: 'INR',
  currencySymbol: '₹',
  whatsappApiKey: '',
  whatsappPhoneNumber: '',
  taxRules: getDefaultTaxRules('India'),
  defaultTaxCategory: 'food',
  theme: 'light',
  language: 'English',
  notifications: true,
  autoBackup: true,
  multiLocation: false,
  loyaltyEnabled: true,
  loyaltyPointsPerCurrency: 1, // Default: 1 point per 1 unit of currency
  businessAddress: '123 MG Road, Bangalore, Karnataka 560001',
  businessPhone: '+91 80 2345 6789',
  businessEmail: 'info@eatwithme.com',
  taxNumber: '29ABCDE1234F1Z5',
  fssaiNumber: '12345678901234'
};

// Currency mapping based on country
export const countryCurrencyMap: Record<string, { currency: string; symbol: string }> = {
  'India': { currency: 'INR', symbol: '₹' },
  'United States': { currency: 'USD', symbol: '$' },
  'United Kingdom': { currency: 'GBP', symbol: '£' },
  'Canada': { currency: 'CAD', symbol: 'C$' },
  'Australia': { currency: 'AUD', symbol: 'A$' },
  'Germany': { currency: 'EUR', symbol: '€' },
  'France': { currency: 'EUR', symbol: '€' },
  'Japan': { currency: 'JPY', symbol: '¥' },
  'Singapore': { currency: 'SGD', symbol: 'S$' },
  'United Arab Emirates': { currency: 'AED', symbol: 'AED' },
  'South Africa': { currency: 'ZAR', symbol: 'R' },
  'Brazil': { currency: 'BRL', symbol: 'R$' },
  'Mexico': { currency: 'MXN', symbol: '$' },
  'Thailand': { currency: 'THB', symbol: '฿' },
  'Malaysia': { currency: 'MYR', symbol: 'RM' }
};

const defaultSuppliers: Supplier[] = [];

const defaultCustomers: Customer[] = [];

const defaultInventoryItems: InventoryItem[] = [];
const defaultInventoryWastageRecords: InventoryWastageRecord[] = [];

const defaultCategories: Category[] = [
  // Menu Categories
  { id: '1', name: 'Starters', type: 'menu', isActive: true },
  { id: '2', name: 'Main Course', type: 'menu', isActive: true },
  { id: '3', name: 'Beverages', type: 'menu', isActive: true },
  { id: '4', name: 'Desserts', type: 'menu', isActive: true },
  { id: '5', name: 'Bar', type: 'menu', isActive: true },
  
  // Expense Categories
  { id: '6', name: 'Raw Materials', type: 'expense', isActive: true },
  { id: '7', name: 'Utilities', type: 'expense', isActive: true },
  { id: '8', name: 'Staff', type: 'expense', isActive: true },
  { id: '9', name: 'Maintenance', type: 'expense', isActive: true },
  { id: '10', name: 'Transportation', type: 'expense', isActive: true },
  
  // Inventory Categories
  { id: '11', name: 'Vegetables', type: 'inventory', isActive: true },
  { id: '12', name: 'Spices', type: 'inventory', isActive: true },
  { id: '13', name: 'Dairy', type: 'inventory', isActive: true },
  { id: '14', name: 'Meat', type: 'inventory', isActive: true },
  { id: '15', name: 'Grains', type: 'inventory', isActive: true },
  
  // Supplier Categories
  { id: '16', name: 'Food Suppliers', type: 'supplier', isActive: true },
  { id: '17', name: 'Utilities', type: 'supplier', isActive: true },
  { id: '18', name: 'Services', type: 'supplier', isActive: true },
  { id: '19', name: 'Supplies', type: 'supplier', isActive: true }
];

const defaultLoyaltyMembers: LoyaltyMember[] = [
  {
    id: '1',
    customerName: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@email.com',
    points: 1250,
    tier: 'gold',
    totalSpent: 45000,
    totalVisits: 28,
    joinDate: '2023-06-15',
    lastVisit: '2024-03-15',
    status: 'active'
  },
  {
    id: '2',
    customerName: 'Priya Sharma',
    phone: '+91 87654 32109',
    email: 'priya@email.com',
    points: 890,
    tier: 'silver',
    totalSpent: 28000,
    totalVisits: 15,
    joinDate: '2023-08-20',
    lastVisit: '2024-03-14',
    status: 'active'
  },
  {
    id: '3',
    customerName: 'Amit Patel',
    phone: '+91 76543 21098',
    points: 2180,
    tier: 'platinum',
    totalSpent: 78000,
    totalVisits: 45,
    joinDate: '2023-03-10',
    lastVisit: '2024-03-16',
    status: 'active'
  },
  {
    id: '4',
    customerName: 'Sneha Reddy',
    phone: '+91 65432 10987',
    email: 'sneha@email.com',
    points: 340,
    tier: 'bronze',
    totalSpent: 12000,
    totalVisits: 8,
    joinDate: '2024-01-12',
    lastVisit: '2024-03-10',
    status: 'active'
  }
];

const defaultLoyaltyRewards: LoyaltyReward[] = [
  {
    id: '1',
    title: '10% Off Next Order',
    description: '10% discount on your next order (max ₹200)',
    pointsRequired: 500,
    type: 'discount',
    value: 10,
    currentRedemptions: 23,
    maxRedemptions: 100,
    isActive: true
  },
  {
    id: '2',
    title: 'Free Dessert',
    description: 'Complimentary dessert of your choice',
    pointsRequired: 300,
    type: 'free_item',
    value: 150,
    currentRedemptions: 8,
    maxRedemptions: 50,
    isActive: true
  },
  {
    id: '3',
    title: '₹100 Cashback',
    description: '₹100 cashback on orders above ₹1000',
    pointsRequired: 800,
    type: 'cashback',
    value: 100,
    currentRedemptions: 5,
    isActive: true
  }
];

const defaultLoyaltyRules: LoyaltyRule[] = [
  {
    id: '1',
    name: 'Standard Points',
    type: 'earn',
    condition: 'Earn 1 point per ₹10 spent',
    pointsPerRupee: 0.1,
    isActive: true
  },
  {
    id: '2',
    name: 'Weekend Bonus',
    type: 'bonus',
    condition: 'Double points on weekends',
    bonusPoints: 100,
    isActive: true
  },
  {
    id: '3',
    name: 'Large Order Bonus',
    type: 'bonus',
    condition: 'Bonus points for orders above ₹1000',
    bonusPoints: 50,
    minOrderValue: 1000,
    isActive: true
  }
];

const defaultMenuItems: MenuItem[] = [];

const defaultTables: Table[] = [];

// Default recipes data
const defaultRecipes: Recipe[] = [
  {
    id: 'recipe1',
    menuItemId: '1',
    menuItemName: 'Paneer Tikka',
    ingredients: [
      { inventoryItemId: '1', inventoryItemName: 'Paneer', quantity: 0.2, unit: 'kg' },
      { inventoryItemId: '5', inventoryItemName: 'Yogurt', quantity: 0.1, unit: 'kg' },
      { inventoryItemId: '3', inventoryItemName: 'Spices', quantity: 0.05, unit: 'kg' }
    ],
    yield: 2,
    cost: 80,
    preparationTime: 30,
    instructions: ['Marinate paneer in yogurt and spices', 'Grill for 15 minutes', 'Serve hot']
  },
  {
    id: 'recipe2',
    menuItemId: '4',
    menuItemName: 'Butter Chicken',
    ingredients: [
      { inventoryItemId: '2', inventoryItemName: 'Chicken', quantity: 0.3, unit: 'kg' },
      { inventoryItemId: '4', inventoryItemName: 'Tomatoes', quantity: 0.2, unit: 'kg' },
      { inventoryItemId: '5', inventoryItemName: 'Cream', quantity: 0.1, unit: 'liter' }
    ],
    yield: 2,
    cost: 120,
    preparationTime: 45,
    instructions: ['Cook chicken', 'Prepare tomato gravy', 'Add cream and simmer']
  }
];

// Removed first duplicate - keeping second version below


// Removed first duplicate - keeping second version below


// Removed first duplicate - keeping second version below


// Generate sample orders for demonstration
const generateDefaultOrders = (): Order[] => {
  const orderSources: Order['orderSource'][] = ['dine-in', 'zomato', 'swiggy', 'takeaway'];
  const statuses: Order['status'][] = ['new', 'preparing', 'ready', 'completed'];
  const waiters = ['Raj', 'Priya', 'Amit', 'Sunita'];
  const priorities: Order['priority'][] = ['normal', 'high', 'urgent'];
  
  return [
    {
      id: 'ORD001',
      tableNumber: 5,
      orderSource: 'dine-in',
      customerName: 'Sharma Family',
      customerPhone: '+91 98765 43210',
      items: [
        { id: '1', name: 'Butter Chicken', quantity: 2, price: 280, category: 'Main Course' },
        { id: '2', name: 'Garlic Naan', quantity: 3, price: 60, category: 'Breads' },
        { id: '3', name: 'Dal Makhani', quantity: 1, price: 160, category: 'Main Course' }
      ],
      status: 'new',
      orderTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 25,
      priority: 'normal',
      waiter: 'Raj',
      deliveryType: 'dine-in',
      paymentMethod: 'cash',
      specialInstructions: 'Less spicy for kids',
      totalAmount: 1000,
      subtotal: 840,
      taxes: [
        { name: 'CGST', rate: 9, amount: 75.6 },
        { name: 'SGST', rate: 9, amount: 75.6 }
      ]
    },
    {
      id: 'ORD002',
      tableNumber: 3,
      orderSource: 'dine-in',
      customerName: 'Kumar Party',
      customerPhone: '+91 87654 32109',
      items: [
        { id: '4', name: 'Chicken Biryani', quantity: 1, price: 250, category: 'Main Course' },
        { id: '5', name: 'Raita', quantity: 1, price: 80, category: 'Sides' }
      ],
      status: 'preparing',
      orderTime: new Date(Date.now() - 15 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 35,
      priority: 'high',
      waiter: 'Priya',
      deliveryType: 'dine-in',
      paymentMethod: 'card',
      preparedBy: 'Chef Ravi',
      totalAmount: 389,
      subtotal: 330,
      taxes: [
        { name: 'CGST', rate: 9, amount: 29.7 },
        { name: 'SGST', rate: 9, amount: 29.7 }
      ]
    },
    {
      id: 'ORD003',
      orderSource: 'zomato',
      customerName: 'Rajesh Patel',
      customerPhone: '+91 99988 77766',
      items: [
        { id: '6', name: 'Paneer Tikka', quantity: 1, price: 240, category: 'Starters' },
        { id: '7', name: 'Roti', quantity: 4, price: 25, category: 'Breads' },
        { id: '8', name: 'Mixed Vegetables', quantity: 1, price: 180, category: 'Main Course' }
      ],
      status: 'new',
      orderTime: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 20,
      priority: 'normal',
      waiter: 'Online',
      deliveryType: 'delivery',
      paymentMethod: 'upi',
      deliveryAddress: '123 Gandhi Nagar, Delhi',
      totalAmount: 520,
      subtotal: 440,
      taxes: [
        { name: 'CGST', rate: 9, amount: 39.6 },
        { name: 'SGST', rate: 9, amount: 39.6 }
      ]
    },
    {
      id: 'ORD004',
      orderSource: 'swiggy',
      customerName: 'Priya Singh',
      customerPhone: '+91 88776 65543',
      items: [
        { id: '9', name: 'Masala Dosa', quantity: 2, price: 120, category: 'South Indian' },
        { id: '10', name: 'Filter Coffee', quantity: 2, price: 40, category: 'Beverages' }
      ],
      status: 'ready',
      orderTime: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 15,
      priority: 'high',
      waiter: 'Online',
      deliveryType: 'pickup',
      paymentMethod: 'card',
      totalAmount: 320,
      subtotal: 280,
      taxes: [
        { name: 'CGST', rate: 7.5, amount: 21 },
        { name: 'SGST', rate: 7.5, amount: 21 }
      ]
    },
    {
      id: 'ORD005',
      orderSource: 'takeaway',
      customerName: 'Amit Gupta',
      customerPhone: '+91 77665 54321',
      items: [
        { id: '11', name: 'Chicken Tikka', quantity: 1, price: 320, category: 'Starters' },
        { id: '12', name: 'Jeera Rice', quantity: 1, price: 120, category: 'Rice' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 45 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      priority: 'normal',
      waiter: 'POS System',
      deliveryType: 'takeaway',
      paymentMethod: 'cash',
      totalAmount: 440,
      subtotal: 440,
      taxes: [],
      completedAt: new Date(Date.now() - 30 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 4.5,
      feedback: 'Great food quality and quick service!'
    },
    // Additional completed orders with ratings for AI analysis
    {
      id: 'ORD006',
      orderSource: 'dine-in',
      tableNumber: 8,
      customerName: 'Sharma Family',
      customerPhone: '+91 99887 76654',
      items: [
        { id: '1', name: 'Butter Chicken', quantity: 1, price: 280, category: 'Main Course' },
        { id: '2', name: 'Naan', quantity: 2, price: 45, category: 'Breads' },
        { id: '6', name: 'Masala Chai', quantity: 2, price: 30, category: 'Beverages' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      actualCookingTime: 18,
      priority: 'normal',
      waiter: 'Raj',
      deliveryType: 'dine-in',
      paymentMethod: 'upi',
      totalAmount: 400,
      subtotal: 400,
      taxes: [],
      completedAt: new Date(Date.now() - 90 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 5,
      feedback: 'Absolutely delicious! Best butter chicken in the city.'
    },
    {
      id: 'ORD007',
      orderSource: 'swiggy',
      customerName: 'Anjali Verma',
      customerPhone: '+91 88990 01122',
      items: [
        { id: '5', name: 'Hyderabadi Biryani', quantity: 1, price: 250, category: 'Main Course' },
        { id: '10', name: 'Raita', quantity: 1, price: 80, category: 'Sides' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      actualCookingTime: 35,
      priority: 'normal',
      waiter: 'Online',
      deliveryType: 'delivery',
      paymentMethod: 'card',
      totalAmount: 330,
      subtotal: 330,
      taxes: [],
      completedAt: new Date(Date.now() - 150 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 4,
      feedback: 'Good taste but delivery was slightly delayed.'
    },
    {
      id: 'ORD008',
      orderSource: 'dine-in',
      tableNumber: 12,
      customerName: 'Dev Patel',
      customerPhone: '+91 77554 43322',
      items: [
        { id: '3', name: 'Dal Makhani', quantity: 1, price: 160, category: 'Main Course' },
        { id: '4', name: 'Jeera Rice', quantity: 1, price: 120, category: 'Rice' },
        { id: '6', name: 'Masala Chai', quantity: 1, price: 30, category: 'Beverages' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      actualCookingTime: 22,
      priority: 'normal',
      waiter: 'Priya',
      deliveryType: 'dine-in',
      paymentMethod: 'cash',
      totalAmount: 310,
      subtotal: 310,
      taxes: [],
      completedAt: new Date(Date.now() - 210 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 3.5,
      feedback: 'Food was okay but service was slow.'
    },
    {
      id: 'ORD009',
      orderSource: 'zomato',
      customerName: 'Meera Shah',
      customerPhone: '+91 66443 32211',
      items: [
        { id: '1', name: 'Butter Chicken', quantity: 2, price: 280, category: 'Main Course' },
        { id: '2', name: 'Naan', quantity: 4, price: 45, category: 'Breads' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      actualCookingTime: 25,
      priority: 'high',
      waiter: 'Online',
      deliveryType: 'delivery',
      paymentMethod: 'upi',
      totalAmount: 740,
      subtotal: 740,
      taxes: [],
      completedAt: new Date(Date.now() - 330 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 4.8,
      feedback: 'Excellent food! Will definitely order again.'
    },
    {
      id: 'ORD010',
      orderSource: 'takeaway',
      customerName: 'Suresh Kumar',
      customerPhone: '+91 55332 21100',
      items: [
        { id: '5', name: 'Hyderabadi Biryani', quantity: 1, price: 250, category: 'Main Course' },
        { id: '6', name: 'Masala Chai', quantity: 1, price: 30, category: 'Beverages' }
      ],
      status: 'completed',
      orderTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      orderDate: new Date().toISOString().split('T')[0],
      estimatedTime: 0,
      actualCookingTime: 40,
      priority: 'normal',
      waiter: 'POS System',
      deliveryType: 'takeaway',
      paymentMethod: 'card',
      totalAmount: 280,
      subtotal: 280,
      taxes: [],
      completedAt: new Date(Date.now() - 450 * 60 * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      rating: 4.2,
      feedback: 'Great biryani as always!'
    },
    // Previous day orders for trend analysis
    {
      id: 'ORD011',
      orderSource: 'dine-in',
      tableNumber: 5,
      customerName: 'Rakesh Agarwal',
      customerPhone: '+91 44556 67788',
      items: [
        { id: '3', name: 'Dal Makhani', quantity: 1, price: 160, category: 'Main Course' },
        { id: '2', name: 'Naan', quantity: 2, price: 45, category: 'Breads' }
      ],
      status: 'completed',
      orderTime: '7:30 PM',
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
      estimatedTime: 0,
      actualCookingTime: 20,
      priority: 'normal',
      waiter: 'Amit',
      deliveryType: 'dine-in',
      paymentMethod: 'cash',
      totalAmount: 250,
      subtotal: 250,
      taxes: [],
      completedAt: '8:00 PM',
      rating: 3.8,
      feedback: 'Food was good but ambiance could be better.'
    },
    {
      id: 'ORD012',
      orderSource: 'swiggy',
      customerName: 'Pooja Reddy',
      customerPhone: '+91 33445 56677',
      items: [
        { id: '5', name: 'Hyderabadi Biryani', quantity: 2, price: 250, category: 'Main Course' }
      ],
      status: 'completed',
      orderTime: '8:15 PM',
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
      estimatedTime: 0,
      actualCookingTime: 45,
      priority: 'normal',
      waiter: 'Online',
      deliveryType: 'delivery',
      paymentMethod: 'upi',
      totalAmount: 500,
      subtotal: 500,
      taxes: [],
      completedAt: '9:15 PM',
      rating: 4.7,
      feedback: 'Outstanding biryani! Perfectly cooked.'
    }
  ];
};

const defaultOrders: Order[] = generateDefaultOrders();

const defaultStaff: Staff[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    role: 'Manager',
    phone: '+91 98765 43210',
    email: 'rajesh@eatwithme.com',
    pin: '1234',
    isActive: true,
    joinDate: '2024-01-15',
    salary: 45000,
    currentShift: 'Evening',
    permissions: ['dashboard', 'pos', 'reports', 'menu', 'staff', 'settings', 'inventory', 'kitchen', 'tables', 'customers', 'marketing'],
    dashboardModules: ['dashboard', 'pos', 'reports', 'staff', 'tables'],
    performance: {
      ordersHandled: 150,
      avgOrderTime: 12,
      customerRating: 4.7
    },
    salaryDetails: {
      baseSalary: 40000,
      allowances: 5000,
      deductions: 1000,
      overtime: 1000,
      totalSalary: 45000
    },
    paymentHistory: []
  },
  {
    id: '2',
    name: 'Priya Singh',
    role: 'Cashier',
    phone: '+91 87654 32109',
    pin: '2345',
    isActive: true,
    joinDate: '2024-02-01',
    salary: 25000,
    permissions: ['pos', 'reports', 'customers'],
    dashboardModules: ['pos', 'customers'],
    performance: {
      ordersHandled: 200,
      avgOrderTime: 8,
      customerRating: 4.5
    },
    salaryDetails: {
      baseSalary: 22000,
      allowances: 3000,
      deductions: 500,
      overtime: 500,
      totalSalary: 25000
    },
    paymentHistory: []
  },
  {
    id: '3',
    name: 'Amit Sharma',
    role: 'Waiter',
    phone: '+91 76543 21098',
    pin: '3456',
    isActive: true,
    joinDate: '2024-01-20',
    salary: 18000,
    currentShift: 'Morning',
    permissions: ['pos', 'tables', 'customers'],
    dashboardModules: ['tables', 'pos'],
    performance: {
      ordersHandled: 180,
      avgOrderTime: 10,
      customerRating: 4.6
    },
    salaryDetails: {
      baseSalary: 15000,
      allowances: 3000,
      deductions: 0,
      overtime: 0,
      totalSalary: 18000
    },
    paymentHistory: []
  },
  {
    id: '4',
    name: 'Chef Ravi',
    role: 'Chef',
    phone: '+91 65432 10987',
    pin: '4567',
    isActive: true,
    joinDate: '2024-01-10',
    salary: 35000,
    currentShift: 'Evening',
    permissions: ['kitchen', 'menu', 'inventory'],
    dashboardModules: ['kitchen', 'inventory'],
    performance: {
      ordersHandled: 300,
      avgOrderTime: 15,
      customerRating: 4.8
    },
    salaryDetails: {
      baseSalary: 32000,
      allowances: 3000,
      deductions: 0,
      overtime: 0,
      totalSalary: 35000
    },
    paymentHistory: []
  }
];

const defaultShifts: Shift[] = [];
const defaultSalaryPayments: SalaryPayment[] = [];

// Default Extended Customers Data
const defaultExtendedCustomers: ExtendedCustomer[] = [
  {
    id: '1',
    name: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'rajesh@email.com',
    whatsappOptIn: true,
    birthDate: '1985-06-15',
    preferences: ['Vegetarian', 'Spicy Food'],
    orderHistory: [
      {
        id: 'order_1',
        date: '2024-01-15',
        items: ['Paneer Butter Masala', 'Garlic Naan'],
        amount: 450,
        table: 5
      }
    ],
    totalSpent: 2150,
    visitCount: 8,
    averageOrderValue: 268,
    lastVisit: '2024-01-15',
    loyaltyPoints: 215,
    tier: 'silver'
  },
  {
    id: '2',
    name: 'Priya Singh',
    phone: '+91 87654 32109',
    email: 'priya@email.com',
    whatsappOptIn: true,
    anniversary: '2020-02-14',
    preferences: ['Italian', 'Continental'],
    orderHistory: [
      {
        id: 'order_2',
        date: '2024-01-12',
        items: ['Margherita Pizza', 'Cappuccino'],
        amount: 380,
        table: 3
      }
    ],
    totalSpent: 1520,
    visitCount: 5,
    averageOrderValue: 304,
    lastVisit: '2024-01-12',
    loyaltyPoints: 152,
    tier: 'bronze'
  }
];

// Default Expenses Data
const defaultExpenses: Expense[] = [
  {
    id: 'exp_1',
    title: 'Monthly Rent',
    category: 'Fixed Costs',
    subcategory: 'Rent',
    amount: 50000,
    date: '2024-01-01',
    vendor: 'Property Owner',
    description: 'Monthly restaurant rent',
    paymentMethod: 'bank_transfer',
    status: 'paid',
    receiptNumber: 'REC001',
    recurring: true,
    recurringPeriod: 'monthly',
    approvedBy: 'Manager',
    netAmount: 50000
  },
  {
    id: 'exp_2',
    title: 'Electricity Bill',
    category: 'Utilities',
    subcategory: 'Power',
    amount: 8500,
    date: '2024-01-05',
    vendor: 'State Electricity Board',
    description: 'Monthly electricity charges',
    paymentMethod: 'upi',
    status: 'paid',
    receiptNumber: 'EB2024001',
    recurring: true,
    recurringPeriod: 'monthly',
    taxAmount: 1500,
    netAmount: 7000
  },
  {
    id: 'exp_3',
    title: 'Fresh Vegetables',
    category: 'Ingredients',
    subcategory: 'Vegetables',
    amount: 3200,
    date: '2024-01-15',
    vendor: 'Local Vegetable Supplier',
    paymentMethod: 'cash',
    status: 'paid',
    supplierId: 'sup_1',
    tags: ['daily', 'fresh'],
    netAmount: 3200
  }
];

// Default Reservations Data
const defaultReservations: Reservation[] = [
  {
    id: 'res_1',
    customerName: 'Amit Sharma',
    customerPhone: '+91 99887 66554',
    customerEmail: 'amit@email.com',
    date: '2024-01-20',
    time: '19:30',
    partySize: 4,
    tableNumber: 8,
    status: 'confirmed',
    specialRequests: 'Anniversary celebration, need cake arrangement',
    occasion: 'Anniversary',
    createdAt: '2024-01-15T10:30:00Z',
    source: 'phone',
    priority: 'high',
    reminderSent: false
  },
  {
    id: 'res_2',
    customerName: 'Sarah Johnson',
    customerPhone: '+91 88776 65543',
    date: '2024-01-22',
    time: '20:00',
    partySize: 6,
    tableNumber: 12,
    status: 'pending',
    specialRequests: 'Business dinner, quiet section preferred',
    createdAt: '2024-01-16T14:20:00Z',
    source: 'online',
    priority: 'normal',
    reminderSent: false
  },
  {
    id: 'res_3',
    customerName: 'Vikram Patel',
    customerPhone: '+91 77665 54432',
    date: '2024-01-18',
    time: '13:00',
    partySize: 2,
    tableNumber: 5,
    status: 'completed',
    createdAt: '2024-01-10T09:15:00Z',
    source: 'walk-in',
    priority: 'normal',
    reminderSent: true,
    arrivalStatus: 'on-time',
    diningDuration: 90,
    orderTotal: 850,
    rating: 5,
    feedback: 'Excellent food and service!'
  }
];

// Default Purchase Orders Data
const defaultPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'PO001',
    supplierId: '1',
    supplierName: 'Fresh Vegetable Suppliers',
    orderDate: '2024-03-15',
    expectedDate: '2024-03-18',
    status: 'shipped',
    totalAmount: 25000,
    items: [
      { itemName: 'Tomatoes', quantity: 50, unit: 'kg', rate: 30, amount: 1500 },
      { itemName: 'Onions', quantity: 100, unit: 'kg', rate: 25, amount: 2500 },
      { itemName: 'Potatoes', quantity: 75, unit: 'kg', rate: 20, amount: 1500 }
    ]
  },
  {
    id: 'PO002',
    supplierId: '2',
    supplierName: 'Spice World Trading',
    orderDate: '2024-03-14',
    expectedDate: '2024-03-20',
    status: 'confirmed',
    totalAmount: 15000,
    items: [
      { itemName: 'Garam Masala', quantity: 10, unit: 'kg', rate: 400, amount: 4000 },
      { itemName: 'Turmeric Powder', quantity: 20, unit: 'kg', rate: 180, amount: 3600 }
    ]
  }
];

// Default Budget Categories Data
const defaultBudgetCategories: BudgetCategory[] = [
  {
    id: 'budget_1',
    name: 'Raw Materials',
    budget: 50000,
    spent: 35000,
    icon: 'Utensils',
    color: 'bg-green-100 text-green-700',
    description: 'Food ingredients and cooking materials',
    isActive: true
  },
  {
    id: 'budget_2',
    name: 'Utilities',
    budget: 25000,
    spent: 18200,
    icon: 'Zap',
    color: 'bg-yellow-100 text-yellow-700',
    description: 'Electricity, water, gas, and other utilities',
    isActive: true
  },
  {
    id: 'budget_3',
    name: 'Staff',
    budget: 80000,
    spent: 12000,
    icon: 'Users',
    color: 'bg-blue-100 text-blue-700',
    description: 'Staff salaries and benefits',
    isActive: true
  },
  {
    id: 'budget_4',
    name: 'Maintenance',
    budget: 15000,
    spent: 5500,
    icon: 'Building',
    color: 'bg-purple-100 text-purple-700',
    description: 'Equipment and facility maintenance',
    isActive: true
  },
  {
    id: 'budget_5',
    name: 'Transportation',
    budget: 10000,
    spent: 7500,
    icon: 'Truck',
    color: 'bg-orange-100 text-orange-700',
    description: 'Delivery and transportation costs',
    isActive: true
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Existing state
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(defaultMenuItems);
  const [suppliers, setSuppliers] = useState<Supplier[]>(defaultSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(defaultCustomers);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(defaultInventoryItems);
  const [inventoryWastageRecords, setInventoryWastageRecords] = useState<InventoryWastageRecord[]>(defaultInventoryWastageRecords);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tables, setTables] = useState<Table[]>(defaultTables);
  const [orders, setOrders] = useState<Order[]>(defaultOrders);
  const [loyaltyMembers, setLoyaltyMembers] = useState<LoyaltyMember[]>(defaultLoyaltyMembers);
  const [loyaltyRewards, setLoyaltyRewards] = useState<LoyaltyReward[]>(defaultLoyaltyRewards);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>(defaultLoyaltyRules);
  
  // New data state
  const [recipes, setRecipes] = useState<Recipe[]>(defaultRecipes);
  const [extendedCustomers, setExtendedCustomers] = useState<ExtendedCustomer[]>(defaultExtendedCustomers);
  const [expenses, setExpenses] = useState<Expense[]>(defaultExpenses);
  const [reservations, setReservations] = useState<Reservation[]>(defaultReservations);
  const [staff, setStaff] = useState<Staff[]>(defaultStaff);
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPayment[]>(defaultSalaryPayments);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(defaultPurchaseOrders);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(defaultBudgetCategories);
  
  // New dynamic state
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [currentModule, setCurrentModule] = useState('dashboard');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dataInitialized, setDataInitialized] = useState(false);

  const initializationPromiseRef = useRef<Promise<void> | null>(null);

  const applySettingsPatch = (base: AppSettings, patch: Partial<AppSettings>): AppSettings => {
    const updated = { ...base, ...patch };

    if (patch.country && patch.country !== base.country) {
      updated.taxRules = getDefaultTaxRules(patch.country);
      updated.currency = countryCurrencyMap[patch.country]?.currency || 'USD';
      updated.currencySymbol = countryCurrencyMap[patch.country]?.symbol || '$';
    }

    return updated;
  };
  
  // Derived state
  const userRole = currentUser ? findRoleConfig(currentUser.role) : null;
  const availableModules = currentUser 
    ? getAvailableModulesForUser(currentUser.role, currentUser.permissions)
    : [];
  const bottomNavigation = currentUser ? getBottomNavigationForRole(currentUser.role) : [];
  const quickActions = currentUser ? getQuickActionsForRole(currentUser.role) : [];

  const parseIsoString = (value: unknown): string => {
    if (!value) {
      return '';
    }
    if (value instanceof Date) {
      return value.toISOString();
    }
    const date = new Date(value as string);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toISOString();
  };

  const getDateOnly = (value: unknown): string => {
    const iso = parseIsoString(value);
    if (!iso) {
      return '';
    }
    const [datePart] = iso.split('T');
    return datePart;
  };

  const parseJsonArray = <T,>(value: unknown, fallback: T[]): T[] => {
    if (Array.isArray(value)) {
      return value as T[];
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as T[]) : fallback;
      } catch (error) {
        console.warn('Failed to parse JSON array', error);
      }
    }
    return fallback;
  };

  const normalizeSpiceLevel = (value: unknown): MenuItem['spiceLevel'] => {
    const mappings: Record<string, MenuItem['spiceLevel']> = {
      mild: 'mild',
      medium: 'medium',
      hot: 'hot'
    };

    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (mappings[normalized]) {
        return mappings[normalized];
      }
    }

    if (typeof value === 'number') {
      if (value <= 1) return 'mild';
      if (value >= 3) return 'hot';
      return 'medium';
    }

    return 'medium';
  };

  const normalizeTableStatus = (value: unknown): TableStatus => {
    const allowed: TableStatus[] = ['free', 'occupied', 'reserved', 'cleaning', 'maintenance', 'blocked'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase();
      if (allowed.includes(normalized as TableStatus)) {
        return normalized as TableStatus;
      }
    }
    return 'free';
  };

  const normalizeReservationStatus = (value: unknown): Reservation['status'] => {
    const allowed: Reservation['status'][] = ['confirmed', 'pending', 'seated', 'completed', 'cancelled', 'no-show'];
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (lower === 'noshow' || lower === 'no_show') {
        return 'no-show';
      }
      const normalized = lower as Reservation['status'];
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'pending';
  };

  const normalizeReservationPriority = (value: unknown): Reservation['priority'] => {
    const allowed: Reservation['priority'][] = ['normal', 'high', 'vip'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as Reservation['priority'];
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'normal';
  };

  const normalizeOrderStatus = (value: unknown): Order['status'] => {
    const allowed: Order['status'][] = ['new', 'preparing', 'ready', 'served', 'completed', 'cancelled'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as Order['status'];
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'new';
  };

  const normalizeOrderPriority = (value: unknown): Order['priority'] => {
    const allowed: Order['priority'][] = ['normal', 'high', 'urgent'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as Order['priority'];
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'normal';
  };

  const normalizeOrderSource = (value: unknown): Order['orderSource'] => {
    const allowed: Order['orderSource'][] = ['dine-in', 'zomato', 'swiggy', 'own-app', 'website', 'takeaway', 'qr-code'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as Order['orderSource'];
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'dine-in';
  };

  const normalizeDeliveryType = (value: unknown): NonNullable<Order['deliveryType']> => {
    const allowed: NonNullable<Order['deliveryType']>[] = ['dine-in', 'delivery', 'pickup', 'takeaway'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as NonNullable<Order['deliveryType']>;
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'dine-in';
  };

  const normalizePaymentMethod = (value: unknown): NonNullable<Order['paymentMethod']> => {
    const allowed: NonNullable<Order['paymentMethod']>[] = ['cash', 'card', 'upi', 'split'];
    if (typeof value === 'string') {
      const normalized = value.toLowerCase() as NonNullable<Order['paymentMethod']>;
      if (allowed.includes(normalized)) {
        return normalized;
      }
    }
    return 'cash';
  };

  const normalizeSalaryPaymentType = (value: unknown): SalaryPayment['paymentType'] => {
    const allowed: SalaryPayment['paymentType'][] = ['Full Salary', 'Partial Payment', 'Advance', 'Bonus', 'Overtime'];
    if (typeof value === 'string') {
      const match = allowed.find(item => item.toLowerCase() === value.toLowerCase());
      if (match) {
        return match;
      }
    }
    return 'Full Salary';
  };

  const normalizeSalaryPaymentStatus = (value: unknown): SalaryPayment['status'] => {
    if (typeof value === 'string' && value.toLowerCase() === 'pending') {
      return 'Pending';
    }
    return 'Completed';
  };

  const normalizePaymentRecordStatus = (value: unknown): PaymentRecord['status'] => {
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered === 'paid') {
        return 'Paid';
      }
      if (lowered === 'pending') {
        return 'Pending';
      }
      if (lowered === 'overdue') {
        return 'Overdue';
      }
    }
    return 'Completed';
  };

  const normalizeShiftStatus = (value: unknown): Shift['status'] => {
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered === 'completed') {
        return 'Completed';
      }
      if (lowered === 'scheduled') {
        return 'Scheduled';
      }
    }
    return 'Active';
  };

  const normalizeShiftType = (value: unknown): Shift['shiftType'] => {
    if (typeof value === 'string') {
      const lowered = value.toLowerCase();
      if (lowered === 'evening') {
        return 'Evening';
      }
      if (lowered === 'night') {
        return 'Night';
      }
    }
    return 'Morning';
  };

  const mapSettingsFromApi = useCallback((data: any): AppSettings => {
    const parsedTaxRules = parseJsonArray<TaxRule>(data?.taxRules, defaultSettings.taxRules);

    return {
      ...defaultSettings,
      restaurantName: data?.name ?? defaultSettings.restaurantName,
      country: data?.country ?? defaultSettings.country,
      currency: data?.currency ?? defaultSettings.currency,
      currencySymbol: data?.currencySymbol ?? defaultSettings.currencySymbol,
      whatsappApiKey: data?.whatsappApiKey ?? '',
      whatsappPhoneNumber: data?.whatsappPhoneNumber ?? '',
      taxRules: parsedTaxRules,
      defaultTaxCategory: data?.defaultTaxCategory ?? defaultSettings.defaultTaxCategory,
      theme: data?.theme?.toLowerCase?.() === 'dark' ? 'dark' : 'light',
      language: data?.language ?? defaultSettings.language,
      notifications: typeof data?.notifications === 'boolean' ? data.notifications : defaultSettings.notifications,
      autoBackup: typeof data?.autoBackup === 'boolean' ? data.autoBackup : defaultSettings.autoBackup,
      multiLocation: typeof data?.multiLocation === 'boolean' ? data.multiLocation : defaultSettings.multiLocation,
      loyaltyEnabled: typeof data?.loyaltyEnabled === 'boolean' ? data.loyaltyEnabled : defaultSettings.loyaltyEnabled,
      loyaltyPointsPerCurrency: typeof data?.loyaltyPointsPerCurrency === 'number' ? data.loyaltyPointsPerCurrency : defaultSettings.loyaltyPointsPerCurrency,
      businessAddress: data?.address ?? defaultSettings.businessAddress,
      businessPhone: data?.phone ?? defaultSettings.businessPhone,
      businessEmail: data?.email ?? defaultSettings.businessEmail,
      taxNumber: data?.taxNumber ?? defaultSettings.taxNumber,
      fssaiNumber: data?.fssaiNumber ?? defaultSettings.fssaiNumber
    };
  }, []);

  const mapSettingsPatchToApi = useCallback((patch: Partial<AppSettings>): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(patch, 'restaurantName')) {
      payload.name = patch.restaurantName ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'country')) {
      payload.country = patch.country ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'currency')) {
      payload.currency = patch.currency ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'currencySymbol')) {
      payload.currencySymbol = patch.currencySymbol ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'whatsappApiKey')) {
      payload.whatsappApiKey = patch.whatsappApiKey ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'whatsappPhoneNumber')) {
      payload.whatsappPhoneNumber = patch.whatsappPhoneNumber ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'taxRules')) {
      payload.taxRules = patch.taxRules ?? [];
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'defaultTaxCategory')) {
      payload.defaultTaxCategory = patch.defaultTaxCategory ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'theme')) {
      payload.theme = patch.theme ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'language')) {
      payload.language = patch.language ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'notifications')) {
      payload.notifications = patch.notifications;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'autoBackup')) {
      payload.autoBackup = patch.autoBackup;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'multiLocation')) {
      payload.multiLocation = patch.multiLocation;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'loyaltyEnabled')) {
      payload.loyaltyEnabled = patch.loyaltyEnabled;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'loyaltyPointsPerCurrency')) {
      payload.loyaltyPointsPerCurrency = patch.loyaltyPointsPerCurrency;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'businessAddress')) {
      payload.address = patch.businessAddress ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'businessPhone')) {
      payload.phone = patch.businessPhone ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'businessEmail')) {
      payload.email = patch.businessEmail ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'taxNumber')) {
      payload.taxNumber = patch.taxNumber ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'fssaiNumber')) {
      payload.fssaiNumber = patch.fssaiNumber ?? null;
    }

    return payload;
  }, []);

  const mapMenuItemFromApi = useCallback((item: any): MenuItem => {
    const nutritionalInfo = (item?.calories || item?.protein || item?.carbs || item?.fat)
      ? {
          calories: item?.calories ?? undefined,
          protein: item?.protein ?? undefined,
          carbs: item?.carbs ?? undefined,
          fat: item?.fat ?? undefined,
        }
      : undefined;

    return {
      id: item?.id ?? '',
      name: item?.name ?? 'Unnamed Item',
      price: Number(item?.price ?? 0),
      category: item?.category?.name ?? item?.categoryName ?? item?.category ?? 'Uncategorized',
      available: typeof item?.available === 'boolean' ? item.available : true,
      description: item?.description ?? undefined,
      isVeg: Boolean(item?.isVeg),
      spiceLevel: normalizeSpiceLevel(item?.spiceLevel),
      cookingTime: item?.cookingTime ? Number(item.cookingTime) : 0,
      rating: typeof item?.rating === 'number' ? item.rating : undefined,
      isPopular: Boolean(item?.isPopular),
      allergens: Array.isArray(item?.allergens) ? item.allergens : [],
      taxCategory: item?.taxCategory ?? 'food',
      applicableTaxes: parseJsonArray<string>(item?.applicableTaxes, []),
      nutritionalInfo,
    };
  }, []);

  const mapMenuItemToApi = useCallback((item: Partial<CreateMenuItemPayload>): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(item, 'name')) {
      payload.name = item.name;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'price')) {
      payload.price = item.price;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'category')) {
      payload.category = item.category;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'description')) {
      payload.description = item.description ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'available')) {
      payload.available = item.available;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'isVeg')) {
      payload.isVeg = item.isVeg;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'spiceLevel')) {
      const spiceLevel = item.spiceLevel;
      if (typeof spiceLevel === 'string') {
        const spiceMapping: Record<MenuItem['spiceLevel'], number> = { mild: 1, medium: 2, hot: 3 };
        payload.spiceLevel = spiceMapping[spiceLevel] ?? spiceLevel;
      } else {
        payload.spiceLevel = spiceLevel;
      }
    }
    if (Object.prototype.hasOwnProperty.call(item, 'cookingTime')) {
      payload.cookingTime = item.cookingTime;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'isPopular')) {
      payload.isPopular = item.isPopular;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'allergens')) {
      payload.allergens = item.allergens ?? [];
    }
    if (Object.prototype.hasOwnProperty.call(item, 'calories')) {
      payload.calories = item.calories ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'protein')) {
      payload.protein = item.protein ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'carbs')) {
      payload.carbs = item.carbs ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(item, 'fat')) {
      payload.fat = item.fat ?? null;
    }

    return payload;
  }, []);

  const mapCategoryFromApi = useCallback((category: any): Category => {
    const rawType = typeof category?.type === 'string' ? category.type.toLowerCase() : 'menu';
    const allowed: Category['type'][] = ['menu', 'expense', 'inventory', 'supplier'];
    const type = allowed.includes(rawType as Category['type']) ? (rawType as Category['type']) : 'menu';

    const resolvedColor = typeof category?.color === 'string' && category.color.trim().length > 0
      ? category.color
      : undefined;

    const resolvedItemCount = typeof category?.itemCount === 'number'
      ? category.itemCount
      : Array.isArray(category?.menuItems)
        ? category.menuItems.length
        : undefined;

    return {
      id: category?.id ?? '',
      name: category?.name ?? 'Untitled Category',
      type,
      description: category?.description ?? undefined,
      color: resolvedColor,
      itemCount: resolvedItemCount,
      createdAt: category?.createdAt ? parseIsoString(category.createdAt) : undefined,
      isActive: typeof category?.isActive === 'boolean' ? category.isActive : true,
    };
  }, [parseIsoString]);

  const mapCategoryToApi = useCallback((payload: CreateCategoryPayload | UpdateCategoryPayload) => {
    const body: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'name') && payload.name !== undefined) {
      body.name = payload.name;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
      body.description = payload.description;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'color')) {
      body.color = payload.color;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'type') && payload.type !== undefined) {
      body.type = payload.type;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'isActive') && payload.isActive !== undefined) {
      body.isActive = payload.isActive;
    }

    return body;
  }, []);

  const mapRoleFromApi = useCallback((role: any): Role => {
    const permissions = normalizePermissionList(
      Array.isArray(role?.permissions) ? role.permissions : []
    );
    const dashboardModules = Array.isArray(role?.dashboardModules)
      ? Array.from(
          new Set<string>(
            role.dashboardModules
              .filter((module: unknown): module is string => typeof module === 'string' && module.trim().length > 0)
              .map((module: string) => module.trim())
          )
        )
      : [];

    return {
      id: role?.id ?? '',
      name: role?.name ?? 'Untitled Role',
      permissions,
      dashboardModules,
      description: role?.description ?? undefined,
      staffCount: typeof role?.staffCount === 'number' ? role.staffCount : undefined,
      createdAt: role?.createdAt ? parseIsoString(role.createdAt) : undefined,
      updatedAt: role?.updatedAt ? parseIsoString(role.updatedAt) : undefined,
    };
  }, [parseIsoString]);

  const mapRoleToApi = useCallback((payload: CreateRolePayload | UpdateRolePayload) => {
    const body: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(payload, 'name') && payload.name !== undefined) {
      body.name = payload.name;
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'permissions') && payload.permissions !== undefined) {
      const permissionArray = Array.isArray(payload.permissions) ? payload.permissions : [];
      body.permissions = normalizePermissionList(permissionArray);
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'dashboardModules') && payload.dashboardModules !== undefined) {
      body.dashboardModules = Array.isArray(payload.dashboardModules) ? payload.dashboardModules : [];
    }
    if (Object.prototype.hasOwnProperty.call(payload, 'description')) {
      body.description = payload.description ?? null;
    }

    return body;
  }, []);

  const mapTableFromApi = useCallback((table: any): Table => ({
    id: table?.id ?? '',
    number: Number(table?.number ?? 0),
    capacity: Number(table?.capacity ?? 0),
    status: normalizeTableStatus(table?.status),
    name: table?.name ?? null,
    area: table?.area ?? null,
    waiter: table?.waiter ?? undefined,
    customer: table?.customer ?? undefined,
    orderAmount: typeof table?.orderAmount === 'number' ? table.orderAmount : undefined,
    timeOccupied: table?.timeOccupied ?? undefined,
    guests: typeof table?.guests === 'number' ? table.guests : undefined,
    reservationTime: table?.reservationTime ?? undefined,
    reservationName: table?.reservationName ?? undefined,
    reservationPhone: table?.reservationPhone ?? undefined,
    lastOrderId: table?.lastOrderId ?? undefined,
    location: table?.location ?? null,
    notes: table?.notes ?? null,
    currentOrderId: table?.currentOrderId ?? null,
    currentBillId: table?.currentBillId ?? null,
    lastOrderAt: table?.lastOrderAt ? parseIsoString(table.lastOrderAt) : null,
    cleaningAssignedTo: table?.cleaningAssignedTo ?? undefined,
    cleaningEstimatedTime: table?.cleaningEstimatedTime ?? undefined,
    cleaningStartTime: table?.cleaningStartTime ?? undefined,
    cleaningNotes: table?.cleaningNotes ?? undefined,
  }), []);

  const mapReservationFromApi = useCallback((reservation: any): Reservation => ({
    id: reservation?.id ?? '',
    customerName: reservation?.customerName ?? '',
    customerPhone: reservation?.customerPhone ?? '',
    customerEmail: reservation?.customerEmail ?? undefined,
    date: getDateOnly(reservation?.date) || '',
    time: reservation?.time ?? '',
    partySize: Number(reservation?.partySize ?? 0),
    tableId: reservation?.tableId ?? undefined,
    tableNumber: reservation?.tableNumber ?? reservation?.table?.number ?? undefined,
    status: normalizeReservationStatus(reservation?.status),
    specialRequests: reservation?.specialRequests ?? undefined,
    occasion: reservation?.occasion ?? undefined,
    createdAt: parseIsoString(reservation?.createdAt) || '',
    source: typeof reservation?.source === 'string' ? (reservation.source.toLowerCase() as Reservation['source']) : 'phone',
    prepayment: typeof reservation?.prepayment === 'number' ? reservation.prepayment : undefined,
    priority: normalizeReservationPriority(reservation?.priority),
    reminderSent: reservation?.reminderSent ?? undefined,
    arrivalStatus: reservation?.arrivalStatus ?? undefined,
    diningDuration: reservation?.diningDuration ?? undefined,
    orderTotal: reservation?.orderTotal ?? undefined,
    rating: reservation?.rating ?? undefined,
    feedback: reservation?.feedback ?? undefined,
  }), [getDateOnly, parseIsoString]);

  const mapReservationToApi = useCallback((reservation: Partial<CreateReservationPayload>): Record<string, unknown> => {
    const payload: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(reservation, 'tableId')) {
      payload.tableId = reservation.tableId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'customerId')) {
      payload.customerId = reservation.customerId ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'date')) {
      const dateValue = reservation.date;
      if (dateValue) {
        const parsed = new Date(dateValue);
        payload.date = Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
      } else {
        payload.date = null;
      }
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'time')) {
      payload.time = reservation.time ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'partySize')) {
      payload.partySize = reservation.partySize != null ? Number(reservation.partySize) : null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'status')) {
      payload.status = reservation.status ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'customerName')) {
      payload.customerName = reservation.customerName ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'customerPhone')) {
      payload.customerPhone = reservation.customerPhone ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'customerEmail')) {
      payload.customerEmail = reservation.customerEmail ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'specialRequests')) {
      payload.specialRequests = reservation.specialRequests ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'occasion')) {
      payload.occasion = reservation.occasion ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'source')) {
      payload.source = reservation.source ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(reservation, 'priority')) {
      payload.priority = reservation.priority ?? null;
    }

    return payload;
  }, []);

  const mapOrderItemFromApi = (item: any): OrderItem => ({
    id: item?.id ?? '',
    name: item?.name ?? 'Item',
    quantity: Number(item?.quantity ?? 0),
    price: Number(item?.price ?? 0),
    notes: item?.notes ?? undefined,
    category: item?.category ?? 'General',
  });

  const mapOrderFromApi = useCallback((order: any): Order => {
    const orderTimeIso = parseIsoString(order?.orderTime) || new Date().toISOString();
    const orderDate = getDateOnly(orderTimeIso) || new Date().toISOString().split('T')[0];

    const estimatedTimeValue = order?.estimatedTime;
    const estimatedTime = typeof estimatedTimeValue === 'number'
      ? estimatedTimeValue
      : (() => {
          if (!estimatedTimeValue) return 0;
          const parsed = Number(estimatedTimeValue);
          return Number.isNaN(parsed) ? 0 : parsed;
        })();

    return {
      id: order?.id ?? '',
      tableNumber: order?.tableNumber ?? undefined,
      orderSource: normalizeOrderSource(order?.orderSource),
      customerName: order?.customerName ?? undefined,
      customerPhone: order?.customerPhone ?? undefined,
      customerEmail: order?.customerEmail ?? undefined,
      orderNumber: order?.orderNumber ?? undefined,
      items: Array.isArray(order?.items) ? order.items.map(mapOrderItemFromApi) : [],
      status: normalizeOrderStatus(order?.status),
      orderTime: orderTimeIso,
      orderDate,
      estimatedTime,
      actualCookingTime: typeof order?.actualCookingTime === 'number' ? order.actualCookingTime : undefined,
      priority: normalizeOrderPriority(order?.priority),
      waiter: order?.waiterName ?? order?.waiter ?? undefined,
      specialInstructions: order?.specialInstructions ?? undefined,
      deliveryType: normalizeDeliveryType(order?.deliveryType),
      deliveryAddress: order?.deliveryAddress ?? undefined,
      completedAt: order?.completedAt ? parseIsoString(order.completedAt) : undefined,
      preparedBy: order?.preparedBy ?? undefined,
      totalAmount: Number(order?.totalAmount ?? 0),
      subtotal: Number(order?.subtotal ?? 0),
      taxes: Array.isArray(order?.taxes) ? order.taxes : [],
      paymentMethod: normalizePaymentMethod(order?.paymentMethod),
      feedback: order?.feedback ?? undefined,
      rating: typeof order?.rating === 'number' ? order.rating : undefined,
    };
  }, [getDateOnly, parseIsoString]);

  const mapPaymentRecordFromApi = useCallback((payment: any): PaymentRecord => {
    const paymentDateIso = parseIsoString(payment?.paymentDate) || new Date().toISOString();
    const derivedDate = new Date(paymentDateIso);
    const month = payment?.month ?? derivedDate.toLocaleString('default', { month: 'long' });
    const year = Number(payment?.year ?? derivedDate.getFullYear());
    const paymentTypeValue = payment?.paymentType ?? payment?.type;
    const type = typeof paymentTypeValue === 'string'
      ? normalizeSalaryPaymentType(paymentTypeValue)
      : 'Full Salary';

    return {
      id: payment?.id ?? '',
      month,
      year,
      amount: Number(payment?.amount ?? 0),
      paymentDate: paymentDateIso,
      status: normalizePaymentRecordStatus(payment?.status),
      bonus: typeof payment?.bonus === 'number' ? payment.bonus : undefined,
      deductions: typeof payment?.deductions === 'number' ? payment.deductions : undefined,
      type,
      description: payment?.description ?? undefined,
      paidBy: payment?.paidBy ?? undefined,
    };
  }, [normalizePaymentRecordStatus, normalizeSalaryPaymentType, parseIsoString]);

  const mapStaffFromApi = useCallback((staffMember: any): Staff => {
    const performance = staffMember?.performance ?? {};
    const salaryDetails = staffMember?.salaryDetails ?? {};
    const paymentHistory = Array.isArray(staffMember?.paymentHistory)
      ? staffMember.paymentHistory.map(mapPaymentRecordFromApi)
      : [];

    return {
      id: staffMember?.id ?? '',
      name: staffMember?.name ?? '',
      role: staffMember?.role ?? staffMember?.roleName ?? 'Staff',
      phone: staffMember?.phone ?? '',
      email: staffMember?.email ?? undefined,
      pin: staffMember?.pin ?? undefined,
      isActive: typeof staffMember?.isActive === 'boolean' ? staffMember.isActive : true,
      joinDate: staffMember?.joinDate ? getDateOnly(staffMember.joinDate) : undefined,
      salary: staffMember?.salary != null ? Number(staffMember.salary) : undefined,
      currentShift: typeof staffMember?.currentShift === 'string' ? staffMember.currentShift : undefined,
      permissions: normalizePermissionList(
        Array.isArray(staffMember?.permissions) ? staffMember.permissions : []
      ),
      dashboardModules: Array.isArray(staffMember?.dashboardModules)
        ? Array.from(new Set(staffMember.dashboardModules.filter(Boolean)))
        : [],
      performance: {
        ordersHandled: Number(performance?.ordersHandled ?? 0),
        avgOrderTime: Number(performance?.avgOrderTime ?? 0),
        customerRating: Number(performance?.customerRating ?? 0),
      },
      salaryDetails: {
        baseSalary: Number(salaryDetails?.baseSalary ?? staffMember?.salary ?? 0),
        allowances: Number(salaryDetails?.allowances ?? 0),
        deductions: Number(salaryDetails?.deductions ?? 0),
        overtime: Number(salaryDetails?.overtime ?? 0),
        totalSalary: Number(salaryDetails?.totalSalary ?? salaryDetails?.baseSalary ?? staffMember?.salary ?? 0),
      },
      paymentHistory,
    };
  }, [getDateOnly, mapPaymentRecordFromApi]);

  const mapShiftFromApi = useCallback((shift: any): Shift => {
    const dateIso = parseIsoString(shift?.date) || new Date().toISOString();

    return {
      id: shift?.id ?? '',
      staffId: shift?.staffId ?? '',
      startTime: shift?.startTime ?? '',
      endTime: shift?.endTime ?? undefined,
      openingCash: Number(shift?.openingCash ?? 0),
      closingCash: shift?.closingCash != null ? Number(shift.closingCash) : undefined,
      totalSales: Number(shift?.totalSales ?? 0),
      tips: Number(shift?.tips ?? 0),
      date: dateIso,
      status: normalizeShiftStatus(shift?.status),
      shiftType: normalizeShiftType(shift?.shiftType),
    };
  }, [normalizeShiftStatus, normalizeShiftType, parseIsoString]);

  const mapSalaryPaymentFromApi = useCallback((payment: any): SalaryPayment => {
    const paymentDateIso = parseIsoString(payment?.paymentDate) || new Date().toISOString();
    const derivedDate = new Date(paymentDateIso);
    const month = payment?.month ?? derivedDate.toLocaleString('default', { month: 'long' });
    const year = Number(payment?.year ?? derivedDate.getFullYear());

    return {
      id: payment?.id ?? '',
      staffId: payment?.staffId ?? '',
      amount: Number(payment?.amount ?? 0),
      paymentDate: paymentDateIso,
      paymentType: normalizeSalaryPaymentType(payment?.paymentType),
      description: payment?.description ?? '',
      paidBy: payment?.paidBy ?? '',
      status: normalizeSalaryPaymentStatus(payment?.status),
      month,
      year,
      staffName: payment?.staffName ?? payment?.staff?.name ?? undefined,
      staffRole: payment?.staffRole ?? payment?.staff?.role ?? payment?.staff?.role?.name ?? undefined,
    };
  }, [normalizeSalaryPaymentStatus, normalizeSalaryPaymentType, parseIsoString]);

  // Update navigation when user changes
  useEffect(() => {
    if (currentUser) {
      // Special screens that don't require access check
      const specialScreens = ['all-modules', 'dashboard'];
      
      // Skip access check for special screens
      if (specialScreens.includes(currentModule)) {
        return;
      }
      
      // Auto-navigate to first available module if current module is not accessible
      const hasAccess = hasModuleAccess(currentUser.role, currentModule, currentUser.permissions);
      if (!hasAccess && availableModules.length > 0) {
        setCurrentModule(availableModules[0].id);
      }
    }
  }, [currentUser, currentModule, availableModules]);

  const initializeAppData = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    const restaurantId = localStorage.getItem('restaurantId');

    if (!token || !restaurantId) {
      return;
    }

    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }

    const initPromise = (async () => {
      setIsDataLoading(true);
      setDataError(null);

      try {
        const results = await Promise.allSettled([
          apiClient.get('/settings'),
          apiClient.get('/menu'),
          apiClient.get('/category-role/categories'),
          apiClient.get('/category-role/roles'),
          apiClient.get('/tables'),
          apiClient.get('/reservations'),
          apiClient.get('/staff'),
          apiClient.get('/orders'),
          apiClient.get('/shifts'),
          apiClient.get('/staff/salary-payments'),
        ]);

        const [
          settingsResult,
          menuResult,
          categoriesResult,
          rolesResult,
          tablesResult,
          reservationsResult,
          staffResult,
          ordersResult,
          shiftsResult,
          salaryPaymentsResult,
        ] = results;

        const failedResources: string[] = [];

        if (settingsResult.status === 'fulfilled') {
          setSettings(mapSettingsFromApi(settingsResult.value.data));
        } else {
          failedResources.push('settings');
        }

        if (menuResult.status === 'fulfilled') {
          const items = Array.isArray(menuResult.value.data)
            ? menuResult.value.data.map(mapMenuItemFromApi)
            : [];
          setMenuItems(items);
        } else {
          failedResources.push('menu');
        }

        if (categoriesResult.status === 'fulfilled') {
          const cats = Array.isArray(categoriesResult.value.data)
            ? categoriesResult.value.data.map(mapCategoryFromApi)
            : [];
          setCategories(cats);
        } else {
          failedResources.push('categories');
        }

        if (rolesResult.status === 'fulfilled') {
          const roleData = Array.isArray(rolesResult.value.data)
            ? rolesResult.value.data.map(mapRoleFromApi)
            : [];
          setRoles(roleData);
        } else {
          failedResources.push('roles');
        }

        if (tablesResult.status === 'fulfilled') {
          const tbls = Array.isArray(tablesResult.value.data)
            ? tablesResult.value.data.map(mapTableFromApi)
            : [];
          setTables(tbls);
        } else {
          failedResources.push('tables');
        }

        if (reservationsResult.status === 'fulfilled') {
          const resv = Array.isArray(reservationsResult.value.data)
            ? reservationsResult.value.data.map(mapReservationFromApi)
            : [];
          setReservations(resv);
        } else {
          failedResources.push('reservations');
        }

        if (staffResult.status === 'fulfilled') {
          const payload = staffResult.value.data;
          const staffArray = Array.isArray(payload?.staff)
            ? payload.staff
            : Array.isArray(payload)
              ? payload
              : [];
          setStaff(staffArray.map(mapStaffFromApi));
        } else {
          failedResources.push('staff');
        }

        if (ordersResult.status === 'fulfilled') {
          const ords = Array.isArray(ordersResult.value.data)
            ? ordersResult.value.data.map(mapOrderFromApi)
            : [];
          setOrders(ords);
        } else {
          failedResources.push('orders');
        }

        if (shiftsResult.status === 'fulfilled') {
          const shiftData = Array.isArray(shiftsResult.value.data)
            ? shiftsResult.value.data.map(mapShiftFromApi)
            : [];
          setShifts(shiftData);
        } else {
          failedResources.push('shifts');
        }

        if (salaryPaymentsResult.status === 'fulfilled') {
          const payments = Array.isArray(salaryPaymentsResult.value.data)
            ? salaryPaymentsResult.value.data.map(mapSalaryPaymentFromApi)
            : [];
          setSalaryPayments(payments);
        } else {
          failedResources.push('salary payments');
        }

        setDataError(failedResources.length ? `Failed to load ${failedResources.join(', ')}` : null);
        setDataInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app data', error);
        setDataError('Failed to load application data.');
      } finally {
        setIsDataLoading(false);
      }
    })();

    initializationPromiseRef.current = initPromise;

    try {
      await initPromise;
    } finally {
      initializationPromiseRef.current = null;
    }
  }, [mapCategoryFromApi, mapMenuItemFromApi, mapOrderFromApi, mapReservationFromApi, mapRoleFromApi, mapSettingsFromApi, mapShiftFromApi, mapStaffFromApi, mapSalaryPaymentFromApi, mapTableFromApi]);

  const refreshAppData = useCallback(async () => {
    await initializeAppData();
  }, [initializeAppData]);

  const initializeAppDataRef = useRef(initializeAppData);

  useEffect(() => {
    initializeAppDataRef.current = initializeAppData;
  }, [initializeAppData]);

  useEffect(() => {
    if (currentUser) {
      initializeAppDataRef.current();
    }
  }, [currentUser]);

  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    let previous: AppSettings | null = null;
    let optimistic: AppSettings | null = null;

    setSettings(prev => {
      previous = prev;
      optimistic = applySettingsPatch(prev, newSettings);
      return optimistic;
    });

    const token = localStorage.getItem('accessToken');
    const restaurantId = localStorage.getItem('restaurantId');

    if (!token || !restaurantId) {
      return;
    }

    const apiPayload = mapSettingsPatchToApi(newSettings);
    if (!apiPayload || Object.keys(apiPayload).length === 0) {
      return;
    }

    try {
      const response = await apiClient.put('/settings', apiPayload);
      const normalized = mapSettingsFromApi(response.data);
      setSettings(normalized);
    } catch (error) {
      console.error('Failed to persist settings', error);
      if (previous) {
        setSettings(previous);
      }
      throw error;
    }
  }, [applySettingsPatch, mapSettingsFromApi, mapSettingsPatchToApi]);

  const updateMenuItems = (items: MenuItem[]) => {
    setMenuItems(items);
  };

  const addMenuItem = useCallback(async (payload: CreateMenuItemPayload): Promise<MenuItem> => {
    if (!payload.name || !payload.category) {
      throw new Error('Menu item name and category are required');
    }

    try {
      const response = await apiClient.post('/menu', mapMenuItemToApi(payload));
      const created = mapMenuItemFromApi(response.data);
      setMenuItems(prev => {
        const exists = prev.some(item => item.id === created.id);
        return exists ? prev.map(item => (item.id === created.id ? created : item)) : [...prev, created];
      });
      return created;
    } catch (error) {
      console.error('Failed to create menu item', error);
      throw error;
    }
  }, [mapMenuItemFromApi, mapMenuItemToApi]);

  const updateMenuItem = useCallback(async (id: string, updates: UpdateMenuItemPayload): Promise<MenuItem> => {
    try {
      const response = await apiClient.put(`/menu/${id}`, mapMenuItemToApi(updates));
      const updated = mapMenuItemFromApi(response.data);
      setMenuItems(prev => prev.map(item => (item.id === id ? updated : item)));
      return updated;
    } catch (error) {
      console.error('Failed to update menu item', error);
      throw error;
    }
  }, [mapMenuItemFromApi, mapMenuItemToApi]);

  const deleteMenuItem = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/menu/${id}`);
      setMenuItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete menu item', error);
      throw error;
    }
  }, []);

  // Staff functions
  const addStaff = useCallback(async (payload: CreateStaffPayload): Promise<Staff> => {
    try {
      const body: any = {
        name: payload.name,
        phone: payload.phone,
        pin: payload.pin,
        email: payload.email,
        roleId: payload.roleId,
        roleName: payload.roleName,
        salary: payload.salary != null ? Number(payload.salary) : undefined,
        permissions: normalizePermissionList(
          Array.isArray(payload.permissions) ? payload.permissions : []
        ),
        dashboardModules: Array.isArray(payload.dashboardModules)
          ? Array.from(new Set(payload.dashboardModules.filter(Boolean)))
          : [],
        joinDate: payload.joinDate,
        password: payload.password,
        isActive: payload.isActive,
      };

      if (body.salary === undefined) {
        delete body.salary;
      }

      if (!body.password && payload.pin) {
        body.password = payload.pin;
      }

      Object.keys(body).forEach(key => {
        if (body[key] === undefined || body[key] === null) {
          delete body[key];
        }
      });

      const response = await apiClient.post('/staff', body);
      const staffMember = mapStaffFromApi(response.data);
      setStaff(prev => {
        const existingIndex = prev.findIndex(item => item.id === staffMember.id);
        if (existingIndex >= 0) {
          const copy = [...prev];
          copy[existingIndex] = staffMember;
          return copy;
        }
        return [...prev, staffMember];
      });
      return staffMember;
    } catch (error) {
      console.error('Failed to add staff member', error);
      throw error;
    }
  }, [mapStaffFromApi]);

  const updateStaff = useCallback(async (id: string, updates: UpdateStaffPayload): Promise<Staff> => {
    try {
      const body: any = {
        ...updates,
        salary: updates.salary != null ? Number(updates.salary) : undefined,
        permissions: Array.isArray(updates.permissions)
          ? normalizePermissionList(updates.permissions)
          : undefined,
        dashboardModules: Array.isArray(updates.dashboardModules)
          ? Array.from(new Set(updates.dashboardModules.filter(Boolean)))
          : undefined,
        joinDate: updates.joinDate,
        password: updates.password,
        roleId: updates.roleId,
        roleName: updates.roleName,
        isActive: updates.isActive,
      };

      Object.keys(body).forEach(key => {
        if (body[key] === undefined) {
          delete body[key];
        }
      });

      if (updates.currentShift === null) {
        body.currentShift = null;
      } else if (typeof updates.currentShift === 'string') {
        body.currentShift = updates.currentShift;
      }

      const response = await apiClient.put(`/staff/${id}`, body);
      const staffMember = mapStaffFromApi(response.data);
      setStaff(prev => prev.map(existing => existing.id === id ? staffMember : existing));
      return staffMember;
    } catch (error) {
      console.error('Failed to update staff member', error);
      throw error;
    }
  }, [mapStaffFromApi]);

  const deleteStaff = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/staff/${id}`);
      setStaff(prev => prev.filter(staffMember => staffMember.id !== id));
      setShifts(prev => prev.filter(shift => shift.staffId !== id));
      setSalaryPayments(prev => prev.filter(payment => payment.staffId !== id));
    } catch (error) {
      console.error('Failed to delete staff member', error);
      throw error;
    }
  }, []);

  // Shift functions
  const addShift = useCallback(async (payload: CreateShiftPayload): Promise<Shift> => {
    try {
      const response = await apiClient.post('/shifts', {
        staffId: payload.staffId,
        startTime: payload.startTime,
        endTime: payload.endTime,
        shiftType: payload.shiftType,
        openingCash: payload.openingCash,
        closingCash: payload.closingCash,
        totalSales: payload.totalSales,
        tips: payload.tips,
        status: payload.status,
        date: payload.date,
      });

      const createdShift = mapShiftFromApi(response.data);
      setShifts(prev => [...prev, createdShift]);
      return createdShift;
    } catch (error) {
      console.error('Failed to create shift log', error);
      throw error;
    }
  }, [mapShiftFromApi]);

  const updateShift = useCallback(async (id: string, updates: UpdateShiftPayload): Promise<Shift> => {
    try {
      const response = await apiClient.put(`/shifts/${id}`, {
        ...updates,
        openingCash: updates.openingCash,
        closingCash: updates.closingCash,
        totalSales: updates.totalSales,
        tips: updates.tips,
      });

      const updatedShift = mapShiftFromApi(response.data);
      setShifts(prev => prev.map(shift => shift.id === id ? updatedShift : shift));
      return updatedShift;
    } catch (error) {
      console.error('Failed to update shift log', error);
      throw error;
    }
  }, [mapShiftFromApi]);

  const deleteShift = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/shifts/${id}`);
      setShifts(prev => prev.filter(shift => shift.id !== id));
    } catch (error) {
      console.error('Failed to delete shift log', error);
      throw error;
    }
  }, []);

  // Salary payment functions
  const addSalaryPayment = useCallback(async (payload: CreateSalaryPaymentPayload): Promise<SalaryPayment> => {
    try {
      const response = await apiClient.post('/staff/salary-payments', {
        staffId: payload.staffId,
        amount: payload.amount,
        paymentType: payload.paymentType,
        description: payload.description,
        paidBy: payload.paidBy,
        status: payload.status,
        paymentDate: payload.paymentDate,
        month: payload.month,
        year: payload.year,
      });

      const payment = mapSalaryPaymentFromApi(response.data);
      setSalaryPayments(prev => [payment, ...prev]);
      const paymentRecord = mapPaymentRecordFromApi({
        id: payment.id,
        month: payment.month,
        year: payment.year,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        status: payment.status,
        paymentType: payment.paymentType,
        description: payment.description,
        paidBy: payment.paidBy,
      });

      setStaff(prev => prev.map(staffMember => {
        if (staffMember.id !== payment.staffId) {
          return staffMember;
        }

        const existingHistory = Array.isArray(staffMember.paymentHistory) ? staffMember.paymentHistory : [];
        const historyIndex = existingHistory.findIndex(record => record.id === paymentRecord.id);
        const nextHistory = historyIndex >= 0
          ? existingHistory.map(record => record.id === paymentRecord.id ? paymentRecord : record)
          : [...existingHistory, paymentRecord];

        return {
          ...staffMember,
          paymentHistory: nextHistory,
        };
      }));

      return payment;
    } catch (error) {
      console.error('Failed to record salary payment', error);
      throw error;
    }
  }, [mapPaymentRecordFromApi, mapSalaryPaymentFromApi]);

  // Supplier functions
  const updateSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
  };

  const addSupplier = (supplier: Supplier) => {
    setSuppliers(prev => [...prev, supplier]);
  };

  const updateSupplier = (id: string, updates: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(supplier => 
      supplier.id === id ? { ...supplier, ...updates } : supplier
    ));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
  };

  // Customer functions
  const updateCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
  };

  const addCustomer = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ));
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  // Category functions
  const getCategoriesByType = (type: 'menu' | 'expense' | 'inventory' | 'supplier') => {
    return categories.filter(cat => cat.type === type && cat.isActive);
  };

  const addCategory = useCallback(async (payload: CreateCategoryPayload): Promise<Category> => {
    if (!payload.name || !payload.type) {
      throw new Error('Category name and type are required');
    }

    try {
      const response = await apiClient.post('/category-role/categories', mapCategoryToApi(payload));
      const created = mapCategoryFromApi(response.data);
      setCategories(prev => {
        const exists = prev.some(category => category.id === created.id);
        return exists
          ? prev.map(category => (category.id === created.id ? created : category))
          : [...prev, created];
      });
      return created;
    } catch (error) {
      console.error('Failed to create category', error);
      throw error;
    }
  }, [mapCategoryFromApi, mapCategoryToApi]);

  const updateCategory = useCallback(async (id: string, updates: UpdateCategoryPayload): Promise<Category> => {
    if (!id) {
      throw new Error('Category id is required');
    }

    const body = mapCategoryToApi(updates);

    try {
      const response = await apiClient.put(`/category-role/categories/${id}`, body);
      const updated = mapCategoryFromApi(response.data);
      setCategories(prev => prev.map(category => (category.id === id ? updated : category)));
      return updated;
    } catch (error) {
      console.error('Failed to update category', error);
      throw error;
    }
  }, [mapCategoryFromApi, mapCategoryToApi]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Category id is required');
    }

    try {
      await apiClient.delete(`/category-role/categories/${id}`);
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Failed to delete category', error);
      throw error;
    }
  }, []);

  const updateCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
  };

  const updateRoles = (newRoles: Role[]) => {
    setRoles(newRoles);
  };

  const addRole = useCallback(async (payload: CreateRolePayload): Promise<Role> => {
    const name = payload.name?.trim();
    if (!name) {
      throw new Error('Role name is required');
    }

    const body = mapRoleToApi({ ...payload, name });

    try {
      const response = await apiClient.post('/category-role/roles', body);
      const createdFromApi = mapRoleFromApi(response.data);
      const createdRole: Role = {
        ...createdFromApi,
        name,
        permissions: Array.isArray(payload.permissions)
          ? payload.permissions
          : createdFromApi.permissions ?? [],
        dashboardModules: Array.isArray(payload.dashboardModules)
          ? payload.dashboardModules
          : createdFromApi.dashboardModules ?? [],
        description: payload.description ?? createdFromApi.description,
        staffCount: createdFromApi.staffCount ?? 0,
      };

      setRoles(prev => {
        const exists = prev.some(role => role.id === createdRole.id);
        return exists ? prev.map(role => (role.id === createdRole.id ? createdRole : role)) : [...prev, createdRole];
      });

      return createdRole;
    } catch (error) {
      console.error('Failed to create role', error);
      throw error;
    }
  }, [mapRoleFromApi, mapRoleToApi]);

  const updateRole = useCallback(async (id: string, updates: UpdateRolePayload): Promise<Role> => {
    if (!id) {
      throw new Error('Role id is required');
    }

    const body = mapRoleToApi(updates);

    try {
      const response = await apiClient.put(`/category-role/roles/${id}`, body);
      const updatedFromApi = mapRoleFromApi(response.data);
      let resolvedRole: Role = {
        ...updatedFromApi,
        permissions: Array.isArray(updatedFromApi.permissions) ? updatedFromApi.permissions : [],
        dashboardModules: Array.isArray(updatedFromApi.dashboardModules) ? updatedFromApi.dashboardModules : [],
      };

      if (updates.permissions !== undefined) {
        resolvedRole.permissions = Array.isArray(updates.permissions) ? updates.permissions : [];
      }

      if (updates.dashboardModules !== undefined) {
        resolvedRole.dashboardModules = Array.isArray(updates.dashboardModules) ? updates.dashboardModules : [];
      }

      if (updates.description !== undefined) {
        resolvedRole.description = updates.description ?? undefined;
      }

      setRoles(prev => prev.map(role => {
        if (role.id !== id) {
          return role;
        }

        const merged: Role = {
          ...role,
          ...resolvedRole,
          staffCount: resolvedRole.staffCount ?? role.staffCount,
        };

        resolvedRole = merged;
        return merged;
      }));

      return resolvedRole;
    } catch (error) {
      console.error('Failed to update role', error);
      throw error;
    }
  }, [mapRoleFromApi, mapRoleToApi]);

  const deleteRole = useCallback(async (id: string): Promise<void> => {
    if (!id) {
      throw new Error('Role id is required');
    }

    try {
      await apiClient.delete(`/category-role/roles/${id}`);
      setRoles(prev => prev.filter(role => role.id !== id));
    } catch (error) {
      console.error('Failed to delete role', error);
      throw error;
    }
  }, []);

  // Inventory functions  
  const updateInventoryItems = (items: InventoryItem[]) => {
    setInventoryItems(items);
  };

  const addInventoryItem = (item: InventoryItem) => {
    setInventoryItems(prev => [...prev, item]);
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventoryItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteInventoryItem = (id: string) => {
    setInventoryItems(prev => prev.filter(item => item.id !== id));
  };

  const recordInventoryWastage = useCallback((payload: CreateInventoryWastageRecordPayload): InventoryWastageRecord => {
    const targetItem = inventoryItems.find(item => item.id === payload.inventoryItemId);
    if (!targetItem) {
      throw new Error('Inventory item not found');
    }

    const quantity = Number(payload.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Wastage quantity must be greater than zero');
    }

    if (quantity > targetItem.currentStock) {
      throw new Error('Wastage quantity cannot exceed current stock');
    }

    const record: InventoryWastageRecord = {
      id: `waste_${Date.now()}`,
      inventoryItemId: targetItem.id,
      itemName: targetItem.name,
      unit: targetItem.unit,
      quantity,
      reason: payload.reason,
      notes: payload.notes?.trim() ? payload.notes.trim() : undefined,
      recordedAt: payload.recordedAt ?? new Date().toISOString(),
      costPerUnit: targetItem.costPerUnit,
      valueLost: Number(quantity * targetItem.costPerUnit)
    };

    setInventoryWastageRecords(prev => [...prev, record]);
    setInventoryItems(prev => prev.map(item =>
      item.id === targetItem.id
        ? { ...item, currentStock: Math.max(0, item.currentStock - quantity) }
        : item
    ));

    return record;
  }, [inventoryItems]);

  const deleteInventoryWastageRecord = useCallback((id: string) => {
    setInventoryWastageRecords(prevRecords => {
      const record = prevRecords.find(entry => entry.id === id);
      if (!record) {
        return prevRecords;
      }

      setInventoryItems(prevItems => prevItems.map(item =>
        item.id === record.inventoryItemId
          ? { ...item, currentStock: item.currentStock + record.quantity }
          : item
      ));

      return prevRecords.filter(entry => entry.id !== id);
    });
  }, []);

  const addTaxRule = useCallback(async (taxRule: TaxRule): Promise<TaxRule> => {
    const targetRule = taxRule.id ? taxRule : { ...taxRule, id: `tax_${Date.now()}` };
    const existsIndex = settings.taxRules.findIndex(rule => rule.id === targetRule.id);
    const updatedRules = existsIndex >= 0
      ? settings.taxRules.map(rule => (rule.id === targetRule.id ? targetRule : rule))
      : [...settings.taxRules, targetRule];

    try {
      await updateSettings({ taxRules: updatedRules });
      return targetRule;
    } catch (error) {
      console.error('Failed to add tax rule', error);
      throw error;
    }
  }, [settings.taxRules, updateSettings]);

  const updateTaxRule = useCallback(async (id: string, updates: Partial<TaxRule>): Promise<TaxRule> => {
    const currentRule = settings.taxRules.find(rule => rule.id === id);
    if (!currentRule) {
      throw new Error('Tax rule not found');
    }

    const mergedRule = { ...currentRule, ...updates };
    const updatedRules = settings.taxRules.map(rule => (rule.id === id ? mergedRule : rule));

    try {
      await updateSettings({ taxRules: updatedRules });
      return mergedRule;
    } catch (error) {
      console.error('Failed to update tax rule', error);
      throw error;
    }
  }, [settings.taxRules, updateSettings]);

  const deleteTaxRule = useCallback(async (id: string): Promise<void> => {
    const filteredRules = settings.taxRules.filter(rule => rule.id !== id);

    try {
      await updateSettings({ taxRules: filteredRules });
    } catch (error) {
      console.error('Failed to delete tax rule', error);
      throw error;
    }
  }, [settings.taxRules, updateSettings]);

  const calculateTaxes = (baseAmount: number, taxCategory: string) => {
    const applicableTaxes = settings.taxRules.filter(rule => 
      rule.isActive && (
        rule.applicableCategories.includes(taxCategory) ||
        rule.applicableCategories.includes('all')
      )
    );

    const taxes = applicableTaxes.map(rule => ({
      name: rule.name,
      rate: rule.rate,
      amount: (baseAmount * rule.rate) / 100
    }));

    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    return { taxes, totalTax };
  };

  // Loyalty Management Methods
  const updateLoyaltyMembers = (members: LoyaltyMember[]) => {
    setLoyaltyMembers(members);
  };

  const addLoyaltyMember = (member: LoyaltyMember) => {
    setLoyaltyMembers(prev => [...prev, member]);
  };

  const updateLoyaltyMember = (id: string, updates: Partial<LoyaltyMember>) => {
    setLoyaltyMembers(prev => prev.map(member => 
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  const deleteLoyaltyMember = (id: string) => {
    setLoyaltyMembers(prev => prev.filter(member => member.id !== id));
  };

  const updateLoyaltyRewards = (rewards: LoyaltyReward[]) => {
    setLoyaltyRewards(rewards);
  };

  const addLoyaltyReward = (reward: LoyaltyReward) => {
    setLoyaltyRewards(prev => [...prev, reward]);
  };

  const updateLoyaltyReward = (id: string, updates: Partial<LoyaltyReward>) => {
    setLoyaltyRewards(prev => prev.map(reward => 
      reward.id === id ? { ...reward, ...updates } : reward
    ));
  };

  const deleteLoyaltyReward = (id: string) => {
    setLoyaltyRewards(prev => prev.filter(reward => reward.id !== id));
  };

  const updateLoyaltyRules = (rules: LoyaltyRule[]) => {
    setLoyaltyRules(rules);
  };

  const addLoyaltyRule = (rule: LoyaltyRule) => {
    setLoyaltyRules(prev => [...prev, rule]);
  };

  const updateLoyaltyRule = (id: string, updates: Partial<LoyaltyRule>) => {
    setLoyaltyRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    ));
  };

  const deleteLoyaltyRule = (id: string) => {
    setLoyaltyRules(prev => prev.filter(rule => rule.id !== id));
  };

  // New dynamic methods
  const setCurrentUser = (user: User | null) => {
    if (user) {
      setCurrentUserState({
        ...user,
        permissions: normalizePermissionList(user.permissions ?? []),
      });
      return;
    }

    setCurrentUserState(null);
    // Reset some state when user changes
    setSelectedTable(null);
    setCurrentOrder(null);
    setCurrentModule('dashboard');
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    const normalizedRequired = normalizePermissionKey(permission);
    if (!normalizedRequired) {
      return true;
    }
    const permissions = currentUser.permissions ?? [];
    return (
      permissions.includes(normalizedRequired) ||
      permissions.includes('*') ||
      permissions.includes('all_access')
    );
  };

  const hasModuleAccessMethod = (moduleId: string): boolean => {
    if (!currentUser) return false;
    return hasModuleAccess(currentUser.role, moduleId, currentUser.permissions);
  };

  const addNotification = (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50 notifications
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const getModuleByComponent = (componentName: string): ModuleConfig | undefined => {
    return APP_MODULES.find(module => module.component === componentName);
  };

  // Table management functions
  const updateTables = (newTables: Table[]) => {
    setTables(newTables);
  };

  const addTable = useCallback(async (payload: CreateTablePayload): Promise<Table> => {
    try {
      const response = await apiClient.post('/tables', {
        number: payload.number,
        capacity: payload.capacity,
        status: payload.status ? payload.status.toUpperCase() : undefined,
        name: payload.name ?? undefined,
        location: payload.location ?? undefined,
        notes: payload.notes ?? undefined,
      });

      const createdTable = mapTableFromApi(response.data);
      setTables(prev => [...prev, createdTable]);
      return createdTable;
    } catch (error) {
      console.error('Failed to create table', error);
      throw error;
    }
  }, [mapTableFromApi]);

  const updateTable = useCallback(async (id: string, updates: UpdateTablePayload): Promise<Table> => {
    try {
      const body: Record<string, unknown> = {
        number: updates.number,
        capacity: updates.capacity,
        name: updates.name ?? undefined,
        location: updates.location ?? undefined,
        notes: updates.notes ?? undefined,
        guests: typeof updates.guests === 'number' ? updates.guests : undefined,
        currentOrderId: updates.currentOrderId ?? undefined,
        lastOrderAt: updates.lastOrderAt ?? undefined,
      };

      if (updates.status) {
        body.status = updates.status.toUpperCase();
      }

      Object.keys(body).forEach(key => {
        if (body[key] === undefined) {
          delete body[key];
        }
      });

      const response = await apiClient.put(`/tables/${id}`, body);
      const updatedTable = mapTableFromApi(response.data);
      setTables(prev => prev.map(table => table.id === id ? updatedTable : table));
      return updatedTable;
    } catch (error) {
      console.error('Failed to update table', error);
      throw error;
    }
  }, [mapTableFromApi]);

  const deleteTable = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/tables/${id}`);
      setTables(prev => prev.filter(table => table.id !== id));
    } catch (error) {
      console.error('Failed to delete table', error);
      throw error;
    }
  }, []);

  const getTableById = (id: string): Table | undefined => {
    return tables.find(table => table.id === id);
  };

  const getTableByNumber = (number: number): Table | undefined => {
    return tables.find(table => table.number === number);
  };

  const getAvailableTables = (): Table[] => {
    return tables.filter(table => table.status === 'free');
  };

  const getTableStats = useCallback((): TableStats => {
    const total = tables.length;
    const occupied = tables.filter(t => t.status === 'occupied').length;
    const reserved = tables.filter(t => t.status === 'reserved').length;
    const cleaning = tables.filter(t => t.status === 'cleaning').length;
    const free = tables.filter(t => t.status === 'free').length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

    return {
      total,
      occupied,
      free,
      reserved,
      cleaning,
      revenue,
    };
  }, [orders, tables]);

  // Order management functions
  const updateOrders = (newOrders: Order[]) => {
    setOrders(newOrders);
  };

  const addOrder = (order: Order) => {
    setOrders(prev => [...prev, order]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  };

  const deleteOrder = (id: string) => {
    setOrders(prev => prev.filter(order => order.id !== id));
  };

  const getOrdersByTable = (tableNumber: number): Order[] => {
    return orders.filter(order => order.tableNumber === tableNumber);
  };

  const getOrdersByStatus = (status: Order['status']): Order[] => {
    return orders.filter(order => order.status === status);
  };

  const getOrderById = (id: string): Order | undefined => {
    return orders.find(order => order.id === id);
  };

  // Revenue and analytics methods
  const getTodayRevenue = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders
      .filter(order => order.orderDate === today && order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getRevenueBetweenDates = (startDate: string, endDate: string) => {
    return orders
      .filter(order => 
        order.orderDate >= startDate && 
        order.orderDate <= endDate && 
        order.status === 'completed'
      )
      .reduce((sum, order) => sum + order.totalAmount, 0);
  };

  const getRevenueByPaymentMethod = (dateFilter?: string) => {
    let filteredOrders = orders.filter(order => order.status === 'completed');
    
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      filteredOrders = filteredOrders.filter(order => order.orderDate === today);
    }

    const cash = filteredOrders
      .filter(order => order.paymentMethod === 'cash')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const digital = filteredOrders
      .filter(order => ['upi', 'card'].includes(order.paymentMethod || ''))
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const split = filteredOrders
      .filter(order => order.paymentMethod === 'split')
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return { cash, digital, split };
  };

  const getRevenueByOrderSource = (dateFilter?: string) => {
    let filteredOrders = orders.filter(order => order.status === 'completed');
    
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      filteredOrders = filteredOrders.filter(order => order.orderDate === today);
    }

    return filteredOrders.reduce((acc, order) => {
      const source = order.orderSource;
      acc[source] = (acc[source] || 0) + order.totalAmount;
      return acc;
    }, {} as Record<string, number>);
  };

  const getOrderStats = (dateFilter?: string) => {
    let filteredOrders = orders;
    
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      filteredOrders = orders.filter(order => order.orderDate === today);
    }

    const total = filteredOrders.length;
    const completed = filteredOrders.filter(order => order.status === 'completed').length;
    const pending = filteredOrders.filter(order => 
      ['new', 'preparing', 'ready'].includes(order.status)
    ).length;
    const cancelled = filteredOrders.filter(order => order.status === 'cancelled').length;

    const totalRevenue = filteredOrders
      .filter(order => order.status === 'completed')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const avgOrderValue = completed > 0 ? Math.round(totalRevenue / completed) : 0;

    return { total, completed, pending, cancelled, totalRevenue, avgOrderValue };
  };

  // Shared date filtering utilities for consistency across components
  const getOrdersByDateRange = (startDate: string, endDate: string): Order[] => {
    return orders.filter(order => 
      order.orderDate >= startDate && order.orderDate <= endDate
    );
  };

  const getOrdersByDateFilter = (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all'): Order[] => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'today':
        return orders.filter(order => order.orderDate === today);
      case 'yesterday':
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return orders.filter(order => order.orderDate === yesterday);
      case 'week':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return orders.filter(order => order.orderDate >= weekAgo && order.orderDate <= today);
      case 'month':
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        return orders.filter(order => order.orderDate >= monthAgo && order.orderDate <= today);
      case 'all':
      default:
        return orders;
    }
  };

  const getOrderStatsByDateFilter = (filter: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    const filteredOrders = getOrdersByDateFilter(filter);
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // Payment method breakdown
    const cashAmount = filteredOrders
      .filter(order => order.paymentMethod === 'cash')
      .reduce((sum, order) => sum + order.totalAmount, 0);
    
    const digitalAmount = filteredOrders
      .filter(order => ['upi', 'card'].includes(order.paymentMethod || ''))
      .reduce((sum, order) => sum + order.totalAmount, 0);

    // Status breakdown  
    const completed = filteredOrders.filter(order => order.status === 'completed').length;
    const pending = filteredOrders.filter(order => 
      ['new', 'preparing', 'ready'].includes(order.status)
    ).length;
    const cancelled = filteredOrders.filter(order => order.status === 'cancelled').length;

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      cashAmount,
      digitalAmount,
      completed,
      pending,
      cancelled,
      orders: filteredOrders
    };
  };

  // Recipes Management Functions
  const updateRecipes = (newRecipes: Recipe[]) => {
    setRecipes(newRecipes);
  };

  const addRecipe = (recipe: Recipe) => {
    setRecipes(prev => [...prev, recipe]);
  };

  const updateRecipe = (id: string, updates: Partial<Recipe>) => {
    setRecipes(prev => prev.map(recipe => 
      recipe.id === id ? { ...recipe, ...updates } : recipe
    ));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  const getRecipesByMenuItem = (menuItemId: string): Recipe[] => {
    return recipes.filter(recipe => recipe.menuItemId === menuItemId);
  };

  const calculateRecipeCost = (recipeId: string): number => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return 0;
    
    return recipe.ingredients.reduce((total, ingredient) => {
      const inventoryItem = inventoryItems.find(item => item.id === ingredient.inventoryItemId);
      if (inventoryItem) {
        return total + (ingredient.quantity * inventoryItem.costPerUnit);
      }
      return total;
    }, 0);
  };

  // Extended Customers Management Functions
  const updateExtendedCustomers = (newCustomers: ExtendedCustomer[]) => {
    setExtendedCustomers(newCustomers);
  };

  const addExtendedCustomer = (customer: ExtendedCustomer) => {
    setExtendedCustomers(prev => [...prev, customer]);
  };

  const updateExtendedCustomer = (id: string, updates: Partial<ExtendedCustomer>) => {
    setExtendedCustomers(prev => prev.map(customer => 
      customer.id === id ? { ...customer, ...updates } : customer
    ));
  };

  const deleteExtendedCustomer = (id: string) => {
    setExtendedCustomers(prev => prev.filter(customer => customer.id !== id));
  };

  const getCustomerOrderHistory = (customerId: string): ExtendedCustomer['orderHistory'] => {
    const customer = extendedCustomers.find(c => c.id === customerId);
    return customer?.orderHistory || [];
  };

  const updateCustomerStats = (customerId: string, newOrder: { amount: number; date: string; items: string[] }) => {
    setExtendedCustomers(prev => prev.map(customer => {
      if (customer.id === customerId) {
        const orderHistory = customer.orderHistory ?? [];
        const newOrderHistory = [...orderHistory, {
          id: `ORD${Date.now()}`,
          ...newOrder
        }];
        const currentTotalSpent = customer.totalSpent ?? 0;
        const currentVisitCount = customer.visitCount ?? 0;
        const newTotalSpent = currentTotalSpent + newOrder.amount;
        const newVisitCount = currentVisitCount + 1;
        const newAverageOrderValue = Math.round(newTotalSpent / newVisitCount);
        
        return {
          ...customer,
          orderHistory: newOrderHistory,
          totalSpent: newTotalSpent,
          visitCount: newVisitCount,
          averageOrderValue: newAverageOrderValue,
          lastVisit: newOrder.date,
          loyaltyPoints: (customer.loyaltyPoints || 0) + Math.floor(newOrder.amount / 10)
        };
      }
      return customer;
    }));
  };

  // Expenses Management Functions
  const updateExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === id ? { ...expense, ...updates } : expense
    ));
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(expense => expense.id !== id));
  };

  const getExpensesByCategory = (category: string): Expense[] => {
    return expenses.filter(expense => expense.category === category);
  };

  const getExpensesByDateRange = (startDate: string, endDate: string): Expense[] => {
    return expenses.filter(expense => 
      expense.date >= startDate && expense.date <= endDate
    );
  };

  const getTotalExpenses = (dateFilter?: string): number => {
    let filteredExpenses = expenses;
    
    if (dateFilter) {
      const today = new Date().toISOString().split('T')[0];
      filteredExpenses = expenses.filter(expense => expense.date === today);
    }
    
    return filteredExpenses
      .filter(expense => expense.status === 'paid')
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getExpensesBySupplier = (supplierId: string): Expense[] => {
    return expenses.filter(expense => expense.supplierId === supplierId);
  };

  // Purchase Orders Management Functions
  const updatePurchaseOrders = (newOrders: PurchaseOrder[]) => {
    setPurchaseOrders(newOrders);
  };

  const addPurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, order]);
  };

  const updatePurchaseOrder = (id: string, updates: Partial<PurchaseOrder>) => {
    setPurchaseOrders(prev => prev.map(order => 
      order.id === id ? { ...order, ...updates } : order
    ));
  };

  const deletePurchaseOrder = (id: string) => {
    setPurchaseOrders(prev => prev.filter(order => order.id !== id));
  };

  const getPurchaseOrdersBySupplier = (supplierId: string): PurchaseOrder[] => {
    return purchaseOrders.filter(order => order.supplierId === supplierId);
  };

  const getPurchaseOrdersByStatus = (status: PurchaseOrder['status']): PurchaseOrder[] => {
    return purchaseOrders.filter(order => order.status === status);
  };

  // Budget Categories Management Functions
  const updateBudgetCategories = (newCategories: BudgetCategory[]) => {
    setBudgetCategories(newCategories);
  };

  const addBudgetCategory = (category: BudgetCategory) => {
    setBudgetCategories(prev => [...prev, category]);
  };

  const updateBudgetCategory = (id: string, updates: Partial<BudgetCategory>) => {
    setBudgetCategories(prev => prev.map(category => 
      category.id === id ? { ...category, ...updates } : category
    ));
  };

  const deleteBudgetCategory = (id: string) => {
    setBudgetCategories(prev => prev.filter(category => category.id !== id));
  };

  const getBudgetCategorySpent = (categoryId: string): number => {
    const category = budgetCategories.find(c => c.id === categoryId);
    return category?.spent || 0;
  };

  const updateBudgetCategorySpent = (categoryId: string, amount: number) => {
    setBudgetCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? { ...category, spent: category.spent + amount } 
        : category
    ));
  };

  // Reservations Management Functions
  const updateReservations = (newReservations: Reservation[]) => {
    setReservations(newReservations);
  };

  const addReservation = useCallback(async (payload: CreateReservationPayload): Promise<Reservation> => {
    if (!payload.customerName || !payload.customerPhone || !payload.date || !payload.time) {
      throw new Error('Missing required reservation fields');
    }

    const body = mapReservationToApi(payload) as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(body, 'status') || body.status == null) {
      body.status = payload.status ?? 'pending';
    }

    try {
      const response = await apiClient.post('/reservations', body);
      const created = mapReservationFromApi(response.data);
      const merged: Reservation = {
        ...created,
        tableNumber: created.tableNumber ?? payload.tableNumber,
      };

      setReservations(prev => {
        const exists = prev.some(reservation => reservation.id === merged.id);
        return exists
          ? prev.map(reservation => (reservation.id === merged.id ? merged : reservation))
          : [...prev, merged];
      });

      return merged;
    } catch (error) {
      console.error('Failed to create reservation', error);
      throw error;
    }
  }, [mapReservationFromApi, mapReservationToApi]);

  const updateReservation = useCallback(async (id: string, updates: UpdateReservationPayload): Promise<Reservation> => {
    const body = mapReservationToApi(updates);

    try {
      const response = await apiClient.put(`/reservations/${id}`, body);
      const updated = mapReservationFromApi(response.data);
      const merged: Reservation = {
        ...updated,
        tableNumber: updated.tableNumber ?? updates.tableNumber ?? undefined,
      };

      setReservations(prev => prev.map(reservation => 
        reservation.id === id ? merged : reservation
      ));

      return merged;
    } catch (error) {
      console.error('Failed to update reservation', error);
      throw error;
    }
  }, [mapReservationFromApi, mapReservationToApi]);

  const deleteReservation = useCallback(async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/reservations/${id}`);
      setReservations(prev => prev.filter(reservation => reservation.id !== id));
    } catch (error) {
      console.error('Failed to delete reservation', error);
      throw error;
    }
  }, []);

  const getReservationsByDate = (date: string): Reservation[] => {
    return reservations.filter(reservation => reservation.date === date);
  };

  const getReservationsByTable = (tableId: string): Reservation[] => {
    return reservations.filter(reservation => reservation.tableId === tableId);
  };

  const getReservationsByStatus = (status: Reservation['status']): Reservation[] => {
    return reservations.filter(reservation => reservation.status === status);
  };

  // Customer Synchronization Functions
  const syncCustomerFromReservation = (reservation: Reservation) => {
    const existingCustomer = extendedCustomers.find(c => 
      c.phone === reservation.customerPhone || 
      (reservation.customerEmail && c.email === reservation.customerEmail)
    );

    if (!existingCustomer) {
      const newCustomer: ExtendedCustomer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: reservation.customerName,
        phone: reservation.customerPhone,
        email: reservation.customerEmail,
        whatsappOptIn: false,
        preferences: [],
        orderHistory: [],
        totalSpent: 0,
        visitCount: 0,
        averageOrderValue: 0,
        lastVisit: reservation.date,
        loyaltyPoints: 0,
        tier: 'bronze'
      };
      
      setExtendedCustomers(prev => [...prev, newCustomer]);
      
      // Also add to basic customers list
      const basicCustomer: Customer = {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        totalOrders: 0,
        totalSpent: 0,
        loyaltyPoints: 0,
        lastVisit: reservation.date,
        averageRating: 0,
        tags: [],
        status: 'active'
      };
      
      setCustomers(prev => [...prev, basicCustomer]);
      
      return newCustomer;
    }
    return existingCustomer;
  };

  const syncCustomerFromOrder = (order: Order) => {
    if (!order.customerName || !order.customerPhone) return;

    const existingCustomer = extendedCustomers.find(c => 
      c.phone === order.customerPhone || 
      (order.customerEmail && c.email === order.customerEmail)
    );

    if (!existingCustomer) {
      const newCustomer: ExtendedCustomer = {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: order.customerName,
        phone: order.customerPhone,
        email: order.customerEmail,
        whatsappOptIn: false,
        preferences: [],
        orderHistory: [{
          id: order.id,
          date: order.orderTime,
          items: order.items.map(i => i.name),
          amount: order.totalAmount,
          table: order.tableNumber || 0
        }],
        totalSpent: order.totalAmount,
        visitCount: 1,
        averageOrderValue: order.totalAmount,
        lastVisit: order.orderTime,
        loyaltyPoints: Math.floor(order.totalAmount / 10),
        tier: 'bronze'
      };
      
      setExtendedCustomers(prev => [...prev, newCustomer]);
      
      // Also add to basic customers list
      const basicCustomer: Customer = {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        totalOrders: 1,
        totalSpent: order.totalAmount,
        loyaltyPoints: Math.floor(order.totalAmount),
        loyaltyTier: calculateLoyaltyTier(order.totalAmount),
        lastVisit: order.orderTime,
        averageRating: 0,
        tags: ['New Customer'],
        status: 'active',
        joinDate: order.orderTime,
        referralCode: `${newCustomer.name.toUpperCase().replace(/\s+/g, '').substring(0, 5)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        referralCount: 0
      };
      
      setCustomers(prev => [...prev, basicCustomer]);
    } else {
      // Update existing customer with new order
      const orderHistoryItem = {
        id: order.id,
        date: order.orderTime,
        items: order.items.map(i => i.name),
        amount: order.totalAmount,
        table: order.tableNumber || 0
      };

      setExtendedCustomers(prev => prev.map(customer => {
        if (customer.id === existingCustomer.id) {
          const history = customer.orderHistory ?? [];
          const updatedOrderHistory = [...history, orderHistoryItem];
          const totalSpent = (customer.totalSpent ?? 0) + order.totalAmount;
          const visitCount = (customer.visitCount ?? 0) + 1;
          const currentPoints = customer.loyaltyPoints ?? 0;
          
          return {
            ...customer,
            orderHistory: updatedOrderHistory,
            totalSpent,
            visitCount,
            averageOrderValue: totalSpent / visitCount,
            lastVisit: order.orderTime,
            loyaltyPoints: currentPoints + Math.floor(order.totalAmount / 10)
          };
        }
        return customer;
      }));

      // Update basic customer too
      setCustomers(prev => prev.map(customer => {
        if (customer.id === existingCustomer.id) {
          const currentTotal = customer.totalSpent ?? 0;
          const currentOrders = customer.totalOrders ?? 0;
          const currentPoints = customer.loyaltyPoints ?? 0;
          const newTotalSpent = currentTotal + order.totalAmount;
          return {
            ...customer,
            totalOrders: currentOrders + 1,
            totalSpent: newTotalSpent,
            loyaltyPoints: currentPoints + Math.floor(order.totalAmount),
            loyaltyTier: calculateLoyaltyTier(newTotalSpent),
            lastVisit: order.orderTime
          };
        }
        return customer;
      }));
    }
  };

  const syncCustomerFromTable = (table: Table) => {
    if (table.status === 'reserved' && table.reservationName && table.reservationPhone) {
      const fakeReservation: Reservation = {
        id: `temp_${table.id}`,
        customerName: table.reservationName,
        customerPhone: table.reservationPhone,
        date: new Date().toISOString().split('T')[0],
        time: table.reservationTime || '00:00',
        partySize: table.guests || 2,
        tableNumber: table.number,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        source: 'phone',
        priority: 'normal',
        reminderSent: false
      };
      
      syncCustomerFromReservation(fakeReservation);
    }
    
    if (table.status === 'occupied' && table.customer) {
      // Try to find if this customer already exists by name
      const existingCustomer = extendedCustomers.find(c => 
        c.name.toLowerCase() === table.customer?.toLowerCase()
      );

      if (!existingCustomer && table.customer) {
        const newCustomer: ExtendedCustomer = {
          id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: table.customer,
          phone: 'N/A', // Will be updated when we get actual phone
          whatsappOptIn: false,
          preferences: [],
          orderHistory: [],
          totalSpent: table.orderAmount || 0,
          visitCount: 1,
          averageOrderValue: table.orderAmount || 0,
          lastVisit: new Date().toISOString().split('T')[0],
          loyaltyPoints: Math.floor((table.orderAmount || 0) / 10),
          tier: 'bronze'
        };
        
        setExtendedCustomers(prev => [...prev, newCustomer]);
      }
    }
  };

  const syncAllCustomers = () => {
    // Sync customers from reservations
    reservations.forEach(reservation => {
      syncCustomerFromReservation(reservation);
    });

    // Sync customers from orders
    orders.forEach(order => {
      if (order.customerName && order.customerPhone) {
        syncCustomerFromOrder(order);
      }
    });

    // Sync customers from tables
    tables.forEach(table => {
      syncCustomerFromTable(table);
    });
  };

  // Loyalty Program Methods
  const calculateLoyaltyTier = (totalSpent: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (totalSpent >= 10000) return 'platinum';
    if (totalSpent >= 5000) return 'gold';
    if (totalSpent >= 2000) return 'silver';
    return 'bronze';
  };

  const generateReferralCode = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) return '';
    
    // Generate code from name and random string
    const nameCode = customer.name.toUpperCase().replace(/\s+/g, '').substring(0, 5);
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${nameCode}${randomCode}`;
  };

  const awardLoyaltyPoints = (customerId: string, orderAmount: number) => {
    // Check if loyalty program is enabled
    if (!settings.loyaltyEnabled) {
      return 0;
    }
    
    // Find active earning rules
    const activeRules = loyaltyRules.filter(rule => rule.isActive && rule.type === 'earn');
    
    // Calculate base points (default 1 point per rupee if no rules)
    let pointsToAward = Math.floor(orderAmount);
    
    // Apply earning rules
    if (activeRules.length > 0) {
      const rule = activeRules[0]; // Use first active rule
      if (rule.pointsPerRupee) {
        pointsToAward = Math.floor(orderAmount * rule.pointsPerRupee);
      }
    }

    // Check for bonus rules
    const bonusRules = loyaltyRules.filter(rule => 
      rule.isActive && 
      rule.type === 'bonus' && 
      rule.minOrderValue && 
      orderAmount >= rule.minOrderValue
    );

    if (bonusRules.length > 0) {
      const bonusRule = bonusRules[0];
      if (bonusRule.bonusPoints) {
        pointsToAward += bonusRule.bonusPoints;
      }
    }

    // Update customer
    setCustomers(prev => prev.map(customer => {
      if (customer.id === customerId) {
        const currentTotalSpent = customer.totalSpent ?? 0;
        const currentPoints = customer.loyaltyPoints ?? 0;
        const currentOrders = customer.totalOrders ?? 0;
        const newTotalSpent = currentTotalSpent + orderAmount;
        const newPoints = currentPoints + pointsToAward;
        const newTier = calculateLoyaltyTier(newTotalSpent);
        
        return {
          ...customer,
          loyaltyPoints: newPoints,
          loyaltyTier: newTier,
          totalSpent: newTotalSpent,
          totalOrders: currentOrders + 1,
          lastVisit: new Date().toISOString().split('T')[0]
        };
      }
      return customer;
    }));

    return pointsToAward;
  };

  const redeemLoyaltyPoints = (customerId: string, points: number): boolean => {
    // Check if loyalty program is enabled
    if (!settings.loyaltyEnabled) {
      return false;
    }
    
    const customer = customers.find(c => c.id === customerId);
    if (!customer || (customer.loyaltyPoints ?? 0) < points) {
      return false;
    }

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        const currentPoints = c.loyaltyPoints ?? 0;
        return {
          ...c,
          loyaltyPoints: Math.max(0, currentPoints - points)
        };
      }
      return c;
    }));

    return true;
  };

  const handleReferral = (newCustomerId: string, referrerCode: string) => {
    // Find the referrer by referral code
    const referrer = customers.find(c => c.referralCode === referrerCode);
    if (!referrer) {
      return;
    }

    // Update new customer to mark who referred them
    setCustomers(prev => prev.map(c => {
      if (c.id === newCustomerId) {
        const currentPoints = c.loyaltyPoints ?? 0;
        return {
          ...c,
          referredBy: referrer.id,
          loyaltyPoints: currentPoints + 100 // Bonus points for being referred
        };
      }
      return c;
    }));

    // Update referrer - give bonus points and increment referral count
    setCustomers(prev => prev.map(c => {
      if (c.id === referrer.id) {
        const currentPoints = c.loyaltyPoints ?? 0;
        const currentReferrals = c.referralCount ?? 0;
        return {
          ...c,
          loyaltyPoints: currentPoints + 200, // Bonus for referring
          referralCount: currentReferrals + 1
        };
      }
      return c;
    }));

    // Send notification
    addNotification({
      title: 'Referral Bonus!',
      message: `${referrer.name} earned 200 points for referring a new customer!`,
      type: 'success'
    });
  };

  // Auto-sync on component mount and data changes
  useEffect(() => {
    syncAllCustomers();
  }, [reservations.length, orders.length, tables.length]);

  // Additional effect to sync on app startup
  useEffect(() => {
    syncAllCustomers();
  }, []);

  return (
    <AppContext.Provider value={{ 
      // Dynamic app config
      appModules: APP_MODULES,
      availableModules,
      bottomNavigation,
      quickActions,
      
      // User state
      currentUser,
      userRole,
      
      // App state
      currentModule,
      selectedTable,
      currentOrder,
      notifications,
      
      // Settings & data
      settings, 
      updateSettings, 
      menuItems, 
      updateMenuItems,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem,
      orders,
      updateOrders,
      addOrder,
      updateOrder,
      deleteOrder,
      getOrdersByTable,
      getOrdersByStatus,
      getOrderById,
      suppliers,
      updateSuppliers,
      addSupplier,
      updateSupplier,
      deleteSupplier,
      customers,
      updateCustomers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      inventoryItems,
      updateInventoryItems,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
  inventoryWastageRecords,
  recordInventoryWastage,
  deleteInventoryWastageRecord,
      categories,
      updateCategories,
      addCategory,
      updateCategory,
      deleteCategory,
      getCategoriesByType,
    roles,
    updateRoles,
    addRole,
    updateRole,
    deleteRole,
      addTaxRule,
      updateTaxRule,
      deleteTaxRule,
      calculateTaxes,
      
      // Loyalty management
      loyaltyMembers,
      updateLoyaltyMembers,
      addLoyaltyMember,
      updateLoyaltyMember,
      deleteLoyaltyMember,
      loyaltyRewards,
      updateLoyaltyRewards,
      addLoyaltyReward,
      updateLoyaltyReward,
      deleteLoyaltyReward,
      loyaltyRules,
      updateLoyaltyRules,
      addLoyaltyRule,
      updateLoyaltyRule,
      deleteLoyaltyRule,
      
      // Table management
      tables,
      updateTables,
      addTable,
      updateTable,
      deleteTable,
      getTableById,
      getTableByNumber,
      getAvailableTables,
      getTableStats,
      
      // Dynamic methods
      setCurrentUser,
      setCurrentModule,
      setSelectedTable,
      setCurrentOrder,
  isDataLoading,
  dataError,
  refreshAppData,
      hasPermission,
      hasModuleAccess: hasModuleAccessMethod,
      addNotification,
      markNotificationRead,
      clearNotifications,
      getModuleByComponent,
      
      // Revenue and Analytics methods
      getTodayRevenue,
      getRevenueBetweenDates,
      getRevenueByPaymentMethod,
      getRevenueByOrderSource,
      getOrderStats,
      
      // Shared date filtering utilities
      getOrdersByDateRange,
      getOrdersByDateFilter,
      getOrderStatsByDateFilter,
      
      // Recipes Management
      recipes,
      updateRecipes,
      addRecipe,
      updateRecipe,
      deleteRecipe,
      getRecipesByMenuItem,
      calculateRecipeCost,
      
      // Extended Customers Management
      extendedCustomers,
      updateExtendedCustomers,
      addExtendedCustomer,
      updateExtendedCustomer,
      deleteExtendedCustomer,
      getCustomerOrderHistory,
      updateCustomerStats,
      
      // Expenses Management
      expenses,
      updateExpenses,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpensesByCategory,
      getExpensesByDateRange,
      getTotalExpenses,
      getExpensesBySupplier,
      
      // Purchase Orders Management
      purchaseOrders,
      updatePurchaseOrders,
      addPurchaseOrder,
      updatePurchaseOrder,
      deletePurchaseOrder,
      getPurchaseOrdersBySupplier,
      getPurchaseOrdersByStatus,
      
      // Budget Categories Management
      budgetCategories,
      updateBudgetCategories,
      addBudgetCategory,
      updateBudgetCategory,
      deleteBudgetCategory,
      getBudgetCategorySpent,
      updateBudgetCategorySpent,
      
      // Reservations Management
      reservations,
      updateReservations,
      addReservation,
      updateReservation,
      deleteReservation,
      getReservationsByDate,
      getReservationsByTable,
      getReservationsByStatus,
      syncAllCustomers,

      // Loyalty Program Methods
      calculateLoyaltyTier,
      awardLoyaltyPoints,
      redeemLoyaltyPoints,
      handleReferral,
      generateReferralCode,

      // Staff Management
      staff,
      addStaff,
      updateStaff,
      deleteStaff,

      // Shift Management
      shifts,
      addShift,
      updateShift,
  deleteShift,

      // Salary Management
      salaryPayments,
      addSalaryPayment
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};