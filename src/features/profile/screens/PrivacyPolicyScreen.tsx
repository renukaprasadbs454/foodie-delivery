import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'PrivacyPolicy'>;

const THEME_PRIMARY = '#14532D';
const THEME_DARK = '#0F3E22';
const THEME_ACCENT = '#F59E0B';
const THEME_BG = '#F8FAFC';
const THEME_CARD = '#FFFFFF';
const THEME_TEXT_MAIN = '#0F172A';
const THEME_TEXT_MUTED = '#64748B';
const THEME_BORDER = '#E2E8F0';

export function PrivacyPolicyScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Top Header Arch with Dark Green Gradient */}
      <LinearGradient
        colors={[THEME_DARK, THEME_PRIMARY, '#1B6A3A']}
        style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSubtitle}>Foodie Delivery Partner Application</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.lastUpdatedBadge}>
          <Feather name="calendar" size={14} color={THEME_ACCENT} />
          <Text style={styles.lastUpdatedText}>Effective Date: [DD Month YYYY]</Text>
        </View>

        {/* Section 1: Introduction */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="info" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>1. Introduction</Text>
          </View>
          <Text style={styles.sectionBody}>
            {'Welcome to the Foodie Delivery Partner Platform operated by [Company Legal Name] ("Foodie", "we", "our", or "us"). We are committed to safeguarding the privacy and personal data of registered delivery partners ("Delivery Partners", "you", or "your").'}
          </Text>
          <Text style={styles.sectionBody}>
            {'This Privacy Policy explains what information we collect, how it is used, and how it is protected when you use the Foodie Delivery Partner mobile application and associated backend services (the "Services").'}
          </Text>
        </View>

        {/* Section 2: Information We Collect */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="database" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>2. Information We Collect</Text>
          </View>
          <Text style={styles.sectionBody}>
            We collect personal, verification, and operational data necessary to manage delivery partner accounts, verify onboarding compliance, assign delivery orders, navigate routes, process earnings and payouts, and reconcile cash collections.
          </Text>
        </View>

        {/* Section 3: Account and Profile Information */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>3. Account and Profile Information</Text>
          </View>
          <Text style={styles.sectionBody}>
            When registering and maintaining your partner profile, we collect your full name, registered mobile phone number, profile photo, vehicle type (Bike, Scooter, Electric Vehicle, or Bicycle), and vehicle registration number.
          </Text>
        </View>

        {/* Section 4: Identity & KYC Information */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="shield" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>4. Identity & KYC Verification</Text>
          </View>
          <Text style={styles.sectionBody}>
            {"To verify partner eligibility before account activation, we collect the following Know-Your-Customer (KYC) documents supported by the application: Identity Proof (Aadhaar, PAN, or Passport), Driving License (front and back), Vehicle Registration Certificate (RC), and a profile selfie captured via the device camera. All uploaded documents undergo verification by platform administrators before account approval."}
          </Text>
        </View>

        {/* Section 5: Camera and Device Permissions */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="camera" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>5. Camera and Device Permissions</Text>
          </View>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Camera Permission, Photo Capture & Verification on Go Online:</Text> {'When you tap "GO ONLINE" to make yourself available for delivery assignments, the application requests camera permission. Once permission is granted, the camera interface opens to capture a verification photo using the device camera. Going ONLINE requires camera permission, photo capture, and successful photo verification. If camera permission is denied, if the camera is cancelled or closed without capturing a photo, or if photo verification fails, you remain in the OFFLINE state and cannot receive delivery offers.'}
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>KYC Selfie Capture:</Text> Camera permission is also used during KYC onboarding to capture your profile photo / selfie for identity verification.
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>No Background Access or Continuous Recording:</Text> The captured photo is used strictly for on-demand verification as implemented by the application. The app does NOT access the camera in the background, does NOT record continuous video, and does NOT perform background surveillance.
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Permission Controls:</Text> You can grant or revoke camera permissions at any time through your device operating system settings.
          </Text>
        </View>

        {/* Section 6: Location Information & Navigation */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="map-pin" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>6. Location Information & Navigation</Text>
          </View>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Active Delivery Location Tracking:</Text> While actively navigating delivery routes in the app, foreground location permissions are used to sample your GPS coordinates. These coordinates are used to calculate navigation paths (via Open Source Routing Machine), display your position on the map, and transmit periodic location updates to the backend.
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Offline & Inactive State:</Text> Location pings are stopped when you are marked OFFLINE or when you exit the active navigation view.
          </Text>
        </View>

        {/* Section 7: Delivery and Order Fulfillment */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="box" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>7. Delivery and Order Fulfillment</Text>
          </View>
          <Text style={styles.sectionBody}>
            We record details of your delivery assignments, including assignment acceptance, timestamps at store arrival, pickup, and customer delivery, distance estimations, and customer delivery verification OTP codes entered upon handover.
          </Text>
        </View>

        {/* Section 8: Payment, Earnings and Payout Information */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="dollar-sign" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>8. Payment, Earnings and Payout Information</Text>
          </View>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Wallet & Ledger:</Text> We maintain an account ledger recording trip credits, base earnings, bonus incentives, and payout transactions.
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Bank Details for Payouts:</Text> To receive payouts, you provide your Bank Name, Account Holder Name, Bank Account Number, and IFSC Code. Payout requests are recorded and submitted to platform administrators for processing.
          </Text>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>Cash on Delivery (COD) Collections:</Text> Cash collected from customers for COD orders is tracked in your floating cash balance. You deposit collected COD funds back to Foodie using the integrated Razorpay checkout interface.
          </Text>
        </View>

        {/* Section 9: How We Use Information */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="cpu" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>9. How We Use Information</Text>
          </View>
          <Text style={styles.sectionBody}>
            We use collected data to:
            {'\n'}• Verify your identity and review KYC compliance.
            {'\n'}• Manage online/offline availability and dispatch delivery offers.
            {'\n'}• Provide route navigation and calculate travel paths.
            {'\n'}• Verify delivery completion using customer OTP verification.
            {'\n'}• Calculate delivery earnings, process bank payout requests, and reconcile COD cash deposits.
            {'\n'}• Authenticate user logins and protect platform security.
          </Text>
        </View>

        {/* Section 10: How We Share Information */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="share-2" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>10. How We Share Information</Text>
          </View>
          <Text style={styles.sectionBody}>
            • <Text style={styles.boldText}>With Customers & Restaurants:</Text> During an active delivery assignment, the customer and restaurant can view your name, vehicle information, profile photo, and delivery progress.
            {'\n'}• <Text style={styles.boldText}>With Payment Processors:</Text> When making COD cash deposits, payment transactions are processed through the integrated Razorpay payment gateway.
            {'\n'}• <Text style={styles.boldText}>With Administrators:</Text> Platform administrators review KYC documents, verify partner profiles, and process payout requests.
            {'\n'}• <Text style={styles.boldText}>No Data Sale:</Text> We do NOT sell, rent, or trade your personal data to third parties for commercial advertising.
          </Text>
        </View>

        {/* Section 11: Data Security & Storage */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="lock" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>11. Data Security & Storage</Text>
          </View>
          <Text style={styles.sectionBody}>
            We protect your data using structured technical controls:
            {'\n'}• Authentication using JSON Web Tokens (JWT).
            {'\n'}• Secure token storage on the device using hardware-backed secure storage (Expo SecureStore).
            {'\n'}• Network communications transmitted over encrypted HTTPS and secure WebSocket (WSS) connections.
            {'\n'}• Server-side role-based authorization to restrict access to authenticated users and authorized administrators.
          </Text>
        </View>

        {/* Section 12: Data Retention */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="archive" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>12. Data Retention</Text>
          </View>
          <Text style={styles.sectionBody}>
            We retain your partner profile, KYC verification records, completed order records, wallet ledger history, and payout requests for as long as your partner account remains registered, and as necessary to comply with legal, accounting, tax, and audit obligations.
          </Text>
        </View>

        {/* Section 13: Partner Rights & Account Controls */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="check-circle" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>13. Partner Rights & Account Controls</Text>
          </View>
          <Text style={styles.sectionBody}>
            You have the right to view and update your profile details and bank payout information in the app, inspect your delivery ledger and payout status, control your online/offline availability, and request account deactivation through Support.
          </Text>
        </View>

        {/* Section 14: Notifications & Live Updates */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="bell" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>14. Notifications & Live Updates</Text>
          </View>
          <Text style={styles.sectionBody}>
            The application registers device push notification tokens (via Expo Notifications) to deliver delivery assignment offers, status updates, and administrative alerts. Live delivery offers are also transmitted in real-time via WebSocket connections when the app is active.
          </Text>
        </View>

        {/* Section 15: Telemetry & App Diagnostics */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="activity" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>15. Telemetry & App Diagnostics</Text>
          </View>
          <Text style={styles.sectionBody}>
            The application contains an internal telemetry module to record user interface events (such as document uploads, location updates, and navigation taps) to monitor application health and diagnose connectivity issues. Sensitive information (such as tokens, passwords, OTPs, and bank details) is sanitized and excluded from event tracking.
          </Text>
        </View>

        {/* Section 16: Third-Party Libraries & Services */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="external-link" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>16. Third-Party Libraries & Services</Text>
          </View>
          <Text style={styles.sectionBody}>
            The application utilizes specific software components and services:
            {'\n'}• <Text style={styles.boldText}>Mapping & Routing:</Text> React Native Maps with Open Source Routing Machine (OSRM) for route calculation.
            {'\n'}• <Text style={styles.boldText}>Payment Gateway:</Text> Razorpay checkout for processing floating Cash on Delivery (COD) deposits.
            {'\n'}• <Text style={styles.boldText}>Expo Device Framework:</Text> Expo modules for camera access, document picking, location sampling, push notification registration, and secure token storage.
          </Text>
        </View>

        {/* Section 17: Account Deactivation */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user-x" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>17. Account Deactivation</Text>
          </View>
          <Text style={styles.sectionBody}>
            If you wish to deactivate or close your delivery partner account, you may submit a request through the Support channel after completing all accepted deliveries, depositing any collected COD cash balances, and receiving final pending payouts.
          </Text>
        </View>

        {/* Section 18: Eligibility & Age Requirement */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="alert-triangle" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>{"18. Eligibility & Age Requirement"}</Text>
          </View>
          <Text style={styles.sectionBody}>
            {"The Foodie Delivery Partner Platform is intended exclusively for individuals who are 18 years of age or older and possess valid government identification and driving credentials (where applicable). We do not onboard minors or knowingly collect information from individuals under 18."}
          </Text>
        </View>

        {/* Section 19: Changes to Privacy Policy */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="refresh-cw" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>19. Changes to Privacy Policy</Text>
          </View>
          <Text style={styles.sectionBody}>
            We may update this Privacy Policy from time to time to reflect modifications in application functionality or regulatory requirements. Updates will be reflected in the application with an updated effective date.
          </Text>
          <Text style={styles.sectionBody}>
            <Text style={styles.boldText}>Effective Date: </Text>[DD Month YYYY]
          </Text>
        </View>

        {/* Section 20: Contact Us */}
        <View style={[styles.policyCard, styles.contactCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="mail" size={16} color={THEME_ACCENT} />
            </View>
            <Text style={[styles.sectionTitle, { color: THEME_TEXT_MAIN }]}>20. Contact Us & Grievance Redressal</Text>
          </View>
          <Text style={styles.sectionBody}>
            For inquiries, questions, or grievances regarding this Privacy Policy or personal data handling, please contact:
          </Text>
          <View style={styles.contactDetails}>
            <View style={styles.contactItem}>
              <Feather name="briefcase" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>[Company Legal Name]</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="mail" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>[Support Email]</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="map-pin" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>[Company Address]</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_BG,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 16,
    gap: 14,
  },
  lastUpdatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 4,
  },
  lastUpdatedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  policyCard: {
    backgroundColor: THEME_CARD,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: THEME_BORDER,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  contactCard: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: THEME_TEXT_MAIN,
    flex: 1,
  },
  sectionBody: {
    fontSize: 13.5,
    lineHeight: 21,
    color: THEME_TEXT_MUTED,
    marginTop: 4,
  },
  boldText: {
    fontWeight: '700',
    color: THEME_TEXT_MAIN,
  },
  contactDetails: {
    marginTop: 12,
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME_TEXT_MAIN,
  },
});
