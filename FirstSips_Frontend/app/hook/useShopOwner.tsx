import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

export const useShopOwner = (userID: string) => {
    const [isShopOwner, setIsShopOwner] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkShopOwner = async () => {
            try {
                const { isShopOwner: ownerStatus } = await userService.checkShopOwner();
                setIsShopOwner(ownerStatus);
            } catch (error) {
                console.error("Error checking shop owner status: ", error);
            } finally {
                setLoading(false);
            }
        };

        if (userID) {
            checkShopOwner();
        }
    }, [userID]);

    return { isShopOwner, loading };
};