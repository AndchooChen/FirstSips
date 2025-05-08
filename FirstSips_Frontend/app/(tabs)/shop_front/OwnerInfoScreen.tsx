import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/utils/supabase'; // Ensure correct path

interface OwnerInfo {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
}

export default function OwnerInfoScreen() {
    const { owner_id } = useLocalSearchParams();
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
    const [loading, setLoading] = useState(true); // Add loading state
    const router = useRouter();

    useEffect(() => {
        const getOwnerInfo = async () => {
            setLoading(true);
            console.log("Fetching owner info for ID:", owner_id);
            if (!owner_id || typeof owner_id !== 'string') {
                console.error('Invalid or missing owner_id');
                Alert.alert("Error", "Could not load owner information (Invalid ID).");
                setLoading(false);
                router.back(); // Go back if ID is invalid
                return;
            }

            try {
                const { data: ownerData, error: ownerError } = await supabase
                    .from("users")
                    .select("first_name, last_name, phone_number, email")
                    .eq("id", owner_id)
                    .single();

                if (ownerError) {
                    console.error('Error fetching owner info:', ownerError);
                    Alert.alert("Error", "Could not fetch owner details.");
                    setLoading(false);
                    return;
                }
                if (ownerData) {
                    setOwnerInfo(ownerData as OwnerInfo);
                } else {
                    Alert.alert("Not Found", "Owner details not found.");
                }

            } catch (error: any) {
                console.error('Unexpected error fetching owner info:', error.message);
                Alert.alert("Error", "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        getOwnerInfo();
    }, [owner_id, router]); // Add router to dependency array

    // Info Row Component
    const InfoRow = ({ iconName, label, value }: { iconName: keyof typeof Ionicons.glyphMap; label: string; value: string }) => (
        <View style={styles.infoRow}>
            <Ionicons name={iconName} size={22} color="#6F4E37" style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value || 'N/A'}</Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#555555" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Owner Information</Text>
                <View style={styles.headerSpacer} /> {/* For centering title */}
            </View>

            {/* Content */}
            <View style={styles.contentContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#6F4E37" style={styles.loadingIndicator} />
                ) : ownerInfo ? (
                    <>
                        <InfoRow iconName="person-outline" label="Name" value={`${ownerInfo.first_name} ${ownerInfo.last_name}`} />
                        <InfoRow iconName="call-outline" label="Phone Number" value={ownerInfo.phone_number} />
                        <InfoRow iconName="mail-outline" label="Email" value={ownerInfo.email} />
                    </>
                ) : (
                    <Text style={styles.emptyText}>Owner information not available.</Text>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#EEEEEE',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
    },
    headerSpacer: {
        width: 40, // Match back button touch area
    },
    contentContainer: {
        flex: 1, // Take remaining space
        padding: 16,
    },
    loadingIndicator: {
        marginTop: 50, // Space from header
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF', // White background for row
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
        // Add subtle border
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    infoIcon: {
        marginRight: 16, // Space between icon and text
    },
    infoTextContainer: {
        flex: 1, // Allow text to take remaining space
    },
    label: {
        fontSize: 14,
        color: '#888888', // Lighter grey for label
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#333333', // Dark grey for value
        fontWeight: '500', // Medium weight
    },
    emptyText: {
        textAlign: 'center',
        color: '#888888',
        marginTop: 50,
        fontSize: 16,
    },
});
