export const formatBirthday = (text: string, setBirthday: (value: string) => void) => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = cleaned;
    if (cleaned.length >= 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    } else if (cleaned.length >= 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    }

    const month = parseInt(formatted.slice(0, 2));
    const day = parseInt(formatted.slice(3, 5));
    
    if (month > 12) setBirthday('12' + formatted.slice(2));
    if (day > 31) setBirthday(formatted.slice(0, 3) + '31' + formatted.slice(5));
    
    return formatted;
};

export const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    let formatted = cleaned;
    if (cleaned.length >= 6) {
        formatted = `(${cleaned.slice(0, 3)})${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
        formatted = `(${cleaned.slice(0, 3)})${cleaned.slice(3)}`;
    } else if (cleaned.length > 0) {
        formatted = `(${cleaned}`;
    }
    
    return formatted;
};

export const validateForm = (
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phoneNumber: string
) => {
    if (!firstName || !lastName || !email || !password || !phoneNumber) {
        alert('Please fill in all fields');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return false;
    }

    const phoneRegex = /^\(\d{3}\)\d{3}-\d{4}$/;
    if (!phoneRegex.test(phoneNumber)) {
        alert('Please enter a valid phone number');
        return false;
    }

    return true;
};