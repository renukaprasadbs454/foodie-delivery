import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    Modal,
    Alert,
    Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Text';
import { Toast } from '@/components/Toast';
import { useGetDeliveryProfileQuery, useSubmitCashDepositMutation, useVerifyCashDepositMutation } from '@/api/endpoints/deliveryApi';
import { ENV } from '@/constants/env';
import { BottomNav } from '@/navigation/BottomNav';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CashDeposit'>;

const COD_STORAGE_KEY_PREFIX = 'cod_collected_';
const DEPOSIT_HISTORY_KEY_PREFIX = 'cod_deposits_';

function buildCashfreeHtml(paymentSessionId: string): string {
    return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <title>Cashfree Payment</title>
  <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
  <style>
    body,html{margin:0;padding:0;height:100vh;width:100vw;background:#fff;display:flex;justify-content:center;align-items:center;font-family:-apple-system,sans-serif;}
  </style>
  </head><body>
  <div id="loader" style="text-align:center;color:#1e293b">
    Loading Secure Checkout...
  </div>
  <script>
    window.onload=function(){
      try{
        const cashfree = Cashfree({ mode: "sandbox" });
        cashfree.checkout({
            paymentSessionId: "${paymentSessionId}"
        }).then(function(result){
            if(result.error){
                window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:result.error.message}));
            }
            if(result.redirect){
                console.log("Redirecting");
            }
            if(result.paymentDetails){
                window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',data:result.paymentDetails.paymentMessage}));
            }
        });
      }catch(err){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:err.message||'Could not launch checkout'}));
      }
    };
  </script>
  </body></html>`;
}

export function CashDepositScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { data: profile, refetch: refetchProfile } = useGetDeliveryProfileQuery();
    const [submitDeposit] = useSubmitCashDepositMutation();
    const [verifyDeposit] = useVerifyCashDepositMutation();

    const collectedAmount = profile?.cashInHand || 0;
    const [showRazorpay, setShowRazorpay] = useState(false);
    const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
    const [depositId, setDepositId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        variant: 'info' | 'success' | 'error' | 'warning';
    } | null>(null);

    const handleDepositSuccess = async (paymentId: string) => {
        setShowRazorpay(false);
        if (depositId) {
            try {
                await verifyDeposit(depositId).unwrap();
                await refetchProfile();
                setToast({ message: '✅ COD deposit successful! ₹' + collectedAmount.toFixed(2) + ' sent to Foodie.', variant: 'success' });
            } catch (e) {
                setToast({ message: 'Submission successful, but verification failed.', variant: 'warning' });
            }
        }
        setIsProcessing(false);
    };

    const handlePaymentMessage = async (rawData: string) => {
        try {
            const msg = JSON.parse(rawData) as { type: string; data?: any };
            if (msg.type === 'success') {
                await handleDepositSuccess(msg.data?.razorpay_payment_id || 'rzp_' + Date.now());
            } else if (msg.type === 'cancel') {
                setShowRazorpay(false);
                setIsProcessing(false);
                setToast({ message: 'Deposit cancelled.', variant: 'warning' });
            } else {
                setShowRazorpay(false);
                setIsProcessing(false);
                setToast({ message: msg.data || 'Payment failed. Try again.', variant: 'error' });
            }
        } catch {
            setShowRazorpay(false);
            setIsProcessing(false);
        }
    };

    const htmlContent = paymentSessionId ? buildCashfreeHtml(paymentSessionId) : '';

    return (
        <View style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
            {/* Header gradient */}
            <LinearGradient
                colors={['#0F3E22', '#14532D', '#1B6A3A']}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: insets.top + 220,
                    borderBottomLeftRadius: 40,
                    borderBottomRightRadius: 40,
                }}
            />

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 40, paddingBottom: 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Back + Title */}
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}
                    >
                        <Feather name="arrow-left" size={22} color="#FFF" />
                    </Pressable>
                    <View>
                        <Text style={{ fontSize: 28, fontWeight: '900', color: '#FCD34D', letterSpacing: 0.5 }}>COD Deposit</Text>
                        <Text style={{ fontSize: 14, color: '#A7F3D0', fontWeight: '600' }}>Deposit cash collected from customers</Text>
                    </View>
                </View>

                {/* Main balance card */}
                <LinearGradient
                    colors={['#0F3E22', '#1B6A3A']}
                    style={{
                        borderRadius: 24,
                        padding: 24,
                        marginBottom: 20,
                        borderWidth: 2,
                        borderColor: '#FCD34D',
                    }}
                >
                    <Text style={{ fontSize: 13, color: '#A7F3D0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                        Cash Collected (COD)
                    </Text>
                    <Text style={{ fontSize: 48, lineHeight: 54, paddingTop: 8, paddingBottom: 4, fontWeight: '900', color: '#FCD34D', marginBottom: 12, includeFontPadding: true }}>
                        ₹{collectedAmount.toFixed(2)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#A7F3D0', opacity: 0.8 }}>
                        This is cash you collected from cash-on-delivery orders. You must deposit this to Foodie.
                    </Text>
                </LinearGradient>

                {/* Info note */}
                <View style={{
                    backgroundColor: 'rgba(252,211,77,0.08)',
                    borderWidth: 1,
                    borderColor: 'rgba(252,211,77,0.25)',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 24,
                    flexDirection: 'row',
                    gap: 12,
                }}>
                    <Feather name="info" size={18} color="#D97706" />
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#1A202C', marginBottom: 4 }}>How it works</Text>
                        <Text style={{ fontSize: 13, color: '#718096', lineHeight: 20 }}>
                            When a customer pays cash (COD), the amount is tracked here. Online (Razorpay) payments go directly to Foodie — they do NOT appear here. Use this screen to pay Foodie the collected cash.
                        </Text>
                    </View>
                </View>

                {/* Deposit button */}
                {collectedAmount > 0 ? (
                    <Pressable
                        disabled={!isConnected || isProcessing}
                        onPress={async () => {
                            if (!isConnected) {
                                setToast({ message: 'No internet connection. Payment requires internet.', variant: 'warning' });
                                return;
                            }
                            setIsProcessing(true);
                            try {
                                const res = await submitDeposit({ amount: collectedAmount }).unwrap();
                                if (res.paymentSessionId) {
                                    setPaymentSessionId(res.paymentSessionId);
                                    setDepositId((res as any).id || res.referenceNumber);
                                    setShowRazorpay(true);
                                } else {
                                    setToast({ message: 'Failed to initiate cashfree deposit.', variant: 'error' });
                                    setIsProcessing(false);
                                }
                            } catch (e: any) {
                                setToast({ message: e?.data?.error?.message || 'Error occurred.', variant: 'error' });
                                setIsProcessing(false);
                            }
                        }}
                        style={({ pressed }) => ({ opacity: pressed || (!isConnected) ? 0.7 : 1, marginBottom: 24 })}
                    >
                        <LinearGradient
                            colors={isConnected ? ['#FCD34D', '#FBBF24'] : ['#CBD5E0', '#CBD5E0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{
                                borderRadius: 20,
                                height: 60,
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexDirection: 'row',
                                gap: 10,
                            }}
                        >
                            <Feather name="upload" size={20} color={isConnected ? '#0F3E22' : '#718096'} />
                            <Text style={{ fontSize: 17, fontWeight: '800', color: isConnected ? '#0F3E22' : '#718096' }}>
                                {isProcessing ? 'Opening Payment...' : `Deposit ₹${collectedAmount.toFixed(2)} to Foodie`}
                            </Text>
                        </LinearGradient>
                    </Pressable>
                ) : (
                    <View style={{
                        borderRadius: 20,
                        height: 60,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#E2E8F0',
                        marginBottom: 24,
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#A0AEC0' }}>No COD cash to deposit</Text>
                    </View>
                )}

                {/* Deposit History Placeholder */}
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 16 }}>Pending Deposits</Text>
                <View style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 20,
                    padding: 32,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                }}>
                    <Feather name="clock" size={32} color="#A0AEC0" />
                    <Text style={{ color: '#A0AEC0', fontWeight: '600', fontSize: 15, marginTop: 12 }}>Will apply when verified</Text>
                </View>

            </ScrollView>

            <Toast
                visible={Boolean(toast)}
                message={toast?.message ?? ''}
                variant={toast?.variant ?? 'info'}
                accessibilityLabel={toast?.message ?? 'Toast'}
                onDismiss={() => setToast(null)}
            />

            {/* Razorpay WebView Modal */}
            <Modal visible={showRazorpay} animationType="slide" transparent={false} onRequestClose={() => { setShowRazorpay(false); setIsProcessing(false); }}>
                <View style={{ flex: 1, backgroundColor: '#fff' }}>
                    <WebView
                        source={{ html: htmlContent, baseUrl: 'https://sandbox.cashfree.com' }}
                        style={{ flex: 1 }}
                        javaScriptEnabled
                        domStorageEnabled
                        originWhitelist={['*']}
                        mixedContentMode="always"
                        thirdPartyCookiesEnabled
                        allowsInlineMediaPlayback
                        onShouldStartLoadWithRequest={(request) => {
                            const url = request.url;
                            if (
                                url.startsWith('upi://') ||
                                url.startsWith('phonepe://') ||
                                url.startsWith('gpay://') ||
                                url.startsWith('paytm://') ||
                                url.startsWith('tez://') ||
                                url.startsWith('intent://')
                            ) {
                                Linking.openURL(url).catch(() => { });
                                return false;
                            }
                            return true;
                        }}
                        onMessage={(event) => void handlePaymentMessage(event.nativeEvent.data)}
                    />
                    <Pressable
                        onPress={() => { setShowRazorpay(false); setIsProcessing(false); }}
                        style={{ position: 'absolute', top: insets.top + 8, right: 16, backgroundColor: '#FFF', borderRadius: 20, width: 40, height: 40, justifyContent: 'center', alignItems: 'center', elevation: 4 }}
                    >
                        <Feather name="x" size={20} color="#E23744" />
                    </Pressable>
                </View>
            </Modal>

            <BottomNav />
        </View>
    );
}
