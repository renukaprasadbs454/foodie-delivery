import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet, Pressable, SafeAreaView, Modal, Linking } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as LinkingExpo from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import {
  Button,
  EmptyState,
  Text,
  Toast,
  trackAnalyticsEvent,
  useConnectivity,
  useTheme,
} from 'foodie-shared-rn';
import { useGetOrderQuery } from '../../../api/endpoints/ordersApi';
import { AssignmentDetailSkeleton } from '../components/AssignmentDetailSkeleton';
import { useAssignmentOrderSubscription } from '../hooks/useAssignmentOrderSubscription';
import { formatMoney, formatDistanceKm, isUuid } from '../types';
import { legForOrderStatus } from '../../navigation/types';
import { BottomNav } from '../../../navigation/BottomNav';
import type { MainStackParamList } from '../../../navigation/types';
import { useAppSelector } from '../../../store/hooks';
import { selectUserId } from '../../auth/authSlice';

const COD_STORAGE_KEY_PREFIX = 'cod_collected_';
const RAZORPAY_KEY = 'rzp_test_YourKeyHere'; // ← same key used in customer app


type Props = NativeStackScreenProps<MainStackParamList, 'AssignmentDetails'>;

/**
 * P2-DEL-02/03 — GET /orders/{id} for assignment detail.
 * Premium Redesign - Swiggy/Zomato pattern.
 */
export function AssignmentDetailsScreen({ navigation, route }: Props) {
  const { tokens } = useTheme();
  const { isConnected } = useConnectivity();
  const { orderId, assignmentId } = route.params;
  const validOrderId = Boolean(orderId && isUuid(orderId));
  const [toast, setToast] = useState<{
    message: string;
    variant: 'info' | 'success' | 'error' | 'warning';
  } | null>(null);

  const [reachedRestaurant, setReachedRestaurant] = useState(false);
  const [collected, setCollected] = useState(false);
  const [showCodModal, setShowCodModal] = useState(false);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const userId = useAppSelector(selectUserId);

  const orderQuery = useGetOrderQuery(orderId, {
    skip: !validOrderId,
    pollingInterval: 30_000,
    refetchOnFocus: true,
  });

  const { wsActive } = useAssignmentOrderSubscription(
    validOrderId ? orderId : undefined,
    orderQuery.data?.status,
  );

  useEffect(() => {
    trackAnalyticsEvent('delivery_assignment_details_viewed');
    trackAnalyticsEvent('assignment_opened', {
      orderId,
      ...(assignmentId ? { assignmentId } : {}),
    });
  }, [assignmentId, orderId]);

  if (!validOrderId) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.color.background,
          padding: tokens.spacing.xl,
          justifyContent: 'center',
        }}
      >
        <EmptyState
          title="Invalid order link"
          description="Assignment details require a valid order id."
          accessibilityLabel="Invalid order id"
        />
      </View>
    );
  }

  const order = orderQuery.data;
  const loading = orderQuery.isLoading && !order;
  const status = order?.status;
  const leg = legForOrderStatus(status);

  const requireAssignmentId = () => {
    if (!assignmentId) {
      setToast({
        message: 'Assignment id is required for navigation. Accept an offer in this session.',
        variant: 'warning',
      });
      return false;
    }
    return true;
  };

  const isDropOffPhase = leg === 'drop';

  // Mocks provided if backend doesn't hydrate these fields yet
  const restaurantName = order?.restaurantName ?? 'Featured Restaurant';
  const restaurantAddress = order?.restaurantAddress ?? 'Pickup location pending...';
  const restaurantPhone = order?.restaurantPhone ?? '+918000000000';

  const customerName = order?.customerName ?? 'Customer';
  const deliveryAddress = order?.deliveryAddress ?? 'Customer delivery address pending...';
  const customerPhone = order?.customerPhone ?? '+919000000000';

  const distance = order?.estimatedDistance ?? 2.4;

  const isCod = (order as any)?.paymentMethod === 'COD' || (order as any)?.paymentMethod === 'CASH';

  const handleCashCollected = async () => {
    setShowCodModal(false);
    if (!userId || !order) return;
    const key = `${COD_STORAGE_KEY_PREFIX}${userId}`;
    try {
      const raw = await AsyncStorage.getItem(key);
      const current = parseFloat(raw || '0');
      const total = current + Number(order.totalAmount ?? 0);
      await AsyncStorage.setItem(key, total.toString());
    } catch { }
    setToast({ message: `✅ ₹${formatMoney(order.totalAmount)} marked as collected. Added to COD Deposit.`, variant: 'success' });
    setCollected(true);
  };

  const handleCodScannerPaymentMessage = async (rawData: string) => {
    try {
      const msg = JSON.parse(rawData);
      if (msg.type === 'success') {
        setShowRazorpay(false);
        setShowCodModal(false);
        setToast({ message: '✅ Payment received via scanner. Marked as collected.', variant: 'success' });
        setCollected(true);
        // Online payment — do NOT add to COD deposit section
      } else if (msg.type === 'cancel') {
        setShowRazorpay(false);
        setToast({ message: 'Scanner payment cancelled.', variant: 'warning' });
      } else {
        setShowRazorpay(false);
        setToast({ message: msg.data || 'Payment failed.', variant: 'error' });
      }
    } catch {
      setShowRazorpay(false);
    }
  };

  const amountPaise = Math.round(Number(order?.totalAmount ?? 0) * 100);
  const razorpayHtml = `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <title>Collect Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>body,html{margin:0;padding:0;height:100vh;width:100vw;background:#fff;display:flex;justify-content:center;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}.spinner{width:44px;height:44px;border:4px solid #e2e8f0;border-top:4px solid #14532D;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style>
  </head><body>
  <div id="loader" style="text-align:center;color:#1e293b"><div class="spinner"></div><p style="font-weight:700;font-size:16px">Loading Payment QR...</p></div>
  <script>
    const config=${JSON.stringify({ key: RAZORPAY_KEY, amount: amountPaise, currency: 'INR', name: 'Foodie Order', description: 'Order Payment', theme: { color: '#14532D' }, method: { upi: true, card: false, netbanking: false, wallet: false } })};
    config.handler=function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',data:{razorpay_payment_id:r.razorpay_payment_id||''}}))};
    config.modal={ondismiss:function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'cancel'}));}};
    window.onload=function(){
      try{
        const rzp=new Razorpay(config);rzp.on('payment.failed',function(r){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:r.error?r.error.description:'Failed'}))});rzp.open();
        setTimeout(function(){var l=document.getElementById('loader');if(l)l.style.display='none';},800);
      }catch(err){window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:err.message||'Error'}));}
    };
  </script></body></html>`;

  const handleCall = (phone: string) => {
    LinkingExpo.openURL(`tel:${phone}`).catch(() =>
      setToast({ message: 'Unable to place a call.', variant: 'error' })
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.topArch, { height: 180 }]} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={orderQuery.isFetching}
            onRefresh={() => void orderQuery.refetch()}
            tintColor="#FFFFFF"
            colors={['#F59E0B']}
          />
        }
      >
        <View style={styles.headerBox}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFF" />
          </Pressable>
          <View>
            <Text style={styles.pageTitle}>Order #{order?.orderNumber ?? '...'}</Text>
            <Text style={styles.pageSubtitle}>
              {wsActive ? '🟢 Live updates connected' : '🟡 Polling fallback active'}
            </Text>
          </View>
        </View>

        {!isConnected && (
          <View style={styles.warningContainer}>
            <Feather name="wifi-off" size={16} color="#B91C1C" />
            <Text style={styles.warningText}>Offline — showing cached order</Text>
          </View>
        )}

        {loading ? <AssignmentDetailSkeleton /> : null}

        {orderQuery.isError && !order ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Feather name="search" size={32} color="#A0AEC0" />
            </View>
            <Text style={styles.emptyTitle}>Order Not Found</Text>
            <Text style={styles.emptySubtitle}>Could not load this order. It may be unassigned or unavailable.</Text>
          </View>
        ) : null}

        {order ? (
          <>
            <View style={styles.statusPill}>
              <Text style={styles.statusText}>{order.status}</Text>
            </View>

            {/* Contextual Card: Restaurant in Pickup Phase, Customer in Drop Phase */}
            {!isDropOffPhase ? (
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="restaurant" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Pickup From</Text>
                    <Text style={styles.infoTitle} numberOfLines={1}>{restaurantName}</Text>
                    <Text style={styles.infoAddress} numberOfLines={2}>{restaurantAddress}</Text>
                    <View style={styles.distanceBadge}>
                      <Ionicons name="navigate-outline" size={12} color="#14532D" />
                      <Text style={styles.distanceText}>{formatDistanceKm(distance)} away</Text>
                    </View>
                  </View>
                  <Pressable style={styles.callButton} onPress={() => handleCall(restaurantPhone)}>
                    <Feather name="phone" size={20} color="#10B981" />
                  </Pressable>
                </View>
              </View>
            ) : (
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
            )}

            <View style={styles.orderCard}>
              <View style={styles.orderHeader}>
                <Text style={styles.itemsLabel}>Order Items</Text>
                <View style={styles.totalBadge}>
                  <Text style={styles.totalAmount}>{formatMoney(order.totalAmount)}</Text>
                </View>
              </View>

              <View style={styles.divider} />
              {(order.items ?? []).map((item: any, index: number) => (
                <View key={`${item.menuItemId ?? 'item'}-${index}`} style={styles.itemRow}>
                  <View style={styles.itemQuantityCircle}>
                    <Text style={styles.itemQuantityText}>{item.quantity}x</Text>
                  </View>
                  <Text style={styles.itemName}>{item.name ?? 'Unknown Item'}</Text>
                  <Text style={styles.itemPrice}>{formatMoney(item.lineTotal ?? item.unitPrice)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actionSection}>
              <Pressable
                style={styles.primaryNavButton}
                onPress={() => {
                  trackAnalyticsEvent('start_navigation_tapped', { orderId });
                  if (!requireAssignmentId() || !assignmentId) return;
                  navigation.navigate('DeliveryNavigation', {
                    assignmentId,
                    orderId,
                    leg,
                  });
                }}
              >
                <Feather name="navigation" size={20} color="#FFFFFF" style={styles.actionIcon} />
                <Text style={styles.actionButtonText}>
                  {isDropOffPhase ? 'Navigate to Customer' : 'Navigate to Restaurant'}
                </Text>
              </Pressable>

              {/* COD Collect Button — only on drop-off if payment method is COD */}
              {isDropOffPhase && isCod && !collected && (
                <Pressable
                  style={[styles.primaryNavButton, { backgroundColor: '#D97706', marginTop: 12 }]}
                  onPress={() => setShowCodModal(true)}
                >
                  <Feather name="dollar-sign" size={20} color="#FFF" style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>Collect Cash (COD)</Text>
                </Pressable>
              )}

              {isDropOffPhase && isCod && collected && (
                <View style={[styles.primaryNavButton, { backgroundColor: '#10B981', marginTop: 12 }]}>
                  <Feather name="check-circle" size={20} color="#FFF" style={styles.actionIcon} />
                  <Text style={styles.actionButtonText}>Cash / Payment Collected ✓</Text>
                </View>
              )}
            </View>
          </>
        ) : null}

      </ScrollView>

      <Toast
        visible={Boolean(toast)}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        accessibilityLabel={toast?.message ?? 'Toast'}
        onDismiss={() => setToast(null)}
      />

      {/* COD Mode Selection Modal */}
      <Modal visible={showCodModal} transparent animationType="slide" onRequestClose={() => setShowCodModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#1A202C', marginBottom: 8 }}>Collect Payment</Text>
            <Text style={{ fontSize: 14, color: '#718096', marginBottom: 24 }}>
              Amount to collect: <Text style={{ fontWeight: '800', color: '#14532D' }}>{formatMoney(order?.totalAmount ?? 0)}</Text>
            </Text>

            <Pressable
              style={{ backgroundColor: '#14532D', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 12 }}
              onPress={() => { setShowCodModal(false); setShowRazorpay(true); }}
            >
              <Feather name="smartphone" size={20} color="#FCD34D" />
              <Text style={{ color: '#FCD34D', fontSize: 16, fontWeight: '800' }}>Generate Payment QR / Scanner</Text>
            </Pressable>

            <Pressable
              style={{ backgroundColor: '#FCD34D', borderRadius: 16, height: 56, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 10, marginBottom: 16 }}
              onPress={handleCashCollected}
            >
              <Feather name="dollar-sign" size={20} color="#0F3E22" />
              <Text style={{ color: '#0F3E22', fontSize: 16, fontWeight: '800' }}>Collected Cash Physically</Text>
            </Pressable>

            <Pressable onPress={() => setShowCodModal(false)} style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Text style={{ color: '#A0AEC0', fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Razorpay QR WebView for scanner */}
      <Modal visible={showRazorpay} animationType="slide" transparent={false} onRequestClose={() => setShowRazorpay(false)}>
        <View style={{ flex: 1, backgroundColor: '#fff' }}>
          <WebView
            source={{ html: razorpayHtml, baseUrl: 'https://checkout.razorpay.com' }}
            style={{ flex: 1 }}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            mixedContentMode="always"
            thirdPartyCookiesEnabled
            onShouldStartLoadWithRequest={(request) => {
              const url = request.url;
              if (url.startsWith('upi://') || url.startsWith('phonepe://') || url.startsWith('gpay://') || url.startsWith('paytm://') || url.startsWith('tez://') || url.startsWith('intent://')) {
                Linking.openURL(url).catch(() => { });
                return false;
              }
              return true;
            }}
            onMessage={(event) => void handleCodScannerPaymentMessage(event.nativeEvent.data)}
          />
          <Pressable
            onPress={() => setShowRazorpay(false)}
            style={{ position: 'absolute', top: 48, right: 16, backgroundColor: '#FFF', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 }}
          >
            <Feather name="x" size={20} color="#E23744" />
          </Pressable>
        </View>
      </Modal>

      <BottomNav />
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 60,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoTextContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A202C',
    marginBottom: 2,
  },
  infoAddress: {
    fontSize: 13,
    color: '#718096',
    marginBottom: 6,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14532D',
    marginLeft: 4,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  itemsLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A202C',
  },
  totalBadge: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
  },
  divider: {
    height: 1,
    backgroundColor: '#EDF2F7',
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemQuantityCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemQuantityText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2D3748',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
  },
  actionSection: {
    gap: 16,
  },
  primaryNavButton: {
    flexDirection: 'row',
    backgroundColor: '#14532D',
    borderRadius: 20,
    height: 64,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  actionIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 20,
  },
  actionIconLeft: {
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
  },
  secondaryButtonText: {
    color: '#14532D',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  tertiaryButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  tertiaryButtonText: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  warningContainer: {
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  warningText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginTop: 20,
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
    paddingHorizontal: 20,
  },
});

