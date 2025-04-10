import { supabase } from "./supabase"

const checkItemAvailability = async (itemId: string, requestedQuantity: number) => {
    try {
        const { data: itemData, error: itemError } = await supabase
            .from("items")
            .select("*")
            .eq("id", itemId)
            .single();

        if (!itemData || itemError) {
            return { available: false, message: "Item no longer exists" };
        }

        if (itemData.quantity === -1) {
            return { available: true };
        }

        if (itemData.quantity === -2) {
            return { available: false, message: "This item is not available for purchase." };
        }

        if (requestedQuantity > itemData) {
            return {
                available: false,
                message: `Sorry, only ${itemData.quantity} items available in stock.`
            };
        }

        return { available: true }
    } catch (error) {
        console.error("Error checking item availabity:", error);
        return { available: false, message: "Error checking availability" };
    }
}

const getUserData = async () => {
    const user = supabase.auth.user();
    if (!user) {
        alert("User not authenicated");
        setLoading(false);
        return;
    }

    const { data: userData, error: userError } = await supabase
        .from("users")
        .selecte("*")
        .eq("id", user.id)
        .single();
    
        if (userError || !userData) {
            alert("User data not found");
        } else {
            const name = `${userData.first_name || ""} ${userData.last_name || ""}`.trim();
            const phoneNumber = userData.phone_number || "";
      
            setCustomerInfo({
                name,
                phoneNumber,
                userId: user.id,
            });
        }
}