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
    shopId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    imageUrl?: string;
    createdAt: string;
<<<<<<< HEAD
<<<<<<< HEAD
}

type Order = {
    orderId: string;
    userId: string;
    shopId: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
    status: 'pending' | 'paid' | 'preparing' | 'ready' | 'completed' | 'cancelled';
    total: number;
    tax: number;
    deliveryFee?: number;
    isDelivery: boolean;
    deliveryAddress?: string;
    pickupTime: string;
    phoneNumber: string;
    createdAt: string;
    updatedAt: string;
  };
=======
}
>>>>>>> LoginRedesign
=======
}
>>>>>>> 68fb1e5fa391f1bdac2f665bb27bc781ec148f7d
