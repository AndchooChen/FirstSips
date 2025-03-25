export interface User {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    birthday: string;
    isShopOwner: boolean;
    shopId?: string;  // Optional because not all users are shop owners
    createdAt: string;
}

export interface Shop {
    shopId: string;
    ownerId: string;
    shopName: string;
    description: string;
    location: string;
    createdAt: string;
}