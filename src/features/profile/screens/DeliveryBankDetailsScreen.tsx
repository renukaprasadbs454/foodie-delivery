import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { TextInput } from '@/components/TextInput';
import { Toast } from '@/components/Toast';
import { useConnectivity } from '@/hooks/useConnectivity';
import {
    useGetDeliveryBankDetailsQuery,
    useUpsertDeliveryBankDetailsMutation,
} from '@/api/endpoints/deliveryApi';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'DeliveryBankDetails'>;

export function DeliveryBankDetailsScreen({ navigation }: Props) {
    const { isConnected } = useConnectivity();
    const { data: bankDetails, isLoading: isFetching, refetch } = useGetDeliveryBankDetailsQuery();
    const [upsertBankDetails, { isLoading: isSaving }] = useUpsertDeliveryBankDetailsMutation();

    const [accountHolderName, setAccountHolderName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [ifscCode, setIfscCode] = useState('');
    const [bankName, setBankName] = useState('');
    const [branchName, setBranchName] = useState('');
    const [accountType, setAccountType] = useState('SAVINGS');
    const [toast, setToast] = useState<{ message: string; variant: 'info' | 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (bankDetails) {
            setAccountHolderName(bankDetails.accountHolderName || '');
            setAccountNumber(bankDetails.accountNumber || '');
            setIfscCode(bankDetails.ifscCode || '');
            setBankName(bankDetails.bankName || '');
            setBranchName(bankDetails.branchName || '');
            setAccountType(bankDetails.accountType || 'SAVINGS');
        }
    }, [bankDetails]);

    const onSubmit = async () => {
        if (!isConnected) {
            setToast({ message: 'Connect to the internet to save details.', variant: 'error' });
            return;
        }

        const trimmedName = accountHolderName.trim();
        const trimmedAcc = accountNumber.trim();
        const trimmedIfsc = ifscCode.trim().toUpperCase();
        const trimmedBank = bankName.trim();

        if (!trimmedName || !trimmedAcc || !trimmedIfsc || !trimmedBank) {
            setToast({ message: 'Please fill in all required bank details.', variant: 'error' });
            return;
        }

        if (!/^[0-9]{9,18}$/.test(trimmedAcc)) {
            setToast({ message: 'Account number must be 9 to 18 digits.', variant: 'error' });
            return;
        }

        if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(trimmedIfsc)) {
            setToast({ message: 'Invalid IFSC format. Example: SBIN0001234', variant: 'error' });
            return;
        }

        try {
            await upsertBankDetails({
                accountHolderName: trimmedName,
                accountNumber: trimmedAcc,
                ifscCode: trimmedIfsc,
                bankName: trimmedBank,
                branchName: branchName.trim(),
                accountType: accountType.trim() || 'SAVINGS',
            }).unwrap();

            setToast({ message: 'Bank details saved successfully.', variant: 'success' });
            refetch();
            setTimeout(() => navigation.goBack(), 1200);
        } catch (err: any) {
            const errMsg = err?.data?.error?.message || err?.data?.message || 'Failed to save bank details. Please try again.';
            setToast({ message: errMsg, variant: 'error' });
        }
    };

    const status = bankDetails?.verificationStatus;

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
                    Enter your bank account details securely to receive weekly payout settlements.
                </Text>

                {status && (
                    <View
                        style={[
                            styles.statusBanner,
                            status === 'VERIFIED'
                                ? styles.bannerVerified
                                : status === 'REJECTED'
                                ? styles.bannerRejected
                                : styles.bannerPending,
                        ]}
                    >
                        <Feather
                            name={status === 'VERIFIED' ? 'check-circle' : status === 'REJECTED' ? 'x-circle' : 'clock'}
                            size={20}
                            color={status === 'VERIFIED' ? '#065F46' : status === 'REJECTED' ? '#991B1B' : '#92400E'}
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text
                                style={[
                                    styles.statusBannerTitle,
                                    { color: status === 'VERIFIED' ? '#065F46' : status === 'REJECTED' ? '#991B1B' : '#92400E' },
                                ]}
                            >
                                Status: {status}
                            </Text>
                            {status === 'REJECTED' && bankDetails?.rejectionReason && (
                                <Text style={styles.statusBannerSub}>Reason: {bankDetails.rejectionReason}</Text>
                            )}
                            {status === 'VERIFIED' && (
                                <Text style={styles.statusBannerSub}>Your bank details have been verified by Admin.</Text>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.card}>
                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Account Holder Name *"
                            accessibilityLabel="Bank Account Holder Name"
                            value={accountHolderName}
                            onChangeText={setAccountHolderName}
                            editable={!isSaving && !isFetching}
                            placeholder="e.g. Vikram Choudhary"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Account Number *"
                            accessibilityLabel="Bank Account Number"
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            keyboardType="number-pad"
                            editable={!isSaving && !isFetching}
                            placeholder="9 to 18 digit account number"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <TextInput
                            label="IFSC Code *"
                            accessibilityLabel="Bank IFSC Code"
                            value={ifscCode}
                            onChangeText={text => setIfscCode(text.toUpperCase())}
                            autoCapitalize="characters"
                            editable={!isSaving && !isFetching}
                            placeholder="e.g. SBIN0001234"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <TextInput
                            label="Bank Name *"
                            accessibilityLabel="Bank Name"
                            value={bankName}
                            onChangeText={setBankName}
                            editable={!isSaving && !isFetching}
                            placeholder="e.g. State Bank of India"
                        />
                    </View>

                    <View style={styles.inputGroupLast}>
                        <TextInput
                            label="Branch Name (Optional)"
                            accessibilityLabel="Branch Name"
                            value={branchName}
                            onChangeText={setBranchName}
                            editable={!isSaving && !isFetching}
                            placeholder="e.g. Tumkur Main Branch"
                        />
                    </View>

                    <Pressable
                        disabled={!isConnected || isSaving || isFetching}
                        onPress={onSubmit}
                        accessibilityLabel="Save Bank Details"
                        style={({ pressed }) => [
                            styles.submitButton,
                            (!isConnected || isSaving || isFetching) && { opacity: 0.6 },
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
                                {isSaving ? 'Saving to Database...' : isFetching ? 'Loading...' : 'Save Bank Details'}
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
        marginBottom: 16,
        lineHeight: 22,
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
        marginBottom: 20,
        borderWidth: 1,
    },
    bannerVerified: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0',
    },
    bannerPending: {
        backgroundColor: '#FEF3C7',
        borderColor: '#FDE68A',
    },
    bannerRejected: {
        backgroundColor: '#FEE2E2',
        borderColor: '#FCA5A5',
    },
    statusBannerTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    statusBannerSub: {
        fontSize: 12,
        color: '#4B5563',
        marginTop: 2,
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
