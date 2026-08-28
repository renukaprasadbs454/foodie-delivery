import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    View,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Text, trackAnalyticsEvent, useTheme, EmptyState } from 'foodie-shared-rn';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useGetWalletBalanceQuery, useGetWalletLedgerQuery } from '../../../api/endpoints/walletApi';
import type { ProfileStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Wallet'>;

function formatMoney(val: string | number): string {
    const num = Number(val);
    return isNaN(num) ? '0.00' : num.toFixed(2);
}

export function WalletScreen({ navigation }: Props) {
    const { tokens } = useTheme();
    const [page, setPage] = useState(0);

    const balanceQuery = useGetWalletBalanceQuery();
    const ledgerQuery = useGetWalletLedgerQuery({
        page,
        size: 20,
        sort: 'createdAt,desc',
    });

    const balance = Number(balanceQuery.data?.balance || 0);
    const transactions = ledgerQuery.data?.items || [];
    const isLoading = balanceQuery.isFetching || ledgerQuery.isFetching;

    React.useEffect(() => {
        trackAnalyticsEvent('customer_wallet_viewed');
    }, []);

    const handleRefresh = () => {
        setPage(0);
        void balanceQuery.refetch();
        void ledgerQuery.refetch();
    };

    const renderTransaction = ({ item }: { item: any }) => {
        const isCredit = item.type === 'CREDIT';
        const amountColor = isCredit ? '#059669' : '#DC2626';
        const sign = isCredit ? '+' : '-';
        const iconName = isCredit ? 'arrow-down-left' : 'arrow-up-right';

        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#FFFFFF',
                padding: 16,
                marginBottom: 8,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#F3F4F6',
                shadowColor: '#14532D',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 5,
                elevation: 1,
            }}>
                <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                }}>
                    <Feather name={iconName} size={20} color={amountColor} />
                </View>

                <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>
                        {item.referenceType === 'ORDER_PAYMENT' ? 'Order Payment' :
                            item.referenceType === 'REFUND' ? 'Refund' :
                                item.referenceType === 'DEPOSIT' ? 'Deposit' : item.referenceType}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280' }}>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                    </Text>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: amountColor }}>
                        {sign}₹{formatMoney(item.amount)}
                    </Text>
                    {item.referenceId && item.referenceType === 'ORDER_PAYMENT' && (
                        <Text style={{ fontSize: 12, color: '#9CA3AF' }}>Order ID</Text>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }} edges={['top', 'left', 'right']}>
            <StatusBar backgroundColor="#14532D" barStyle="light-content" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: 20,
                backgroundColor: '#14532D',
            }}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => ({
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: pressed ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                        justifyContent: 'center',
                        alignItems: 'center',
                    })}
                >
                    <Feather name="arrow-left" size={20} color="#FCD34D" />
                </Pressable>
                <Text style={{ marginLeft: 16, fontSize: 20, fontWeight: '800', color: '#FCD34D' }}>
                    My Wallet
                </Text>
            </View>

            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransaction}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor="#14532D" />
                }
                ListHeaderComponent={
                    <View style={{ marginBottom: 24 }}>
                        {/* Balance Card */}
                        <LinearGradient
                            colors={['#14532D', '#1B6A3A']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                                borderRadius: 24,
                                padding: 24,
                                shadowColor: '#14532D',
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.3,
                                shadowRadius: 16,
                                elevation: 10,
                                marginBottom: 24,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', padding: 6, borderRadius: 8 }}>
                                        <Feather name="credit-card" size={16} color="#A7F3D0" />
                                    </View>
                                    <Text style={{ color: '#A7F3D0', fontWeight: '700', fontSize: 15, letterSpacing: 1 }}>
                                        FOODIE WALLET
                                    </Text>
                                </View>
                                <Feather name="shield" size={20} color="#FCD34D" style={{ opacity: 0.8 }} />
                            </View>

                            <Text style={{ color: '#E5E7EB', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>
                                Available Balance
                            </Text>

                            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                <Text style={{ color: '#FCD34D', fontSize: 32, fontWeight: '700', marginTop: 4 }}>₹</Text>
                                <Text style={{ color: '#FCD34D', fontSize: 44, fontWeight: '900', letterSpacing: -1 }}>
                                    {formatMoney(balance)}
                                </Text>
                            </View>

                            <View style={{
                                marginTop: 20,
                                backgroundColor: 'rgba(0,0,0,0.15)',
                                paddingVertical: 10,
                                paddingHorizontal: 12,
                                borderRadius: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8
                            }}>
                                <Feather name="info" size={14} color="#A7F3D0" />
                                <Text style={{ color: '#A7F3D0', fontSize: 13, flex: 1, lineHeight: 18 }}>
                                    Wallet balance can be applied securely at checkout.
                                </Text>
                            </View>
                        </LinearGradient>

                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#111827', marginLeft: 4, marginBottom: 4 }}>
                            Recent Transactions
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={{ marginTop: 20 }}>
                            <EmptyState
                                title="No Transactions"
                                description="Your wallet history is clean. Transactions will appear here."
                                accessibilityLabel="No transactions"
                                actionLabel="Refresh"
                                onAction={handleRefresh}
                            />
                        </View>
                    ) : (
                        <ActivityIndicator size="large" color="#14532D" style={{ marginTop: 40 }} />
                    )
                }
            />
        </SafeAreaView>
    );
}
