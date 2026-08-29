import React, { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, BackHandler } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Linking from 'expo-linking';
import { BottomNav } from '../../../navigation/BottomNav';
import {
    Text,
    Toast,
    trackAnalyticsEvent,
    useConnectivity,
    useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { useAssignmentOrderSubscription } from '../../home/hooks/useAssignmentOrderSubscription';
import { isUuid } from '../../home/types';
import { MapSkeleton } from '../components/MapSkeleton';
import { TrackingMap } from '../components/TrackingMap';
import { useLocationPingLoop } from '../hooks/useLocationPingLoop';
import { openOsMapsHandoff } from '../osMaps';
import type { MainStackParamList } from '../../../navigation/types';
import { formatDistanceKm } from '../../home/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CustomerDelivery'>;

export function CustomerDeliveryScreen({ navigation, route }: Props) {
    const { tokens } = useTheme();
    const { isConnected } = useConnectivity();
    const { orderId, assignmentId } = route.params;
    const validOrder = Boolean(orderId && isUuid(orderId));

    const orderQuery = useGetOrderQuery(orderId, {
        skip: !validOrder,
        pollingInterval: 30_000,
        refetchOnFocus: true,
    });

    useAssignmentOrderSubscription(
        validOrder ? orderId : undefined,
        orderQuery.data?.status,
    );

    const order = orderQuery.data;
    const status = order?.status;
    const pingEnabled = status === 'OUT_FOR_DELIVERY' || status === 'PICKED_UP';

    const { lastPing, permissionDenied } = useLocationPingLoop({
        enabled: pingEnabled && validOrder,
    });

    const [toast, setToast] = useState<{
        message: string;
        variant: 'info' | 'success' | 'error' | 'warning';
    } | null>(null);

    const [reachedCustomer, setReachedCustomer] = useState(false);

    useEffect(() => {
        trackAnalyticsEvent('customer_delivery_viewed', { orderId });

        // Disable back button at all times in customer dropoff leg
        navigation.setOptions({
            headerLeft: () => null,
            headerBackVisible: false,
            gestureEnabled: false,
        });
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);
        return () => backHandler.remove();
    }, [orderId, navigation]);

    const customerName = order?.customerName ?? 'Anil Kumar';
    const deliveryAddress = order?.deliveryAddress ?? 'B-104, Shantiniketan Apartments, Whitefield, Bengaluru - 560066';
    const customerPhone = order?.customerPhone ?? '+919876543210';
    const distance = order?.estimatedDistance ?? 2.4;

    const handleCall = (phone: string) => {
        Linking.openURL(`tel:${phone}`).catch(() =>
            setToast({ message: 'Unable to place a call.', variant: 'error' })
        );
    };

    const onOpenOsMaps = async () => {
        trackAnalyticsEvent('open_os_maps_tapped', { leg: 'drop', orderId });
        const opened = await openOsMapsHandoff({
            originLat: lastPing?.latitude,
            originLng: lastPing?.longitude,
            destLat: 12.9716,
            destLng: 77.5946,
            query: orderQuery.data?.orderNumber ? `Order ${orderQuery.data.orderNumber}` : undefined,
        });
        if (!opened) {
            setToast({ message: 'Could not open OS maps on this device.', variant: 'warning' });
        }
    };

    if (!validOrder) {
        return (
            <View style={styles.errorContainer}>
                <Feather name="alert-triangle" size={48} color="#A0AEC0" />
                <Text style={styles.errorTitle}>Invalid Navigation parameters</Text>
            </View>
        );
    }

    const loading = orderQuery.isLoading && !orderQuery.data;

    return (
        <View style={styles.container}>
            <View style={[styles.topArch, { height: 260 }]} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerBox}>
                    <Text style={styles.pageTitle}>Customer Delivery</Text>
                    <Text style={styles.pageSubtitle}>
                        Order #{orderQuery.data?.orderNumber ?? orderId} · {status ?? 'loading'}
                    </Text>

                    {!isConnected ? (
                        <View style={styles.warningContainer}>
                            <Feather name="wifi-off" size={16} color="#B91C1C" />
                            <Text style={styles.warningText}>Offline — location pings buffered</Text>
                        </View>
                    ) : null}
                    {permissionDenied ? (
                        <View style={styles.warningContainer}>
                            <Feather name="map-pin" size={16} color="#B91C1C" />
                            <Text style={styles.warningText}>Location permission denied! Cannot track.</Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.mapCard}>
                    {loading ? (
                        <View style={styles.mapFrame}>
                            <MapSkeleton />
                        </View>
                    ) : (
                        <View style={styles.mapFrame}>
                            <TrackingMap
                                lastPing={lastPing}
                                orderStatus={status}
                                leg="drop"
                                restaurantLocation={{ latitude: 12.9780, longitude: 77.6000 }}
                                customerLocation={{ latitude: 12.9716, longitude: 77.5946 }}
                            />
                        </View>
                    )}

                    <View style={styles.actionSection}>
                        <Pressable style={[styles.actionButton, styles.primaryNavButton]} onPress={() => void onOpenOsMaps()}>
                            <Feather name="external-link" size={20} color="#FFFFFF" style={styles.actionIconLeft} />
                            <Text style={styles.actionButtonText}>Open OS Maps</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="person" size={20} color="#10B981" />
                        </View>
                        <View style={styles.infoTextContainer}>
                            <Text style={styles.infoLabel}>Deliver To</Text>
                            <Text style={styles.infoTitle} numberOfLines={1}>{customerName}</Text>
                            <Text style={styles.infoAddress} numberOfLines={2}>{deliveryAddress}</Text>
                            <View style={styles.distanceBadge}>
                                <Ionicons name="navigate-outline" size={12} color="#14532D" />
                                <Text style={styles.distanceText}>{formatDistanceKm(distance)} away</Text>
                            </View>
                        </View>
                        <Pressable style={styles.callButton} onPress={() => handleCall(customerPhone)}>
                            <Feather name="phone" size={20} color="#10B981" />
                        </Pressable>
                    </View>
                </View>

                <View style={styles.actionCard}>
                    {!reachedCustomer ? (
                        <Pressable
                            style={[styles.actionButton, styles.secondaryButton]}
                            onPress={() => setReachedCustomer(true)}
                        >
                            <Feather name="map-pin" size={20} color="#14532D" style={styles.actionIconLeft} />
                            <Text style={styles.secondaryButtonText}>Reached Customer Location</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[styles.actionButton, styles.tertiaryButton]}
                            onPress={() => navigation.navigate('DeliveryOtp', { assignmentId, orderId })}
                        >
                            <Feather name="check-circle" size={20} color="#F59E0B" style={styles.actionIconLeft} />
                            <Text style={styles.tertiaryButtonText}>Delivered (Enter OTP)</Text>
                        </Pressable>
                    )}
                </View>

            </ScrollView>

            <Toast
                visible={Boolean(toast)}
                message={toast?.message ?? ''}
                variant={toast?.variant ?? 'info'}
                accessibilityLabel={toast?.message ?? 'Toast'}
                onDismiss={() => setToast(null)}
            />
            <BottomNav />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    topArch: { position: 'absolute', top: 0, width: '100%', backgroundColor: '#14532D' },
    scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 60 },
    headerBox: { marginBottom: 24 },
    pageTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 },
    pageSubtitle: { fontSize: 15, color: '#A0AEC0', fontWeight: '500' },
    warningContainer: { backgroundColor: '#FEF2F2', flexDirection: 'row', alignItems: 'center', borderRadius: 8, padding: 12, marginTop: 16 },
    warningText: { color: '#B91C1C', fontSize: 13, fontWeight: '700', marginLeft: 8 },
    mapCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, shadowColor: '#14532D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4, marginBottom: 16 },
    mapFrame: { width: '100%', height: 300, borderRadius: 16, overflow: 'hidden', backgroundColor: '#F1F5F9', marginBottom: 16 },
    actionSection: { gap: 12 },
    actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 16, height: 56, paddingHorizontal: 20 },
    primaryNavButton: { backgroundColor: '#1A202C' },
    actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    actionIconLeft: { marginRight: 8 },
    infoCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, marginBottom: 16, shadowColor: '#1A202C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    infoRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    infoTextContainer: { flex: 1, paddingHorizontal: 16 },
    infoLabel: { fontSize: 12, color: '#A0AEC0', fontWeight: '700', textTransform: 'uppercase', marginBottom: 2 },
    infoTitle: { fontSize: 17, fontWeight: '800', color: '#1A202C', marginBottom: 2 },
    infoAddress: { fontSize: 13, color: '#718096', marginBottom: 6 },
    distanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    distanceText: { fontSize: 11, fontWeight: '700', color: '#14532D', marginLeft: 4 },
    callButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F0FDF4', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DCFCE7' },
    actionCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, shadowColor: '#1A202C', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 4, borderWidth: 1, borderColor: '#E2E8F0' },
    tertiaryButton: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FEF3C7' },
    tertiaryButtonText: { color: '#F59E0B', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    secondaryButton: { backgroundColor: '#F1F5F9' },
    secondaryButtonText: { color: '#14532D', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
    errorContainer: { flex: 1, backgroundColor: '#F5F7FA', justifyContent: 'center', alignItems: 'center', padding: 40 },
    errorTitle: { marginTop: 16, fontSize: 18, fontWeight: '600', color: '#4A5568', textAlign: 'center' }
});
