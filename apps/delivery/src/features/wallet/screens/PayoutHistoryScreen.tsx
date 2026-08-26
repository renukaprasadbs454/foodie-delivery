import React, { useEffect } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    View,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import {
    Text,
    formatMoneyInr,
    trackAnalyticsEvent,
    useConnectivity,
} from 'foodie-shared-rn';
import { useGetPayoutHistoryQuery } from '../../../api/endpoints/walletApi';
import type { MainStackParamList } from '../../../navigation/types';
import type { PayoutInfo, PayoutStatus } from '../types';

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

type Props = NativeStackScreenProps<MainStackParamList, 'PayoutHistory'>;

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

function PayoutRow({ entry, onPress }: { entry: PayoutInfo; onPress: () => void }) {
    const statusInfo = getStatusColor(entry.status);
    const displayDate = entry.requestedDate || entry.date || new Date().toISOString();

    return (
        <Pressable
            style={({ pressed }) => [
                rowStyles.container,
                pressed && { opacity: 0.8 },
            ]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Payout ${entry.payoutId}`}
        >
            <View style={[rowStyles.iconCircle, { backgroundColor: statusInfo.bg }]}>
                <Feather name={statusInfo.icon as keyof typeof Feather.glyphMap} size={20} color={statusInfo.text} />
            </View>
            <View style={rowStyles.content}>
                <Text style={rowStyles.amount}>{formatMoneyInr(Number(entry.amount) || 0)}</Text>
                <Text style={rowStyles.date}>
                    {formatDate(displayDate)}
                </Text>
                <Text style={rowStyles.idRef}>
                    ID: {entry.payoutId.slice(-8).toUpperCase()}
                </Text>
                {(entry.provider || entry.transactionId || entry.providerReference) ? (
                    <Text style={rowStyles.idRef}>
                        {entry.provider ? 'Processed by Provider' : 'Processor'}{' '}
                        {entry.transactionId || entry.providerReference ? `- Ref: ${entry.transactionId || entry.providerReference}` : ''}
                    </Text>
                ) : null}
            </View>
            <View style={rowStyles.statusContainer}>
                <View style={[rowStyles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[rowStyles.statusText, { color: statusInfo.text }]}>
                        {entry.status}
                    </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#A0AEC0" style={{ marginTop: 8 }} />
            </View>
        </Pressable>
    );
}

export function PayoutHistoryScreen({ navigation }: Props) {
    const { isConnected } = useConnectivity();
    const { data, isLoading, isError, isFetching, refetch } = useGetPayoutHistoryQuery(undefined, {
        refetchOnMountOrArgChange: true,
    });

    useEffect(() => {
        trackAnalyticsEvent('payout_history_viewed');
    }, []);

    const items = data || [];

    return (
        <SafeAreaView style={styles.container}>
            <View style={[styles.topArch, { height: 160 }]} />

            <View style={styles.header}>
                <Text style={styles.headerTitle}>Payout History</Text>
                <Text style={styles.headerSubtitle}>View all your withdrawal requests</Text>
            </View>

            {!isConnected && (
                <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                        Offline — showing cached payout history.
                    </Text>
                </View>
            )}

            <FlatList
                data={items}
                keyExtractor={(item) => item.payoutId}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching && items.length > 0}
                        onRefresh={() => {
                            void refetch();
                        }}
                        tintColor="#FFF"
                        colors={['#F59E0B']}
                    />
                }
                ListEmptyComponent={
                    isLoading ? (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: '#718096' }}>Loading payouts...</Text>
                        </View>
                    ) : (
                        <View style={styles.emptyContainer}>
                            <View style={styles.emptyIconCircle}>
                                <Feather name={isError ? 'alert-triangle' : 'file-minus'} size={32} color="#A0AEC0" />
                            </View>
                            <Text style={styles.emptyTitle}>
                                {isError ? 'Load Failed' : 'No Payouts Yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {isError
                                    ? 'Could not load payouts. Pull to retry.'
                                    : 'Your withdrawal requests will appear here.'}
                            </Text>
                        </View>
                    )
                }
                renderItem={({ item }) => (
                    <PayoutRow
                        entry={item}
                        onPress={() => navigation.navigate('PayoutDetail', { payoutId: item.payoutId })}
                    />
                )}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    topArch: {
        position: 'absolute',
        top: 0,
        width: '100%',
        backgroundColor: '#14532D',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    warningContainer: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#F87171',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    warningText: {
        color: '#B91C1C',
        fontSize: 14,
        fontWeight: '700',
        lineHeight: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        shadowColor: '#1A202C',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 14,
        elevation: 4,
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 20,
    },
});

const rowStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    content: {
        flex: 1,
    },
    amount: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A202C',
        marginBottom: 4,
    },
    date: {
        fontSize: 13,
        color: '#718096',
        marginBottom: 4,
    },
    idRef: {
        fontSize: 12,
        color: '#A0AEC0',
    },
    statusContainer: {
        alignItems: 'flex-end',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
});
