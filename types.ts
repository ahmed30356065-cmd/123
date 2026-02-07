
export type Role = 'admin' | 'merchant' | 'driver' | 'supervisor' | 'customer';

export type SupervisorPermission =
  | 'view_orders'
  | 'manage_orders'
  | 'delete_orders'
  | 'view_users'
  | 'manage_users'
  | 'view_wallet'
  | 'view_reports'
  | 'view_logs'
  | 'manage_promo'
  | 'send_messages'
  | 'manage_stores'
  | 'manage_slider'
  | 'manage_support'
  | 'delete_support_messages'
  | 'manage_decorations' // Added permission for managing frames and badges
  | 'manage_supervisors' // Added check for managing other supervisors
  | 'manage_advanced_financials'; // NEW: Full control over payments and prices

export interface ProductSize {
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
  available: boolean;
  sizes?: ProductSize[];
}

export interface CartItem extends Product {
  quantity: number;
  merchantId?: string;
  selectedSize?: ProductSize;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string;
  // Added 'blocked' status
  status: 'active' | 'pending' | 'inactive' | 'blocked' | 'suspended';
  phone?: string;
  email?: string;
  addresses?: string[];
  address?: string;
  createdAt: Date;
  commissionRate?: number;
  commissionType?: 'percentage' | 'fixed';
  dailyLogStatus?: 'active' | 'closed';
  incentivesActive?: boolean;
  permissions?: SupervisorPermission[];
  appointedBy?: string;
  dailyLogMode?: '12_hour' | 'always_open';
  dailyLogStartedAt?: Date;
  fcmToken?: string;
  maxConcurrentOrders?: number;
  pointsBalance?: number;
  storeName?: string;
  storeCategory?: string;
  storeImage?: string;
  products?: Product[];
  workingHours?: {
    start: string;
    end: string;
  };
  hasFreeDelivery?: boolean;
  responseTime?: string;
  // Merchant Permissions
  canShowDeliveryTime?: boolean;
  canManageMenu?: boolean;
  canManageOrderDetails?: boolean; // Added: Control "Payment/OrderNo" features
  canManageAdvancedFinancials?: boolean; // NEW: Advanced Payment Control Panel
  // Fixed Delivery Fee Settings
  isFixedDeliveryFeeEnabled?: boolean;
  fixedDeliveryFee?: number;
  // Decoration (Updated to allow strings for extended collection)
  specialFrame?: string;
  specialBadge?: string;
  // Expiry dates for decorations
  specialBadgeExpiry?: string | null;
  waterSortLevel?: number; // Game Progress Persistence
}

export interface Customer {
  phone: string;
  address: string;
  name?: string;
}

export enum OrderStatus {
  WaitingMerchant = 'بانتظار التاجر',
  Preparing = 'جاري التحضير',
  Ready = 'تم التجهيز',
  Pending = 'قيد الانتظار',
  InTransit = 'قيد التوصيل',
  Delivered = 'تم التوصيل',
  Cancelled = 'تم الإلغاء/الرفض',
}

export interface MonthlyReport {
  id: string;
  month: number; // 0-11
  year: number;
  monthLabel: string; // e.g., "فبراير 2024" - for display
  totalRevenue: number;
  totalDeliveryFees: number;
  totalAppProfit: number;
  adminShare: number; // 15% of app profit
  totalDriverPayouts: number;
  createdAt: Date;
  archivedOrdersCount: number;
  deliveredOrdersCount: number;
  cancelledOrdersCount: number;
  lastRegularOrderId: string; // Last ORD- ID before reset
  lastShoppingOrderId: string; // Last S- ID before reset
  walletSnapshots: Record<string, {
    name: string;
    role: Role;
    balance: number;
    ordersCount: number;
  }>;
  archivedBy: string; // Admin user ID who performed the archive
}


export interface Order {
  id: string;
  userId: string;
  userName: string;
  merchantId: string;
  merchantName: string;
  items: CartItem[];
  totalPrice: number;
  originalPrice?: number; // Pre-discount price
  discount?: number; // Discount amount
  status: OrderStatus;
  deliveryFee?: number;
  regionPrice?: number;
  type?: 'delivery_request' | 'shopping_order' | string; // Fix: Added missing type field
  createdAt: Date;
  deliveryLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  driverId?: string; // Assigned Driver
  driverName?: string;
  notes?: string;
  rating?: number;
  customerPhone?: string;
  deliveredAt?: Date; // For reporting
  isArchived?: boolean; // For monthly reset
  archiveMonth?: string; // e.g., "فبراير 2024" - displayed with order ID after archiving

  // New Fields for Merchant Feature
  customOrderNumber?: string;
  paymentStatus?: 'paid' | 'unpaid';
  isVodafoneCash?: boolean;
  isCollected?: boolean;
  paidAmount?: number; // Amount paid
  unpaidAmount?: number; // Amount unpaid
  cashAmount?: number; // Cash amount (Vodafone Cash)
  reconciled?: boolean; // Payment reconciliation status
  customer?: Customer;
}

export interface Message {
  id: string;
  text: string;
  image?: string;
  targetRole: 'driver' | 'merchant' | 'customer';
  targetId: 'all' | 'multiple' | string;
  createdAt: Date;
  readBy?: string[];
  deletedBy?: string[];
}

export interface Payment {
  id: string;
  driverId: string;
  amount: number;
  createdAt: Date;
  reconciledOrderIds: string[];
  ordersCount?: number;
  totalCollected?: number;
}

export interface SliderImage {
  id: string;
  url: string;
  active?: boolean;
  createdAt?: Date;
  linkedMerchantId?: string;
  linkedCategoryId?: string;
  textOverlay?: string;
}

export interface SliderConfig {
  isEnabled: boolean;
}

export interface CategoryItem {
  id: string;
  key: string;
  label: string;
  icon?: string;
  isVisible: boolean;
  sortOrder: number;
}

export interface AppTheme {
  driver: { icons: Record<string, string>; mode?: 'dark' | 'light'; };
  merchant: { icons: Record<string, string>; mode?: 'dark' | 'light'; };
  admin?: { mode?: 'dark' | 'light'; };
  customer: {
    icons: Record<string, string>;
    mode?: 'light' | 'dark';
    layout?: { merchantCardStyle?: 'default' | 'modern' | 'minimal' | 'neon' | 'elegant' | 'grid' | 'compact' };
    categories?: CategoryItem[];
  };
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actionType: 'create' | 'update' | 'delete' | 'login' | 'financial';
  target: string;
  details: string;
  createdAt: Date;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  isActive: boolean;
  expiryDate?: Date;
  usageCount: number;
  maxUsage?: number;
}

// --- Support Chat Types ---
export interface ChatMessage {
  id: string;
  text: string;
  image?: string;
  audio?: string; // Added for Voice Notes
  sender: 'user' | 'admin';
  createdAt: Date;
  isRead: boolean;
  reactions?: string[]; // Array of emoji URLs
}

export interface SupportChat {
  id: string; // userId
  userId: string;
  userName: string;
  userPhone: string;
  lastMessage?: string;
  lastUpdated: Date;
  unreadCount: number; // For admin
  messages: ChatMessage[];
}

export interface SupportConfig {
  whatsappNumber: string;
  isWhatsappEnabled: boolean;
  isChatEnabled: boolean; // Updated: Controls the in-app chat feature
  allowImageSending?: boolean;
  allowVoiceNotes?: boolean;
  // Auto Reply Settings
  isAutoReplyEnabled?: boolean;
  autoReplyText?: string;
}

// --- App Config (Name, Version, Font) ---
export interface AppConfig {
  appName: string;
  appVersion: string;
  customFont?: string; // Base64 encoded TTF
  isGamesEnabled?: boolean; // Global Toggle for Games Feature
  games?: Game[]; // List of active games
}

// --- Update Configuration ---
export interface UpdateConfig {
  id: string;
  version: string;
  url: string;
  type: 'apk' | 'link';
  description?: string;
  notes?: string;
  isActive: boolean;
  forceUpdate?: boolean;
  releaseDate?: Date;
  target_roles?: string[];
}

// --- Games Feature ---
export interface Game {
  id: string;
  name: string;
  image: string;
  url: string;
  isActive: boolean;
  createdAt?: Date;
  playCount?: number;
}

export interface UpdateLog {
  id: string;
  version: string;
  releaseDate?: string | Date;
  notes?: string;
  isActive: boolean;
  roles?: string[];
  url?: string;
}
