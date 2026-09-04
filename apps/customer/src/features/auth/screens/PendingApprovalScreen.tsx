import React from 'react';
import {
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text } from 'foodie-shared-rn';
import { useAppDispatch } from '../../../store/hooks';
import { clearCredentials } from '../authSlice';
import { useGetMyProfileQuery } from '../../../api/endpoints/usersApi';

export type PendingApprovalScreenProps = {
  status?: string | null;
};

export function PendingApprovalScreen({ status = 'PENDING_APPROVAL' }: PendingApprovalScreenProps) {
  const dispatch = useAppDispatch();
  const { refetch, isFetching } = useGetMyProfileQuery();

  const isSuspended = status === 'SUSPENDED';
  const isRejected = status === 'REJECTED';

  const badgeIcon = isSuspended ? '⛔' : isRejected ? '❌' : '⏳';
  const badgeLabel = isSuspended
    ? 'ACCOUNT SUSPENDED'
    : isRejected
    ? 'REGISTRATION REJECTED'
    : 'AWAITING ADMIN APPROVAL';

  const title = isSuspended
    ? 'Account Suspended'
    : isRejected
    ? 'Registration Rejected'
    : 'Pending Admin Approval';

  const description = isSuspended
    ? 'Your customer account has been suspended by Customer Support. Please contact support if you need help reactivating your account.'
    : isRejected
    ? 'Your customer registration was reviewed and rejected by the admin team. Contact support for further details.'
    : 'Your customer registration has been submitted successfully! An Admin is currently reviewing your application. You will gain full access as soon as your account is approved.';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#14532D" />

      {/* Top Hero Header */}
      <View style={styles.heroHeader}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🍔</Text>
          </View>
          <View style={styles.brandTextCol}>
            <Text style={styles.brandTitle}>FOODIE</Text>
            <Text style={styles.brandTagline}>CUSTOMER DESK</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Text style={styles.badgeIcon}>{badgeIcon}</Text>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      </View>

      {/* Center Body Card */}
      <View style={styles.contentContainer}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={styles.mainIcon}>{badgeIcon}</Text>
          </View>

          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>

          {!isRejected && (
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={isFetching}
              onPress={() => {
                void refetch();
              }}
              style={styles.refreshButton}
            >
              <Text style={styles.refreshButtonText}>
                {isFetching ? 'CHECKING STATUS...' : 'REFRESH APPROVAL STATUS 🔄'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => dispatch(clearCredentials())}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutButtonText}>LOG OUT</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Support Info */}
        <View style={styles.supportBox}>
          <Text style={styles.supportIcon}>💬</Text>
          <Text style={styles.supportText}>
            Need help? Contact Customer Support at{' '}
            <Text style={styles.supportEmail}>support@foodie.com</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  heroHeader: {
    backgroundColor: '#14532D',
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize: 24,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F59E0B',
    letterSpacing: 2,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 1.5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  badgeIcon: {
    fontSize: 14,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 16,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainIcon: {
    fontSize: 36,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#14532D',
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    backgroundColor: '#F59E0B',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  refreshButtonText: {
    color: '#14532D',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoutButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderColor: '#D1D5DB',
    borderWidth: 1,
  },
  logoutButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  supportBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderColor: '#A7F3D0',
    borderWidth: 1,
  },
  supportIcon: {
    fontSize: 18,
  },
  supportText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  supportEmail: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
