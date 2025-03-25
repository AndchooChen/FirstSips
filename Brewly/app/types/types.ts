export interface User {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    isShopOwner: boolean;
    shopId?: string;
    createdAt: string;
}

export interface Shop {
    shopId: string;
    ownerId: string;
    shopName: string;
    description: string;
    streetAddress: string;
    optional?: string;
    city: string;
    state: string;
    zipCode: string;
    deliveryMethod: 'pickup' | 'delivery' | 'both';
    createdAt: string;
}

export interface Item {
    itemId: string;
    shopId: string;  // References shop.shopId
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    createdAt: string;
}