import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/app/utils/supabase';

interface OwnerInfo {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
}

export default function OwnerInfoScreen() {
    const { owner_id } = useLocalSearchParams();
    const [ownerInfo, setOwnerInfo] = useState<OwnerInfo | null>(null);
    const router = useRouter();

    useEffect(() => {
        const getOwnerInfo = async () => {
            console.log(owner_id);
            if (!owner_id) return;

            try {
                const { data: ownerData, error: ownerError } = await supabase
                    .from("users")
                    .select("first_name, last_name, phone_number, email")
                    .eq("id", owner_id)
                    .single();

                if (ownerError) {
                    console.error('Error fetching owner info:', ownerError);
                    return;
                }
                if (ownerData) {
                    setOwnerInfo(ownerData as OwnerInfo);
                }

            } catch (error) {
                console.error('Error fetching owner info:', error);
            }
        };

        getOwnerInfo();
    }, [owner_id]);

    return (
        <View style={styles.container}>
            {/* Header with back button */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={24} color="#6F4E37" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Owner Information</Text>
            </View>

            {ownerInfo ? (
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person" size={24} color="#6F4E37" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.label}>Name</Text>
                            <Text style={styles.value}>
                                {ownerInfo.first_name} {ownerInfo.last_name}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="call" size={24} color="#6F4E37" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Text style={styles.value}>{ownerInfo.phone_number}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="mail" size={24} color="#6F4E37" />
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.label}>Email</Text>
                            <Text style={styles.value}>{ownerInfo.email}</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text>Loading owner information...</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5EDD8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        marginTop: 40,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#6F4E37',
        marginLeft: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        padding: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    infoTextContainer: {
        marginLeft: 16,
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#6F4E37',
        fontWeight: '500',
    },
});
