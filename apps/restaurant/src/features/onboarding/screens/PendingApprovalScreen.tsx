import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  trackAnalyticsEvent,
  useConnectivity,
} from 'foodie-shared-rn';
import {
  useGetRestaurantProfileQuery,
  useResubmitRestaurantMutation,
} from '../../../api/endpoints/restaurantsApi';
import { useAppDispatch } from '../../../store/hooks';
import { clearIsNewUser } from '../../auth/authSlice';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { setRestaurantStatus } from '../restaurantOnboardingSlice';
import type { OnboardingStackParamList } from '../../../navigation/types';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'PendingApproval'>;

const BRAND_PRIMARY = '#14532D';
const BRAND_ACCENT = '#F59E0B';

export function PendingApprovalScreen({ navigation }: Props) {
  const { isConnected } = useConnectivity();
  const dispatch = useAppDispatch();

  const query = useGetRestaurantProfileQuery(undefined, {
    pollingInterval: 15_000,
    refetchOnFocus: true,
  });

  const [resubmit, { isLoading: isResubmitting }] = useResubmitRestaurantMutation();

  useEffect(() => {
    trackAnalyticsEvent('restaurant_pending_approval_viewed');
  }, []);

  useEffect(() => {
    const status = query.data?.status;
    if (!status) return;
    dispatch(setRestaurantStatus(status));
    if (status === 'APPROVED') {
      dispatch(clearIsNewUser());
    }
  }, [dispatch, query.data?.status]);

  const status = query.data?.status ?? 'PENDING';
  const rejectionReason = query.data?.rejectionReason;
  const loading = query.isLoading && !query.data;

  const handleResubmit = async () => {
    try {
      await resubmit().unwrap();
      void query.refetch();
    } catch (e) {
      console.error('Failed to resubmit restaurant KYC', e);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isFetching}
            tintColor={BRAND_PRIMARY}
            colors={[BRAND_PRIMARY]}
            onRefresh={() => {
              trackAnalyticsEvent('refresh_tapped');
              void query.refetch();
            }}
          />
        }
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.headerBadge}>APPLICATION STATUS</Text>
              <Text style={styles.headerTitle}>
                {status === 'REJECTED' ? 'Action Required' : 'Approval Progress'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {status === 'REJECTED'
                  ? 'Update your submission to proceed'
                  : 'Verification team is reviewing your documents'}
              </Text>
            </View>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 26 }}>
                {status === 'APPROVED' ? '✅' : status === 'REJECTED' ? '🚫' : '⏳'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stepper */}
        <OnboardingStepper activeIndex={3} />

        {!isConnected ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              ⚠️ Offline — displaying last cached status.
            </Text>
          </View>
        ) : null}

        {loading ? (
          <View style={[styles.card, { alignItems: 'center', paddingVertical: 40 }]}>
            <ActivityIndicator size="large" color={BRAND_PRIMARY} />
            <Text style={{ color: '#64748B', marginTop: 12, fontSize: 14 }}>
              Fetching application status…
            </Text>
          </View>
        ) : status === 'REJECTED' ? (
          /* Rejected State Card */
          <View style={styles.rejectedCard}>
            <View style={styles.statusHeaderRow}>
              <View style={styles.rejectedBadge}>
                <Text style={styles.rejectedBadgeText}>APPLICATION REJECTED</Text>
              </View>
              <Text style={{ fontSize: 20 }}>❌</Text>
            </View>

            <Text style={styles.rejectedTitle}>Updates Required</Text>
            <Text style={styles.rejectedSub}>
              Your restaurant application was reviewed by admin operations and needs revision before activation.
            </Text>

            {rejectionReason ? (
              <View style={styles.reasonBox}>
                <Text style={styles.reasonLabel}>Feedback from Admin Team:</Text>
                <Text style={styles.reasonText}>{rejectionReason}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.resubmitButton,
                pressed && styles.resubmitButtonPressed,
                isResubmitting && styles.buttonDisabled,
              ]}
              onPress={() => void handleResubmit()}
              disabled={isResubmitting}
            >
              {isResubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resubmitButtonText}>
                  🔄 Resubmit Application for Review
                </Text>
              )}
            </Pressable>
          </View>
        ) : (
          /* Pending / Approved State Card */
          <View style={styles.card}>
            <View style={styles.statusHeaderRow}>
              <View
                style={[
                  styles.statusBadge,
                  status === 'APPROVED' ? styles.badgeApproved : styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    status === 'APPROVED'
                      ? styles.badgeApprovedText
                      : styles.badgePendingText,
                  ]}
                >
                  {status === 'APPROVED' ? '✓ APPROVED & LIVE' : '⏳ UNDER REVIEW'}
                </Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>
              {status === 'APPROVED'
                ? 'Welcome to Foodie Partner Network!'
                : status === 'SUSPENDED'
                  ? 'Account Suspended'
                  : 'Verification In Progress'}
            </Text>

            <Text style={styles.cardSub}>
              {status === 'APPROVED'
                ? 'Your restaurant has been verified! Redirecting to your live order dashboard…'
                : 'Our operations team is currently reviewing your restaurant profile, legal documents, and images. Approval takes up to 24 hours.'}
            </Text>
          </View>
        )}

        {/* Action Options */}
        <View style={styles.actionSection}>
          <Text style={styles.sectionHeader}>Manage Registration Data</Text>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => navigation.navigate('RestaurantRegistration')}
          >
            <Text style={styles.actionButtonText}>✏️ Edit Outlet Details</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => navigation.navigate('RestaurantDocuments')}
          >
            <Text style={styles.actionButtonText}>
              📄 Manage Documents (FSSAI / GST / PAN)
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => navigation.navigate('RestaurantImages')}
          >
            <Text style={styles.actionButtonText}>
              🖼️ Update Images (Logo / Cover Photo)
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 48,
  },
  headerCard: {
    backgroundColor: BRAND_PRIMARY,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: BRAND_ACCENT,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: BRAND_ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineBanner: {
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  offlineText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  badgePending: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  badgePendingText: {
    color: '#B45309',
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#16A34A',
  },
  badgeApprovedText: {
    color: '#15803D',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSub: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  rejectedCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EF4444',
    gap: 12,
  },
  rejectedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  rejectedBadgeText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '900',
  },
  rejectedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#991B1B',
  },
  rejectedSub: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 20,
  },
  reasonBox: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 4,
  },
  reasonLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  reasonText: {
    fontSize: 13,
    color: '#450A0A',
    lineHeight: 18,
  },
  resubmitButton: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  resubmitButtonPressed: {
    opacity: 0.85,
  },
  resubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  actionSection: {
    gap: 10,
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: BRAND_PRIMARY,
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonPressed: {
    backgroundColor: '#F8FAFC',
  },
  actionButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
