export type DarkstoreOrderStatus =
  | 'NEW'
  | 'ACCEPTED'
  | 'PICKING'
  | 'PACKING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderPriority = 'NORMAL' | 'HIGH' | 'EXPRESS';

export type PickupStatus = 'WAITING_FOR_PARTNER' | 'ARRIVED_AT_GATE' | 'DISPATCHED';

export type StaffRole = 'DARKSTORE_MANAGER' | 'PICKER' | 'PACKER' | 'INVENTORY_STAFF';

export interface DarkstoreOrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  imageUrl?: string;
  shelfLocation: string;
  quantityRequested: number;
  quantityPicked: number;
  unitPrice: number;
  status: 'PENDING' | 'PICKED' | 'UNAVAILABLE' | 'SUBSTITUTED';
}

export interface DarkstoreOrder {
  id: string;
  orderNumber: string;
  darkstoreId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  status: DarkstoreOrderStatus;
  priority: OrderPriority;
  assignedPicker?: string;
  assignedPacker?: string;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  pickupStatus: PickupStatus;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
  items: DarkstoreOrderItem[];
}

export interface DarkstoreProduct {
  id: string;
  darkstoreId: string;
  sku: string;
  name: string;
  category: string;
  imageUrl?: string;
  price: number;
  sellingPrice: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  minThreshold: number;
  unit: string;
  taxPercent: number;
  shelfLocation: string;
  status: 'ACTIVE' | 'INACTIVE';
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DarkstoreInventoryTx {
  id: string;
  darkstoreProductId: string;
  txType: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT' | 'ORDER_RESERVE' | 'ORDER_PICK';
  quantity: number;
  reason?: string;
  createdBy: string;
  createdAt: string;
}

export interface DarkstoreStaff {
  id: string;
  darkstoreId: string;
  name: string;
  phone: string;
  email: string;
  role: StaffRole;
  status: 'ACTIVE' | 'INACTIVE';
  activeTasksCount: number;
  loginStatus: 'ONLINE' | 'OFFLINE' | 'ON_BREAK';
  createdAt: string;
}

export interface DarkstoreProfile {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  deliveryRadiusKm: number;
  serviceableAreas: string;
  openTime: string;
  closeTime: string;
  staffCount: number;
  activeOrdersCount: number;
  totalProductsCount: number;
}

export interface DarkstoreMetrics {
  totalOrders: number;
  newOrders: number;
  ordersBeingPicked: number;
  ordersReadyForDispatch: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalProducts: number;
  todaysRevenue: number;
  averageOrderValue: number;
  pendingActionsCount: number;
}

export interface DarkstoreNotification {
  id: string;
  title: string;
  message: string;
  type: 'NEW_ORDER' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DELAY' | 'CANCELLATION' | 'DRIVER_ASSIGNED';
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  read: boolean;
  timestamp: string;
}
