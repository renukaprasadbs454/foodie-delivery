import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Linking, Modal, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface RazorpayOptions {
  key: string;
  amount: number; // in paise
  currency: string;
  order_id?: string;
  name?: string;
  description?: string;
  prefill?: {
    contact?: string;
    email?: string;
    method?: string;
  };
}

interface RazorpayWebViewProps {
  options: RazorpayOptions;
  onSuccess: (data: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onCancel: () => void;
  onError: (error: string) => void;
}

export function RazorpayWebView({
  options,
  onSuccess,
  onCancel,
  onError,
}: RazorpayWebViewProps) {
  const webViewRef = useRef<WebView>(null);

  // The actual Razorpay configuration coming from the backend/frontend params
  const rzpOptions: Record<string, any> = {
    key: options.key,
    amount: options.amount,
    currency: options.currency || 'INR',
    order_id: options.order_id,
    name: options.name || 'Foodie',
    description: options.description || 'Food Order Payment',
    prefill: {
      contact: options.prefill?.contact || '9876543210',
      email: options.prefill?.email || 'customer@foodie.com',
    },
    theme: {
      color: '#14532D',
    },
  };

  // Pure HTML that only loads the OFFICIAL Razorpay Checkout SDK.
  // No custom buttons. No fake payment logic.
  const htmlContext = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Razorpay Payment</title>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      <style>
        body, html {
          margin: 0;
          padding: 0;
          height: 100vh;
          width: 100vw;
          background-color: #ffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .loading-box {
          text-align: center;
          color: #1e293b;
        }
        .spinner {
          width: 44px;
          height: 44px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #14532D;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <div id="loader" class="loading-box">
        <div class="spinner"></div>
        <p style="font-weight: 700; font-size: 16px;">Loading Razorpay Secure Checkout...</p>
      </div>

      <script>
        const config = ${JSON.stringify(rzpOptions)};
        
        // Setup successful payment handler
        config.handler = function(response) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ 
            type: 'success', 
            data: {
              razorpay_payment_id: response.razorpay_payment_id || '',
              razorpay_order_id: response.razorpay_order_id || null,
              razorpay_signature: response.razorpay_signature || null
            } 
          }));
        };
        
        // Setup modal close handler
        config.modal = {
          ondismiss: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'cancel' }));
          },
          animation: true,
          escape: false,
          backdropclose: false
        };

        window.onload = function() {
          try {
            const rzp = new Razorpay(config);
            
            // Handle errors thrown by Razorpay internally
            rzp.on('payment.failed', function (response) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'error', 
                data: response.error ? response.error.description : 'Payment Failed' 
              }));
            });
            
            // Open the OFFICIAL checkout
            rzp.open();
            
            // Hide the native loader once Razorpay is initializing
            setTimeout(function() {
              document.getElementById('loader').style.display = 'none';
            }, 800);
            
          } catch (err) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ 
              type: 'error', 
              data: err.message || 'Could not launch Razorpay Checkout' 
            }));
          }
        };
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContext, baseUrl: 'https://checkout.razorpay.com' }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          originWhitelist={['*']}
          mixedContentMode="always"
          thirdPartyCookiesEnabled={true}
          allowFileAccess={true}
          allowsInlineMediaPlayback={true}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;

            // Handle UPI and Deep Links to native banking apps
            if (
              url.startsWith('upi://') ||
              url.startsWith('phonepe://') ||
              url.startsWith('gpay://') ||
              url.startsWith('paytm://') ||
              url.startsWith('tez://') ||
              url.startsWith('intent://')
            ) {
              Linking.openURL(url).catch(() => {
                console.warn('Could not open native payments app for URL:', url);
              });
              return false;
            }
            return true;
          }}
          onMessage={(event) => {
            try {
              const message = JSON.parse(event.nativeEvent.data);
              if (message.type === 'success') {
                onSuccess(message.data);
              } else if (message.type === 'cancel') {
                onCancel();
              } else if (message.type === 'error') {
                onError(message.data || 'Razorpay payment was unsuccessful.');
              }
            } catch (e) {
              onError('Error communicating with Razorpay Gateway.');
            }
          }}
        />
      </View>
    </Modal>
  );
}
