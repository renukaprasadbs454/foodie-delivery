import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { Text, formatMoneyInr, trackAnalyticsEvent } from 'foodie-shared-rn';
import { useGetPayoutDetailQuery } from '../../../api/endpoints/walletApi';
import type { MainStackParamList } from '../../../navigation/types';
import type { PayoutStatus } from '../types';

function formatDate(isoString?: string): string {
    if (!isoString) return 'Pending';
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

type Props = NativeStackScreenProps<MainStackParamList, 'PayoutDetail'>;

function getStatusColor(status: PayoutStatus) {
    switch (status) {
        case 'SUCCESS':
            return { text: '#10B981', bg: '#D1FAE5', icon: 'check-circle' };
        case 'FAILED':
            return { text: '#EF4444', bg: '#FEE2E2', icon: 'x-circle' };
        case 'PROCESSING':
            return { text: '#F59E0B', bg: '#FEF3C7', icon: 'clock' };
        case 'REQUESTED':
        default:
            return { text: '#3B82F6', bg: '#DBEAFE', icon: 'arrow-up-circle' };
    }
}

export function PayoutDetailScreen({ route, navigation }: Props) {
    const { payoutId } = route.params;

    const { data, isLoading, isError, refetch } = useGetPayoutDetailQuery(payoutId, {
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        trackAnalyticsEvent('payout_detail_viewed', { payoutId });
    }, [payoutId]);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1A202C" />
                    </Pressable>
                    <Text style={styles.screentTitle}>Payout Details</Text>
                </View>
                <View style={styles.center}>
                    <Text style={{ color: '#718096' }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isError || !data) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.headerRow}>
                    <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="arrow-left" size={24} color="#1A202C" />
                    </Pressable>
                    <Text style={styles.screentTitle}>Payout Details</Text>
                </View>
                <View style={styles.center}>
                    <Feather name="alert-triangle" size={48} color="#A0AEC0" />
                    <Text style={styles.errorTitle}>Error Loading Payout</Text>
                    <Text style={styles.errorSubtitle}>Could not load payout info.</Text>
                    <Pressable onPress={() => refetch()} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const statusInfo = getStatusColor(data.status);
    const providerDisplay = data.provider
        ? 'Payment Processor'
        : 'Unknown Provider'; // Show provider-independent messages

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerRow}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#14532D" />
                </Pressable>
                <Text style={styles.screentTitle}>Payout Details</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                <View style={styles.amountCard}>
                    <View style={[styles.iconCircleLg, { backgroundColor: statusInfo.bg }]}>
                        <Feather name={statusInfo.icon as keyof typeof Feather.glyphMap} size={32} color={statusInfo.text} />
                    </View>
                    <Text style={styles.amountLabel}>Withdrawal Amount</Text>
                    <Text style={styles.amountValue}>{formatMoneyInr(Number(data.amount) || 0)}</Text>

                    <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                        <Text style={[styles.statusText, { color: statusInfo.text }]}>
                            {data.status}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Transaction Info</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payout ID</Text>
                        <Text style={styles.detailValue}>{data.payoutId}</Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Requested Date</Text>
                        <Text style={styles.detailValue}>
                            {data.requestedDate ? formatDate(data.requestedDate) : 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Processed Date</Text>
                        <Text style={styles.detailValue}>
                            {data.processedDate ? formatDate(data.processedDate) : 'Pending'}
                        </Text>
                    </View>
                </View>

                <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>Provider Details</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Processor</Text>
                        <Text style={styles.detailValue}>{providerDisplay}</Text>
                    </View>

                    {(data.transactionId || data.providerReference) && <View style={styles.divider} />}

                    {data.transactionId && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Transaction ID</Text>
                            <Text style={styles.detailValue}>{data.transactionId}</Text>
                        </View>
                    )}

                    {data.providerReference && data.providerReference !== data.transactionId && (
                        <>
                            {data.transactionId && <View style={styles.divider} />}
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Reference ID</Text>
                                <Text style={styles.detailValue}>{data.providerReference}</Text>
                            </View>
                        </>
                    )}

                    {data.status === 'FAILED' && data.failureReason && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.errorBanner}>
                                <Feather name="alert-circle" size={16} color="#B91C1C" />
                                <Text style={styles.errorText}>{data.failureReason}</Text>
                            </View>
                        </>
                    )}
                </View>

            </ScrollView>
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
    screentTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A202C',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1A202C',
        marginTop: 16,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginTop: 8,
        marginBottom: 24,
    },
    retryButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#14532D',
        borderRadius: 8,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '700',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    amountCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconCircleLg: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    amountLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    amountValue: {
        fontSize: 40,
        fontWeight: '900',
        color: '#1A202C',
        marginBottom: 16,
    },
    statusBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailsCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: '#1A202C',
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: '#F1F5F9',
        marginVertical: 8,
    },
    errorBanner: {
        flexDirection: 'row',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 12,
        marginTop: 8,
        alignItems: 'center',
    },
    errorText: {
        marginLeft: 8,
        color: '#B91C1C',
        fontSize: 14,
        flex: 1,
    },
});
