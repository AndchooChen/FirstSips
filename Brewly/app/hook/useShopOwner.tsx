import { useState, useEffect } from 'react';
import { FIREBASE_DB } from '../auth/FirebaseConfig';
import { doc, getDoc } from  'firebase/firestore';

export const useShopOwner = (userID: string) => {
    const [isShopOwner, setIsShopOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkShopOwner = async () => {
            try {
                const userDoc = await getDoc(doc(FIREBASE_DB, "users", userID));
                if (userDoc.exists()) {
                    setIsShopOwner(userDoc.data().isShopOwner);
                }
            } catch (error) {
                console.error("Error checking shop owner status: ", error);
            } finally {
                setLoading(false);
            }
        };

        if (userID) {
            checkShopOwner();
        }
    }, [userID])

    return { isShopOwner, loading };
};