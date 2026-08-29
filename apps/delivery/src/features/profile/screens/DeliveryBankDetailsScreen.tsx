import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, TextInput, Toast, useConnectivity } from 'foodie-shared-rn';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryBankDetails'>;

export function DeliveryBankDetailsScreen({ navigation }: Props) {
    const { isConnected } = useConnectivity();
    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'error' } | null>(null);

    const onSubmit = () => {
        if (!isConnected) {
            setToast({ message: 'Connect to the internet to save details.', variant: 'error' });
            return;
        }
        if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
            setToast({ message: 'Please fill in all bank details.', variant: 'error' });
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setToast({ message: 'Bank details saved successfully.', variant: 'success' });
            setTimeout(() => navigation.goBack(), 1000);
        }, 1000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#14532D" />
                </Pressable>
                <Text style={styles.screenTitle}>Bank Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <Text style={styles.description}>
                    Enter your bank account details securely to receive payouts.
                </Text>

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Account Holder Name"
                            accessibilityLabel="Bank Account Holder Name"
                            value={accountHolderName}
                            onChangeText={setAccountHolderName}
                            editable={!isLoading}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Account Number"
                            accessibilityLabel="Bank Account Number"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="number-pad"
                            editable={!isLoading}
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="IFSC Code"
                            accessibilityLabel="Bank IFSC Code"
                            value={ifscCode}
                            onChangeText={setIfscCode}
                            autoCapitalize="characters"
                            editable={!isLoading}
                        />
                    </View>
                    <View style={styles.inputGroupLast}>
                        <TextInput
                            label="Bank Name"
                            accessibilityLabel="Bank Name"
                            value={bankName}
                            onChangeText={setBankName}
                            editable={!isLoading}
                        />
                    </View>

                    <Pressable
                        disabled={!isConnected || isLoading}
                        onPress={onSubmit}
                        accessibilityLabel="Save Bank Details"
                        style={({ pressed }) => [
                            styles.submitButton,
                            (!isConnected || isLoading) && { opacity: 0.6 },
                            pressed && { opacity: 0.9 },
                        ]}
                    >
                        <LinearGradient
                            colors={['#14532D', '#1B6A3A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.submitGradient}
                        >
                            <Text style={styles.submitText}>
                                {isLoading ? 'Saving...' : 'Save Bank Details'}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                </View>
            </ScrollView>

            <Toast
                visible={Boolean(toast)}
                message={toast?.message ?? ''}
                variant={toast?.variant ?? 'info'}
                accessibilityLabel={toast?.message ?? 'Toast'}
                onDismiss={() => setToast(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A202C',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    description: {
        fontSize: 15,
        color: '#4B5563',
        marginBottom: 20,
        lineHeight: 22,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputGroupLast: {
        marginBottom: 24,
    },
    submitButton: {
        borderRadius: 16,
        height: 56,
        overflow: 'hidden',
        marginTop: 8,
    },
    submitGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
