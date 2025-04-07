import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { FIREBASE_AUTH } from '../auth/FirebaseConfig';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.50.84:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token
api.interceptors.request.use(async (config: AxiosRequestConfig) => {
    const user = FIREBASE_AUTH.currentUser;
    if (user) {
        const token = await user.getIdToken();
        if (config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, (error: AxiosError) => {
    return Promise.reject(error);
});

// Add a response interceptor to handle errors
api.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('API Error:', error.response.data);
            return Promise.reject(error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network Error:', error.request);
            return Promise.reject({ error: 'Network error occurred' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Request Error:', error.message);
            return Promise.reject({ error: 'Request failed' });
        }
    }
);

export default api; 