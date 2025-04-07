export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    options?: {
        size?: string;
        extras?: string[];
    };
    notes?: string;
}

export interface Order {
    id: string;
    userId: string;
    shopId: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    pickupTime: string;
    createdAt: string;
    updatedAt: string;
}

export type OrderStatus = 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderStatusUpdate {
    status: OrderStatus;
    updatedAt: Date;
    updatedBy: string;
    notes?: string;
}