import api from './api';

interface OrderItem {
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

interface Order {
    id: string;
    userId: string;
    shopId: string;
    items: OrderItem[];
    totalAmount: number;
    status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    pickupTime: string;
    paymentIntentId: string;
    createdAt: string;
    updatedAt: string;
}

export const orderService = {
    async createOrder(orderData: Omit<Order, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) {
        const response = await api.post<Order>('/orders', orderData);
        return response.data;
    },

    async getOrder(orderId: string) {
        const response = await api.get<Order>(`/orders/${orderId}`);
        return response.data;
    },

    async updateOrderStatus(orderId: string, status: Order['status']) {
        const response = await api.put<{ message: string }>(`/orders/${orderId}/status`, { status });
        return response.data;
    },

    async getUserOrders() {
        const response = await api.get<Order[]>('/orders/user/history');
        return response.data;
    },

    async getShopOrders(shopId: string) {
        const response = await api.get<Order[]>(`/orders/shop/${shopId}`);
        return response.data;
    }
}; 