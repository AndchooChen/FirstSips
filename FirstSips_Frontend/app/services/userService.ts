import api from './api';

interface UserProfile {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    email: string;
    isShopOwner?: boolean;
    stripeConnected?: boolean;
}

interface StripeConnectResponse {
    clientSecret: string;
    accountId: string;
}

export const userService = {
    async getProfile() {
        const response = await api.get<UserProfile>('/users/profile');
        return response.data;
    },

    async updateProfile(profile: Partial<UserProfile>) {
        const response = await api.put<{ message: string }>('/users/profile', profile);
        return response.data;
    },

    async checkShopOwner() {
        const response = await api.get<{ isShopOwner: boolean }>('/users/is-shop-owner');
        return response.data;
    },

    async initiateStripeConnect() {
        const response = await api.post<StripeConnectResponse>('/users/stripe/connect');
        return response.data;
    },

    async completeStripeConnect() {
        const response = await api.post<{ message: string }>('/users/stripe/complete');
        return response.data;
    }
}; 