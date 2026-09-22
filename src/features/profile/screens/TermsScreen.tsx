import React from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'TermsAndConditions'>;

const THEME_PRIMARY = '#14532D';
const THEME_DARK = '#0F3E22';
const THEME_ACCENT = '#F59E0B';
const THEME_BG = '#F8FAFC';
const THEME_CARD = '#FFFFFF';
const THEME_TEXT_MAIN = '#0F172A';
const THEME_TEXT_MUTED = '#64748B';
const THEME_BORDER = '#E2E8F0';

export function TermsScreen({ navigation }: Props) {
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
            <Text style={styles.headerTitle}>Terms & Conditions</Text>
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
            {'Welcome to the Foodie Delivery Partner Platform operated by [Company Legal Name] ("Foodie", "we", "our", or "us").'}
          </Text>
          <Text style={styles.sectionBody}>
            {'These Terms & Conditions ("Terms") govern your access to and use of the Foodie Delivery Partner mobile application and related services (collectively, the "Services").'}
          </Text>
          <Text style={styles.sectionBody}>
            By registering, accessing, or using the Services, you agree to comply with these Terms. If you do not agree with these Terms, you should not use the Services.
          </Text>
        </View>

        {/* Section 2: Delivery Partner Eligibility */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user-check" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>2. Delivery Partner Eligibility</Text>
          </View>
          <Text style={styles.sectionBody}>
            To register and use the Foodie Delivery Partner platform, you must:
            {'\n'}• Be at least 18 years old.
            {'\n'}• Provide accurate and complete registration information.
            {'\n'}• Provide valid identity and KYC documents when requested.
            {'\n'}• Hold the required driving licence and vehicle documents where applicable.
            {'\n'}• Provide valid and accurate bank/payment information for payouts.
            {'\n'}• Comply with applicable laws and regulations.
          </Text>
          <Text style={styles.sectionBody}>
            Foodie may require additional verification before allowing a Delivery Partner to accept deliveries.
          </Text>
        </View>

        {/* Section 3: Account Registration */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user-plus" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>3. Account Registration</Text>
          </View>
          <Text style={styles.sectionBody}>
            You are responsible for maintaining the accuracy of your account information.
          </Text>
          <Text style={styles.sectionBody}>
            You must:
            {'\n'}• Keep your login credentials confidential.
            {'\n'}• Not allow another person to use your account.
            {'\n'}• Immediately report suspected unauthorized access.
            {'\n'}• Keep your registered mobile number and other account information updated.
          </Text>
          <Text style={styles.sectionBody}>
            You are responsible for activities performed through your account unless caused by unauthorized access that you have promptly reported.
          </Text>
        </View>

        {/* Section 4: KYC and Document Verification */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="shield" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>4. KYC and Document Verification</Text>
          </View>
          <Text style={styles.sectionBody}>
            Before receiving delivery assignments, you may be required to complete the applicable KYC process.
          </Text>
          <Text style={styles.sectionBody}>
            Documents may include:
            {'\n'}• Aadhaar, PAN, Passport, or another accepted identity document.
            {'\n'}• Driving Licence.
            {'\n'}• Vehicle Registration Certificate (RC).
            {'\n'}• Other documents required by Foodie or applicable law.
            {'\n'}• A verification selfie/photo captured through the application.
          </Text>
          <Text style={styles.sectionBody}>
            Submitted documents may be reviewed by authorized Foodie administrators.
          </Text>
          <Text style={styles.sectionBody}>
            Approval of KYC does not guarantee continued access to the platform. Foodie may request updated or additional documents when necessary.
          </Text>
        </View>

        {/* Section 5: Verification Photo and Going Online */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="camera" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>5. Verification Photo and Going Online</Text>
          </View>
          <Text style={styles.sectionBody}>
            The Foodie Delivery Partner application may require a verification photo before you can change your availability to ONLINE.
          </Text>
          <Text style={styles.sectionBody}>
            When required:
            {'\n'}1. You select GO ONLINE.
            {'\n'}2. The application requests camera permission.
            {'\n'}3. You capture a verification photo using the device camera.
            {'\n'}4. The photo is submitted for the applicable verification process.
            {'\n'}5. If verification succeeds, your availability may be changed to ONLINE.
          </Text>
          <Text style={styles.sectionBody}>
            If camera permission is denied, the photo is not captured, the verification is cancelled, or verification fails, you will remain OFFLINE and may not receive new delivery offers.
          </Text>
          <Text style={styles.sectionBody}>
            The verification process does not replace KYC verification.
          </Text>
        </View>

        {/* Section 6: Online and Offline Availability */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="toggle-right" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>6. Online and Offline Availability</Text>
          </View>
          <Text style={styles.sectionBody}>
            Delivery Partners control their availability through the application.
          </Text>
          <Text style={styles.sectionBody}>
            When ONLINE, you may receive delivery offers based on platform availability, location, eligibility, and other operational factors.
          </Text>
          <Text style={styles.sectionBody}>
            When OFFLINE, you should not receive new delivery assignments.
          </Text>
          <Text style={styles.sectionBody}>
            Going online does not guarantee that a delivery order will be assigned to you.
          </Text>
          <Text style={styles.sectionBody}>
            You are responsible for keeping your availability status accurate.
          </Text>
        </View>

        {/* Section 7: Delivery Orders */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="package" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>7. Delivery Orders</Text>
          </View>
          <Text style={styles.sectionBody}>
            When a delivery order is assigned to you, you should review the available order information and follow the applicable acceptance process.
          </Text>
          <Text style={styles.sectionBody}>
            After accepting an order, you are expected to:
            {'\n'}• Proceed to the designated pickup location.
            {'\n'}• Collect the correct order.
            {'\n'}• Handle the order appropriately.
            {'\n'}• Follow pickup and delivery instructions.
            {'\n'}• Proceed to the customer location.
            {'\n'}• Complete applicable verification or OTP requirements.
            {'\n'}• Mark the delivery appropriately after completion.
          </Text>
          <Text style={styles.sectionBody}>
            You should not accept an order that you cannot reasonably complete.
          </Text>
        </View>

        {/* Section 8: Customer OTP and Delivery Confirmation */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="check-square" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>8. Customer OTP and Delivery Confirmation</Text>
          </View>
          <Text style={styles.sectionBody}>
            Where an OTP or other delivery confirmation mechanism is provided, you must follow the applicable verification process before completing the delivery.
          </Text>
          <Text style={styles.sectionBody}>
            You must not request, record, share, or misuse customer verification information except as required to complete the delivery.
          </Text>
          <Text style={styles.sectionBody}>
            You must not falsely mark an order as delivered.
          </Text>
        </View>

        {/* Section 9: Location and Navigation */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="map-pin" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>9. Location and Navigation</Text>
          </View>
          <Text style={styles.sectionBody}>
            The application may use your device location while you are actively performing delivery-related activities.
          </Text>
          <Text style={styles.sectionBody}>
            Location information may be used for:
            {'\n'}• Delivery assignment.
            {'\n'}• Navigation.
            {'\n'}• Pickup and delivery progress.
            {'\n'}• Distance and route estimation.
            {'\n'}• Delivery status updates.
            {'\n'}• Operational and security purposes.
          </Text>
          <Text style={styles.sectionBody}>
            You are responsible for ensuring that location services and required permissions are available when needed for delivery activities.
          </Text>
        </View>

        {/* Section 10: Earnings and Payouts */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="dollar-sign" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>10. Earnings and Payouts</Text>
          </View>
          <Text style={styles.sectionBody}>
            Earnings and applicable adjustments may be reflected in your Foodie wallet or earnings ledger.
          </Text>
          <Text style={styles.sectionBody}>
            Payouts may depend on:
            {'\n'}• Completed deliveries.
            {'\n'}• Applicable incentives or adjustments.
            {'\n'}• Platform records.
            {'\n'}• Applicable deductions.
            {'\n'}• Payment or payout verification.
          </Text>
          <Text style={styles.sectionBody}>
            You must provide accurate bank details for receiving payouts.
          </Text>
          <Text style={styles.sectionBody}>
            Foodie may delay or hold a payout when additional verification, reconciliation, or investigation is reasonably required.
          </Text>
        </View>

        {/* Section 11: COD and Cash Handling */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="credit-card" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>11. COD and Cash Handling</Text>
          </View>
          <Text style={styles.sectionBody}>
            If you are permitted to handle Cash on Delivery (COD) orders, you are responsible for collecting and handling the applicable cash accurately.
          </Text>
          <Text style={styles.sectionBody}>
            You must:
            {'\n'}• Collect the correct amount.
            {'\n'}• Record or confirm the applicable payment status.
            {'\n'}• Keep collected cash secure.
            {'\n'}• Follow the applicable cash deposit process.
            {'\n'}• Maintain any required cash balance or deposit obligations.
          </Text>
          <Text style={styles.sectionBody}>
            COD amounts must not be treated as personal funds.
          </Text>
          <Text style={styles.sectionBody}>
            Any outstanding COD amount or required cash deposit may affect your ability to receive further COD assignments or use certain platform features.
          </Text>
        </View>

        {/* Section 12: Vehicle and Driving Responsibilities */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="truck" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>12. Vehicle and Driving Responsibilities</Text>
          </View>
          <Text style={styles.sectionBody}>
            You are responsible for using a legally permitted and suitable vehicle for delivery activities.
          </Text>
          <Text style={styles.sectionBody}>
            Where applicable, you must maintain:
            {'\n'}• A valid driving licence.
            {'\n'}• Valid vehicle registration.
            {'\n'}• Required insurance.
            {'\n'}• Required permits or certificates.
            {'\n'}• A safe and roadworthy vehicle.
          </Text>
          <Text style={styles.sectionBody}>
            You must follow applicable traffic and road-safety laws.
          </Text>
          <Text style={styles.sectionBody}>
            You must not use the application while driving in a manner that creates a safety risk.
          </Text>
        </View>

        {/* Section 13: Delivery Partner Responsibilities */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>13. Delivery Partner Responsibilities</Text>
          </View>
          <Text style={styles.sectionBody}>
            You agree to:
            {'\n'}• Treat customers and restaurant staff respectfully.
            {'\n'}• Handle food and packages carefully.
            {'\n'}• Follow reasonable delivery instructions.
            {'\n'}• Protect customer and restaurant information.
            {'\n'}• Maintain professional conduct.
            {'\n'}• Follow applicable Foodie procedures.
            {'\n'}• Provide accurate information.
            {'\n'}• Report delivery issues promptly.
          </Text>
          <Text style={styles.sectionBody}>
            You must not misuse customer information obtained through the platform.
          </Text>
        </View>

        {/* Section 14: Prohibited Activities */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="slash" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>14. Prohibited Activities</Text>
          </View>
          <Text style={styles.sectionBody}>
            You must not:
            {'\n'}• Create or operate multiple fraudulent accounts.
            {'\n'}• Share or transfer your account to another person.
            {'\n'}• Provide false KYC information.
            {'\n'}• Upload fraudulent or altered documents.
            {'\n'}• Manipulate delivery status.
            {'\n'}• Falsely claim a delivery was completed.
            {'\n'}• Misuse customer OTPs.
            {'\n'}• Manipulate earnings or delivery records.
            {'\n'}• Misuse COD collections.
            {'\n'}• Attempt to bypass security or verification systems.
            {"\n• Use another person's identity or documents."}
            {'\n'}• Harass, threaten, or abuse customers or restaurant staff.
            {'\n'}• Engage in unlawful activities through the platform.
          </Text>
          <Text style={styles.sectionBody}>
            Foodie may investigate suspected violations and take appropriate action.
          </Text>
        </View>

        {/* Section 15: Customer and Restaurant Interaction */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="message-circle" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>15. Customer and Restaurant Interaction</Text>
          </View>
          <Text style={styles.sectionBody}>
            You are expected to maintain professional and respectful communication with customers and restaurant personnel.
          </Text>
          <Text style={styles.sectionBody}>
            Customer information obtained through the platform must only be used for legitimate delivery purposes.
          </Text>
          <Text style={styles.sectionBody}>
            You must not use customer contact information for personal communication, marketing, solicitation, or any unrelated purpose.
          </Text>
        </View>

        {/* Section 16: App and Account Security */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="lock" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>16. App and Account Security</Text>
          </View>
          <Text style={styles.sectionBody}>
            You are responsible for protecting access to your device and Foodie account.
          </Text>
          <Text style={styles.sectionBody}>
            You must not:
            {'\n'}• Attempt to reverse engineer or compromise the application.
            {'\n'}• Circumvent authentication or security controls.
            {'\n'}• Introduce malicious software.
            {"\n• Access another user's account."}
            {'\n'}• Manipulate application data or API requests.
            {'\n'}• Attempt to interfere with platform operations.
          </Text>
          <Text style={styles.sectionBody}>
            Foodie may restrict access where security concerns are identified.
          </Text>
        </View>

        {/* Section 17: Suspension and Deactivation */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="alert-octagon" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>17. Suspension and Deactivation</Text>
          </View>
          <Text style={styles.sectionBody}>
            Foodie may temporarily restrict, suspend, or deactivate an account where there is a reasonable basis to believe that:
            {'\n'}• These Terms have been violated.
            {'\n'}• KYC information is incomplete or invalid.
            {'\n'}• Fraud or misuse is suspected.
            {'\n'}• Required documents have expired or become invalid.
            {'\n'}• COD or financial reconciliation remains unresolved.
            {'\n'}• Account security has been compromised.
            {'\n'}• Applicable law or regulatory requirements require action.
          </Text>
          <Text style={styles.sectionBody}>
            Where appropriate, Foodie may provide an opportunity to resolve the issue or complete additional verification.
          </Text>
        </View>

        {/* Section 18: Account Deactivation by Delivery Partner */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="user-x" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>18. Account Deactivation by Delivery Partner</Text>
          </View>
          <Text style={styles.sectionBody}>
            You may request account deactivation through the applicable Foodie support process.
          </Text>
          <Text style={styles.sectionBody}>
            Before deactivation, you may need to:
            {'\n'}• Complete or resolve accepted deliveries.
            {'\n'}• Resolve outstanding COD amounts.
            {'\n'}• Complete pending financial reconciliation.
            {'\n'}• Resolve applicable payout issues.
          </Text>
          <Text style={styles.sectionBody}>
            Account deactivation does not automatically eliminate obligations that arose before deactivation.
          </Text>
        </View>

        {/* Section 19: Service Availability */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="server" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>19. Service Availability</Text>
          </View>
          <Text style={styles.sectionBody}>
            Foodie may modify, suspend, or temporarily interrupt portions of the Services for:
            {'\n'}• Maintenance.
            {'\n'}• Security updates.
            {'\n'}• Technical issues.
            {'\n'}• Operational reasons.
            {'\n'}• Legal or regulatory requirements.
          </Text>
          <Text style={styles.sectionBody}>
            Delivery assignments, incentives, availability, or other platform features may vary depending on operational conditions.
          </Text>
        </View>

        {/* Section 20: Privacy and Data Protection */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="eye" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>20. Privacy and Data Protection</Text>
          </View>
          <Text style={styles.sectionBody}>
            Your use of the Services is also subject to the Foodie Delivery Partner Privacy Policy.
          </Text>
          <Text style={styles.sectionBody}>
            The Privacy Policy explains how information such as account details, KYC documents, verification photos, location information, delivery activity, earnings, and other applicable data may be collected and processed.
          </Text>
        </View>

        {/* Section 21: Intellectual Property */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="award" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>21. Intellectual Property</Text>
          </View>
          <Text style={styles.sectionBody}>
            The Foodie application, branding, logos, software, content, and related materials are owned by or licensed to Foodie or its applicable rights holders.
          </Text>
          <Text style={styles.sectionBody}>
            You may use the application only for its intended delivery-partner purposes.
          </Text>
          <Text style={styles.sectionBody}>
            You must not copy, modify, distribute, sell, or commercially exploit Foodie intellectual property without appropriate authorization.
          </Text>
        </View>

        {/* Section 22: Changes to These Terms */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="refresh-cw" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>22. Changes to These Terms</Text>
          </View>
          <Text style={styles.sectionBody}>
            Foodie may update these Terms from time to time to reflect changes to the Services, operational requirements, or applicable legal requirements.
          </Text>
          <Text style={styles.sectionBody}>
            Updated Terms will be made available through the application with an updated effective date.
          </Text>
          <Text style={styles.sectionBody}>
            Your continued use of the Services after an update may be subject to the updated Terms.
          </Text>
        </View>

        {/* Section 23: Governing Law and Dispute Resolution */}
        <View style={styles.policyCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBg}>
              <Feather name="book-open" size={16} color={THEME_PRIMARY} />
            </View>
            <Text style={styles.sectionTitle}>23. Governing Law and Dispute Resolution</Text>
          </View>
          <Text style={styles.sectionBody}>
            These Terms shall be governed by the applicable laws of India, unless otherwise required by applicable law.
          </Text>
          <Text style={styles.sectionBody}>
            Any disputes relating to these Terms or the Services will be handled through the applicable legal and dispute-resolution mechanisms available under Indian law.
          </Text>
          <Text style={styles.sectionBody}>
            The specific jurisdiction, courts, arbitration procedure, and dispute-resolution process should be finalized before production use.
          </Text>
        </View>

        {/* Section 24: Contact and Support */}
        <View style={[styles.policyCard, styles.contactCard]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Feather name="mail" size={16} color={THEME_ACCENT} />
            </View>
            <Text style={[styles.sectionTitle, { color: THEME_TEXT_MAIN }]}>24. Contact and Support</Text>
          </View>
          <Text style={styles.sectionBody}>
            For questions, complaints, account-related issues, or support regarding these Terms, contact:
          </Text>
          <View style={styles.contactDetails}>
            <View style={styles.contactItem}>
              <Feather name="briefcase" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>[Company Legal Name]</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="mail" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>Support Email: [Support Email]</Text>
            </View>
            <View style={styles.contactItem}>
              <Feather name="map-pin" size={15} color={THEME_PRIMARY} />
              <Text style={styles.contactText}>Address: [Company Address]</Text>
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
