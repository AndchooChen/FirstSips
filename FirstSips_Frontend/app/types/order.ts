export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
}

export interface Order {
    orderId: string;
    customerId: string;
    shopId: string;
    items: OrderItem[];
    
    customerPhone: string;
    customerName: string;
    
    totalAmount: number;
    paymentStatus: 'pending' | 'completed' | 'failed';
    paymentIntentId: string;
    
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    
    createdAt: Date;
    updatedAt: Date;
    pickupTime: string;
    
    isDelivery: boolean;
    deliveryAddress?: string;
    deliveryInstructions?: string;
    
    estimatedPrepTime: number;
    acceptedBy?: string;
    notes?: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderStatusUpdate {
    status: OrderStatus;
    updatedAt: Date;
    updatedBy: string;
    notes?: string;
}