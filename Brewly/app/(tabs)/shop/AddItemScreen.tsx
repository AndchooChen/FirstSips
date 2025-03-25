export const createItem = async (shopId: string, itemData: Omit<Item, 'itemId' | 'shopId' | 'createdAt'>) => {
    try {
        const itemRef = doc(collection(FIREBASE_DB, `shops/${shopId}/items`));
        
        await setDoc(itemRef, {
            ...itemData,
            itemId: itemRef.id,
            shopId,
            createdAt: new Date().toISOString()
        });

        return itemRef.id;
    } catch (error) {
        console.error('Error creating item:', error);
        throw error;
    }
};