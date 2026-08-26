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
import { Text, Toast, useConnectivity } from 'foodie-shared-rn';
import { useAppSelector } from '../../../store/hooks';
import { selectUserId } from '../../auth/authSlice';
import { ENV } from '../../../constants/env';
import { BottomNav } from '../../../navigation/BottomNav';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'CashDeposit'>;

const COD_STORAGE_KEY_PREFIX = 'cod_collected_';
const DEPOSIT_HISTORY_KEY_PREFIX = 'cod_deposits_';

// Replace with your Razorpay Test Key — same as used in customer app
const RAZORPAY_KEY = 'rzp_test_YourKeyHere'; // ← replace with actual key

function buildRazorpayHtml(amountPaise: number, description: string, name: string): string {
    const config: Record<string, unknown> = {
        key: RAZORPAY_KEY,
        amount: amountPaise,
        currency: 'INR',
        name: 'Foodie — COD Deposit',
        description,
        prefill: {
            contact: '9876543210',
            email: 'partner@foodie.com',
        },
        theme: { color: '#14532D' },
        method: { upi: true, card: true, netbanking: true, wallet: true },
    };

    const configStr = JSON.stringify(config);

    return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <title>Razorpay Payment</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    body,html{margin:0;padding:0;height:100vh;width:100vw;background:#fff;display:flex;justify-content:center;align-items:center;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}
    .spinner{width:44px;height:44px;border:4px solid #e2e8f0;border-top:4px solid #14532D;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px;}
    @keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
  </style>
  </head><body>
  <div id="loader" style="text-align:center;color:#1e293b">
    <div class="spinner"></div>
    <p style="font-weight:700;font-size:16px">Loading Secure Checkout...</p>
  </div>
  <script>
    const config = ${configStr};
    config.handler = function(response){
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'success',data:{
        razorpay_payment_id:response.razorpay_payment_id||'',
        razorpay_order_id:response.razorpay_order_id||null,
        razorpay_signature:response.razorpay_signature||null
      }}));
    };
    config.modal={ondismiss:function(){window.ReactNativeWebView.postMessage(JSON.stringify({type:'cancel'}));}};
    window.onload=function(){
      try{
        const rzp=new Razorpay(config);
        rzp.on('payment.failed',function(r){
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:r.error?r.error.description:'Payment Failed'}));
        });
        rzp.open();
        setTimeout(function(){var l=document.getElementById('loader');if(l)l.style.display='none';},800);
      }catch(err){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',data:err.message||'Could not launch checkout'}));
      }
    };
  </script>
  </body></html>`;
}

export function CashDepositScreen({ navigation }: Props) {
    const insets = useSafeAreaInsets();
    const { isConnected } = useConnectivity();
    const userId = useAppSelector(selectUserId);

    const [collectedAmount, setCollectedAmount] = useState(0);
    const [depositHistory, setDepositHistory] = useState<Array<{ amount: number; date: string; paymentId: string }>>([]);
    const [showRazorpay, setShowRazorpay] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        variant: 'info' | 'success' | 'error' | 'warning';
    } | null>(null);

    const storageKey = userId ? `${COD_STORAGE_KEY_PREFIX}${userId}` : null;
    const historyKey = userId ? `${DEPOSIT_HISTORY_KEY_PREFIX}${userId}` : null;

    // Load collected COD amount & deposit history from AsyncStorage
    useEffect(() => {
        async function load() {
            if (!storageKey || !historyKey) return;
            try {
                const [raw, histRaw] = await Promise.all([
                    AsyncStorage.getItem(storageKey),
                    AsyncStorage.getItem(historyKey),
                ]);
                if (raw) setCollectedAmount(parseFloat(raw) || 0);
                if (histRaw) setDepositHistory(JSON.parse(histRaw) || []);
            } catch { }
        }
        void load();
    }, [storageKey, historyKey]);

    const handleDepositSuccess = async (paymentId: string) => {
        setShowRazorpay(false);
        setIsProcessing(false);
        if (!storageKey || !historyKey) return;
        // Record deposit
        const entry = {
            amount: collectedAmount,
            date: new Date().toISOString(),
            paymentId,
        };
        const updated = [entry, ...depositHistory];
        setDepositHistory(updated);
        setCollectedAmount(0);
        try {
            await Promise.all([
                AsyncStorage.setItem(storageKey, '0'),
                AsyncStorage.setItem(historyKey, JSON.stringify(updated)),
            ]);
        } catch { }
        setToast({ message: '✅ COD deposit successful! ₹' + entry.amount.toFixed(2) + ' sent to Foodie.', variant: 'success' });
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

    const amountPaise = Math.round(collectedAmount * 100);
    const htmlContent = buildRazorpayHtml(amountPaise, 'COD Cash Deposit to Foodie', 'Foodie');

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
                        onPress={() => {
                            if (!isConnected) {
                                setToast({ message: 'No internet connection. Payment requires internet.', variant: 'warning' });
                                return;
                            }
                            setIsProcessing(true);
                            setShowRazorpay(true);
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

                {/* Deposit History */}
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A202C', marginBottom: 16 }}>Deposit History</Text>
                {depositHistory.length === 0 ? (
                    <View style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 20,
                        padding: 32,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: '#E2E8F0',
                    }}>
                        <Feather name="clock" size={32} color="#A0AEC0" />
                        <Text style={{ color: '#A0AEC0', fontWeight: '600', fontSize: 15, marginTop: 12 }}>No deposits yet</Text>
                    </View>
                ) : (
                    depositHistory.map((d, i) => (
                        <View key={i} style={{
                            backgroundColor: '#FFFFFF',
                            borderRadius: 16,
                            padding: 16,
                            marginBottom: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: '#E2E8F0',
                        }}>
                            <View style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: '#F0FDF4',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                            }}>
                                <Feather name="check-circle" size={22} color="#10B981" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A202C' }}>₹{d.amount.toFixed(2)} deposited</Text>
                                <Text style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                                    {new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </Text>
                                <Text style={{ fontSize: 11, color: '#A0AEC0', marginTop: 1 }} numberOfLines={1}>ID: {d.paymentId}</Text>
                            </View>
                            <View style={{
                                backgroundColor: '#DCFCE7',
                                borderRadius: 12,
                                paddingHorizontal: 10,
                                paddingVertical: 4,
                            }}>
                                <Text style={{ fontSize: 12, fontWeight: '800', color: '#14532D' }}>PAID</Text>
                            </View>
                        </View>
                    ))
                )}
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
                        source={{ html: htmlContent, baseUrl: 'https://checkout.razorpay.com' }}
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
