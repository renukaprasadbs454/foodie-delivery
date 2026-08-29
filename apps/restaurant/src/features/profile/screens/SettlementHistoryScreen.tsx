import React from 'react';
import {
    RefreshControl,
    SafeAreaView,
    ScrollView,
    View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
    Badge,
    Button,
    Card,
    EmptyState,
    LoadingSpinner,
    Text,
    trackAnalyticsEvent,
    useConnectivity,
    useTheme,
} from 'foodie-shared-rn';
import {
    useGetRestaurantEarningsQuery,
    useGetRestaurantSettlementsQuery,
    type RestaurantSettlement,
} from '../../../api/endpoints/settlementsApi';
import type { ProfileStackParamList } from '../../../navigation/types';
import { MOCK_CONFIG } from '../../../config/mockConfig';

type Props = NativeStackScreenProps<ProfileStackParamList, 'SettlementHistory'>;

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

const MOCK_SETTLEMENTS: RestaurantSettlement[] = [
    {
        id: 'mock-set-1',
        restaurantId: 'mock-rest-1',
        settlementNumber: 'SETTLE-889201',
        settlementPeriodStart: '2026-08-01T00:00:00Z',
        settlementPeriodEnd: '2026-08-15T23:59:59Z',
        grossSales: 34500,
        commissionAmount: 5175,
        taxDeducted: 345,
        netPayable: 28980,
        status: 'DISBURSED',
        paymentReference: 'UTR-9920148201',
        disbursedAt: '2026-08-16T10:30:00Z',
        createdAt: '2026-08-16T00:00:00Z',
    },
    {
        id: 'mock-set-2',
        restaurantId: 'mock-rest-1',
        settlementNumber: 'SETTLE-889202',
        settlementPeriodStart: '2026-08-16T00:00:00Z',
        settlementPeriodEnd: '2026-08-28T23:59:59Z',
        grossSales: 18200,
        commissionAmount: 2730,
        taxDeducted: 182,
        netPayable: 15288,
        status: 'PENDING',
        createdAt: '2026-08-28T00:00:00Z',
    },
];

export function SettlementHistoryScreen({ navigation }: Props) {
    const { tokens } = useTheme();
    const { isConnected } = useConnectivity();

    const settlementsQuery = useGetRestaurantSettlementsQuery(undefined, {
        refetchOnFocus: true,
    });

    const earningsQuery = useGetRestaurantEarningsQuery(undefined, {
        refetchOnFocus: true,
    });

    React.useEffect(() => {
        trackAnalyticsEvent('restaurant_settlement_history_viewed');
    }, []);

    const isUsingMock =
        MOCK_CONFIG.ENABLE_MOCK_FALLBACK &&
        (!isConnected ||
            settlementsQuery.isError ||
            !settlementsQuery.data ||
            settlementsQuery.data.length === 0);

    const settlements =
        settlementsQuery.data && settlementsQuery.data.length > 0
            ? settlementsQuery.data
            : isUsingMock
                ? MOCK_SETTLEMENTS
                : [];

    const earnings = earningsQuery.data ?? {
        grossEarnings: settlements.reduce((acc, s) => acc + s.grossSales, 0),
        netSettled: settlements
            .filter((s) => s.status === 'DISBURSED')
            .reduce((acc, s) => acc + s.netPayable, 0),
        pendingPayout: settlements
            .filter((s) => s.status === 'PENDING' || s.status === 'APPROVED')
            .reduce((acc, s) => acc + s.netPayable, 0),
        totalOrders: 42,
        totalSettlements: settlements.length,
    };

    const getStatusBadge = (status: RestaurantSettlement['status']) => {
        switch (status) {
            case 'DISBURSED':
                return <Badge label="DISBURSED" tone="success" accessibilityLabel="Disbursed status" />;
            case 'APPROVED':
                return <Badge label="APPROVED" tone="accent" accessibilityLabel="Approved status" />;
            case 'PENDING':
                return <Badge label="PROCESSING" tone="warning" accessibilityLabel="Processing status" />;
            case 'FAILED':
                return <Badge label="FAILED" tone="error" accessibilityLabel="Failed status" />;
            default:
                return <Badge label={String(status)} tone="neutral" accessibilityLabel="Status" />;
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.background }}>
            <ScrollView
                contentContainerStyle={{
                    padding: tokens.spacing.md,
                    gap: tokens.spacing.md,
                    paddingBottom: 60,
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={settlementsQuery.isFetching || earningsQuery.isFetching}
                        onRefresh={() => {
                            void settlementsQuery.refetch();
                            void earningsQuery.refetch();
                        }}
                    />
                }
            >
                {/* Screen Header */}
                <View style={{ gap: tokens.spacing.xs }}>
                    <Button
                        variant="secondary"
                        label="← Back to Settings"
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Back to Settings"
                        style={{ alignSelf: 'flex-start' }}
                    />
                    <Text variant="heading1" style={{ color: BRAND_PRIMARY }} accessibilityRole="header">
                        Payment & Settlements
                    </Text>
                    <Text variant="caption" color={tokens.color.textSecondary}>
                        Track payouts, revenue splits, commission deductions, and bank disbursements
                    </Text>
                </View>

                {/* Earnings Overview Card */}
                <Card style={{ backgroundColor: BRAND_PRIMARY, padding: tokens.spacing.lg, borderRadius: 16 }}>
                    <Text variant="label" style={{ color: '#E2E8F0', letterSpacing: 1 }}>
                        TOTAL REVENUE (LIFETIME)
                    </Text>
                    <Text variant="heading1" style={{ color: '#FFFFFF', fontSize: 32, marginVertical: 4 }}>
                        ₹{earnings.grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Text>

                    <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 }} />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View>
                            <Text variant="caption" style={{ color: '#CBD5E1' }}>
                                Disbursed to Bank
                            </Text>
                            <Text variant="heading3" style={{ color: '#4ADE80' }}>
                                ₹{earnings.netSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                            <Text variant="caption" style={{ color: '#CBD5E1' }}>
                                Pending Payout
                            </Text>
                            <Text variant="heading3" style={{ color: BRAND_ACCENT }}>
                                ₹{earnings.pendingPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Settlement Records Title */}
                <Text variant="heading3" style={{ marginTop: tokens.spacing.xs }}>
                    Settlement History ({settlements.length})
                </Text>

                {settlementsQuery.isLoading && !isUsingMock ? (
                    <LoadingSpinner accessibilityLabel="Loading settlement history..." />
                ) : settlements.length === 0 ? (
                    <EmptyState
                        title="No Settlements Recorded"
                        description="Completed order payouts will automatically appear here once calculated."
                        accessibilityLabel="No Settlements Recorded"
                    />
                ) : (
                    settlements.map((item) => (
                        <Card
                            key={item.id}
                            style={{
                                padding: tokens.spacing.md,
                                borderRadius: 12,
                                gap: tokens.spacing.sm,
                                borderWidth: 1,
                                borderColor: '#E2E8F0',
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text variant="label" style={{ fontWeight: 'bold' }}>
                                        {item.settlementNumber}
                                    </Text>
                                    <Text variant="caption" color={tokens.color.textSecondary}>
                                        {new Date(item.settlementPeriodStart).toLocaleDateString()} -{' '}
                                        {new Date(item.settlementPeriodEnd).toLocaleDateString()}
                                    </Text>
                                </View>
                                {getStatusBadge(item.status)}
                            </View>

                            <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />

                            {/* Financial Breakdown Table */}
                            <View style={{ gap: 4 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text variant="caption" color={tokens.color.textSecondary}>
                                        Gross Sales
                                    </Text>
                                    <Text variant="caption" style={{ fontWeight: '500' }}>
                                        ₹{item.grossSales.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text variant="caption" color={tokens.color.textSecondary}>
                                        Platform Commission (15%)
                                    </Text>
                                    <Text variant="caption" style={{ color: '#DC2626' }}>
                                        -₹{item.commissionAmount.toFixed(2)}
                                    </Text>
                                </View>

                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text variant="caption" color={tokens.color.textSecondary}>
                                        TDS Deducted (1%)
                                    </Text>
                                    <Text variant="caption" style={{ color: '#DC2626' }}>
                                        -₹{item.taxDeducted.toFixed(2)}
                                    </Text>
                                </View>

                                <View
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginTop: 4,
                                        paddingTop: 4,
                                        borderTopWidth: 1,
                                        borderTopColor: '#F1F5F9',
                                    }}
                                >
                                    <Text variant="label" style={{ color: BRAND_PRIMARY, fontWeight: 'bold' }}>
                                        Net Payable
                                    </Text>
                                    <Text variant="heading3" style={{ color: BRAND_PRIMARY }}>
                                        ₹{item.netPayable.toFixed(2)}
                                    </Text>
                                </View>
                            </View>

                            {item.paymentReference && (
                                <View style={{ backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, marginTop: 4 }}>
                                    <Text variant="caption" style={{ color: '#475569', fontSize: 11 }}>
                                        Bank Ref: {item.paymentReference}{' '}
                                        {item.disbursedAt && `• ${new Date(item.disbursedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                    </Text>
                                </View>
                            )}
                        </Card>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
