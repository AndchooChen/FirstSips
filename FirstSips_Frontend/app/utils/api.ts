import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api';

export const api = {
    get: async (endpoint: string) => {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = await AsyncStorage.getItem('userToken');
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            throw new Error('API request failed');
        }
        return response.json();
    }
};