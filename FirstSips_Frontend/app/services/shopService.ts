import api from './api';
import { Shop } from '../types/shop';
import { ShopItem } from '../types/shop';

export const shopService = {
    async createShop(shopData: Omit<Shop, 'id' | 'ownerId' | 'isOpen'>) {
        const response = await api.post<Shop>('/shops', shopData);
        return response.data;
    },

    async getShop(shopId: string) {
        const response = await api.get<Shop>(`/shops/${shopId}`);
        return response.data;
    },

    async getAllShops() {
        const response = await api.get<Shop[]>('/shops');
        return response.data;
    },

    async updateShop(shopId: string, shopData: Partial<Omit<Shop, 'id' | 'ownerId'>>) {
        const response = await api.put<{ message: string }>(`/shops/${shopId}`, shopData);
        return response.data;
    },

    async toggleShopStatus(shopId: string) {
        const response = await api.post<{ isOpen: boolean }>(`/shops/${shopId}/toggle-status`);
        return response.data;
    },

    async getShopItems(shopId: string) {
        const response = await api.get<ShopItem[]>(`/shops/${shopId}/items`);
        return response.data;
    },

    async addItem(shopId: string, itemData: Omit<ShopItem, 'id'>) {
        const response = await api.post<ShopItem>(`/shops/${shopId}/items`, itemData);
        return response.data;
    },

    async updateItem(shopId: string, itemId: string, itemData: Partial<Omit<ShopItem, 'id'>>) {
        const response = await api.put<{ message: string }>(`/shops/${shopId}/items/${itemId}`, itemData);
        return response.data;
    },

    async deleteItem(shopId: string, itemId: string) {
        const response = await api.delete<{ message: string }>(`/shops/${shopId}/items/${itemId}`);
        return response.data;
    }
}; 