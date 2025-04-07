export interface Shop {
    id: string;
    shopName: string;
    description: string;
    location: string;
    profileImage?: string;
    isOpen: boolean;
    ownerId: string;
    deliveryMethod: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShopItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    quantity: number;
    images?: string[];
} 