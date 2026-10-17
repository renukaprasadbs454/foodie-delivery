import React, { useMemo, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import {
  useGetIncentivesProgressQuery,
  useGetEarningsSummaryQuery,
  useGetIncentiveEarningsQuery,
  type IncentiveOfferProgress,
  type IncentiveMilestone,
  type IncentiveEarningHistory,
} from '@/api/endpoints/incentivesApi';
import { BottomNav } from '@/navigation/BottomNav';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build an array of working-day Date objects centered around today (skipping Sundays). */
function buildWorkingDays(today: Date, count = 7): Date[] {
  const candidates: Date[] = [];
  for (let offset = -30; offset <= 30; offset++) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + offset);
    if (d.getDay() !== 0) {
      candidates.push(d);
    }
  }
  const todayMidnight = new Date(today);
  todayMidnight.setHours(0, 0, 0, 0);
  const todayIdx = candidates.findIndex((d) => d.getTime() === todayMidnight.getTime());
  const start = Math.max(0, todayIdx - 3);
  return candidates.slice(start, start + count);
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatAmount(amount: number | string | null | undefined): string {
  const num = Number(amount);
  if (!Number.isFinite(num)) return '₹0.00';
  return `₹${num.toFixed(2)}`;
}

function formatTransactionDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    const day = d.getDate();
    const month = d.toLocaleString('en-IN', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}, ${timeStr}`;
  } catch {
    return dateStr;
  }
}

type Props = NativeStackScreenProps<MainStackParamList, 'Incentives'>;

export function IncentivesScreen({ navigation }: Props) {
  const { tokens } = useTheme();
  const now = new Date();
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const workingDays = useMemo(() => buildWorkingDays(now), []);
  const flatListRef = useRef<FlatList>(null);

  const selectedDateIso = useMemo(() => formatDateToIso(selectedDate), [selectedDate]);

  // Fetch real-time progress & active offers from backend for selected date
  const {
    data: progressData,
    isLoading: isProgressLoading,
    isFetching: isProgressFetching,
    refetch: refetchProgress,
    isError: isProgressError,
  } = useGetIncentivesProgressQuery({ date: selectedDateIso });

  // Fetch delivery partner earnings summary (regular vs incentive breakdown, earned vs pending)
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    refetch: refetchSummary,
    isError: isSummaryError,
  } = useGetEarningsSummaryQuery(undefined, { refetchOnMountOrArgChange: true });

  // Fetch recent incentive transactions history
  const {
    data: historyData,
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useGetIncentiveEarningsQuery(undefined, { refetchOnMountOrArgChange: true });

  const isRefreshing = isProgressFetching || isSummaryFetching || isHistoryFetching;
  const isInitialLoading = isProgressLoading && isSummaryLoading && !progressData && !summaryData;
  const hasError = isProgressError && isSummaryError && !progressData && !summaryData;

  const handleRefresh = useCallback(() => {
    void Promise.all([refetchProgress(), refetchSummary(), refetchHistory()]);
  }, [refetchProgress, refetchSummary, refetchHistory]);

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Today's trips count
  const tripsCompleted = progressData?.tripsCompleted ?? 0;

  // Total Incentive Earnings actually credited to the partner wallet
  const totalIncentives = summaryData?.incentiveEarnings ?? progressData?.incentivesEarned ?? 0;

  // Earned rewards according to the backend
  const earnedIncentives = summaryData?.earnedIncentives ?? progressData?.incentivesEarned ?? 0;

  // Pending rewards not yet credited
  const pendingIncentives = summaryData?.pendingIncentives ?? 0;

  // Find daily target bonus offer (or first offer with milestones)
  const dailyTargetOffer = useMemo(() => {
    if (!progressData?.offers) return null;
    return (
      progressData.offers.find((o) => o.id === 'dailyTargetBonus') ||
      progressData.offers.find((o) => o.milestones && o.milestones.length > 0) ||
      progressData.offers.find((o) => o.category === 'Target & Mileage') ||
      null
    );
  }, [progressData?.offers]);

  // Milestone list from active backend config
  const milestoneList: IncentiveMilestone[] = useMemo(() => {
    if (dailyTargetOffer?.milestones && dailyTargetOffer.milestones.length > 0) {
      return [...dailyTargetOffer.milestones].sort((a, b) => a.trips - b.trips);
    }
    // Fallback if milestones not returned as an array but target exists
    if (dailyTargetOffer && dailyTargetOffer.target > 0) {
      return [
        {
          trips: dailyTargetOffer.target,
          rewardAmount: dailyTargetOffer.rewardAmount,
          status: dailyTargetOffer.status === 'Completed' || dailyTargetOffer.isEarned ? 'Completed' : 'In Progress',
          remaining: dailyTargetOffer.remaining ?? Math.max(0, dailyTargetOffer.target - tripsCompleted),
          isEarned: dailyTargetOffer.isEarned,
        },
      ];
    }
    return [];
  }, [dailyTargetOffer, tripsCompleted]);

  // Other active incentive offers (e.g. peak hour, rain, weekly, long distance, referral, rating)
  const otherActiveOffers: IncentiveOfferProgress[] = useMemo(() => {
    if (!progressData?.offers) return [];
    return progressData.offers.filter(
      (o) => o.id !== 'dailyTargetBonus' && o.active !== false
    );
  }, [progressData?.offers]);

  // Transaction history from backend
  const transactions: IncentiveEarningHistory[] = useMemo(() => {
    if (summaryData?.recentIncentiveTransactions && summaryData.recentIncentiveTransactions.length > 0) {
      return summaryData.recentIncentiveTransactions;
    }
    if (historyData && historyData.length > 0) {
      return historyData;
    }
    return [];
  }, [summaryData?.recentIncentiveTransactions, historyData]);

  const renderCategoryIcon = (category: string, id: string) => {
    if (id.includes('peak') || id.includes('Peak')) {
      return <Feather name="zap" size={16} color="#F59E0B" />;
    }
    if (id.includes('rain') || id.includes('Rain') || category.includes('Weather')) {
      return <Feather name="cloud-rain" size={16} color="#3B82F6" />;
    }
    if (id.includes('daily') || id.includes('Daily') || id.includes('weekly') || id.includes('Weekly')) {
      return <Feather name="target" size={16} color="#10B981" />;
    }
    if (id.includes('distance') || id.includes('Distance')) {
      return <Feather name="map-pin" size={16} color="#8B5CF6" />;
    }
    if (id.includes('referral') || id.includes('Referral')) {
      return <Feather name="users" size={16} color="#EC4899" />;
    }
    if (id.includes('base') || id.includes('Base')) {
      return <Feather name="dollar-sign" size={16} color="#10B981" />;
    }
    return <Feather name="award" size={16} color="#14532D" />;
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topArch, { height: 180 }]} />

      {/* ── Header ── */}
      <View style={styles.appBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Back">
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View>
            <Text style={styles.appTitle}>Extra Earning Offers</Text>
            <Text style={styles.appSubtitle}>Performance incentives & target milestones</Text>
          </View>
        </View>

        <Pressable
          onPress={handleRefresh}
          style={({ pressed }) => [styles.refreshButton, pressed && { opacity: 0.7 }]}
          accessibilityLabel="Refresh Offers"
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {/* ── Working Days Calendar Strip ── */}
      <View style={styles.calendarStrip}>
        <FlatList
          ref={flatListRef}
          data={workingDays}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.toISOString()}
          contentContainerStyle={styles.calendarContent}
          initialScrollIndex={Math.max(0, workingDays.findIndex((d) => isSameDay(d, todayMidnight)) - 1)}
          getItemLayout={(_, index) => ({ length: 62, offset: 62 * index, index })}
          renderItem={({ item: day }) => {
            const isToday = isSameDay(day, todayMidnight);
            const isSelected = isSameDay(day, selectedDate);
            const isFuture = day.getTime() > todayMidnight.getTime();
            return (
              <Pressable
                onPress={() => setSelectedDate(day)}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected,
                  isToday && !isSelected && styles.dayCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected && styles.dayNameSelected,
                    isToday && !isSelected && styles.dayNameToday,
                    isFuture && !isSelected && styles.dayNameFuture,
                  ]}
                >
                  {isToday ? 'Today' : DAY_NAMES[day.getDay()]}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                    isFuture && !isSelected && styles.dayNumberFuture,
                  ]}
                >
                  {day.getDate()}
                </Text>
                {isSelected && <View style={styles.dayUnderline} />}
              </Pressable>
            );
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#14532D"
            colors={['#10B981', '#F59E0B']}
          />
        }
      >
        {/* ── Error Banner & Retry ── */}
        {hasError && (
          <View style={styles.errorCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Feather name="alert-triangle" size={20} color="#DC2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.errorTitle}>Unable to load latest offers</Text>
                <Text style={styles.errorSubtitle}>Check your connection and tap Retry to reload data.</Text>
              </View>
            </View>
            <Pressable onPress={handleRefresh} style={styles.retryButton}>
              <Feather name="refresh-cw" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── Initial Skeleton State ── */}
        {isInitialLoading && (
          <View style={{ gap: 16 }}>
            <View style={[styles.card, { padding: 18, backgroundColor: '#F0FDF4' }]}>
              <Skeleton.Block width="50%" height={16} />
              <Skeleton.Block width="70%" height={32} />
              <Skeleton.Block width="90%" height={14} />
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={[styles.card, { flex: 1, padding: 16 }]}>
                <Skeleton.Block width="60%" height={14} />
                <Skeleton.Block width="80%" height={24} />
              </View>
              <View style={[styles.card, { flex: 1, padding: 16 }]}>
                <Skeleton.Block width="60%" height={14} />
                <Skeleton.Block width="80%" height={24} />
              </View>
            </View>
          </View>
        )}

        {/* ── SECTION A: Incentive Summary Cards ── */}
        {!isInitialLoading && (
          <View style={{ marginBottom: 20 }}>
            {/* Total Incentive Earnings Card (Light Green Background) */}
            <View style={styles.totalEarningsCard}>
              <View style={styles.totalEarningsHeader}>
                <View style={styles.totalEarningsIconWrap}>
                  <Feather name="award" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.totalEarningsLabel}>TOTAL INCENTIVE EARNINGS</Text>
                  <Text style={styles.totalEarningsSublabel}>Credited directly to wallet</Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Feather name="check" size={12} color="#065F46" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedBadgeText}>Wallet Synced</Text>
                </View>
              </View>

              <Text style={styles.totalEarningsAmount}>
                {formatAmount(totalIncentives)}
              </Text>

              <Text style={styles.totalEarningsFootnote}>
                Total incentives earned and credited based on completed eligible trips
              </Text>
            </View>

            {/* Earned & Pending Side-by-Side Cards */}
            <View style={styles.splitCardsRow}>
              {/* Earned Card */}
              <View style={styles.earnedCard}>
                <View style={styles.miniCardHeader}>
                  <View style={[styles.miniIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Feather name="check-circle" size={16} color="#10B981" />
                  </View>
                  <Text style={styles.miniCardLabel}>Earned</Text>
                </View>
                <Text style={styles.earnedAmountText}>
                  {formatAmount(earnedIncentives)}
                </Text>
                <Text style={styles.miniCardSubtext}>Confirmed by backend</Text>
              </View>

              {/* Pending Card */}
              <View style={styles.pendingCard}>
                <View style={styles.miniCardHeader}>
                  <View style={[styles.miniIconWrap, { backgroundColor: '#FFFBEB' }]}>
                    <Feather name="clock" size={16} color="#F59E0B" />
                  </View>
                  <Text style={styles.miniCardLabel}>Pending</Text>
                </View>
                <Text style={styles.pendingAmountText}>
                  {formatAmount(pendingIncentives)}
                </Text>
                <Text style={styles.miniCardSubtext}>In-progress milestones</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── SECTION B: Today's Milestone Rewards ── */}
        <View style={styles.sectionHeaderWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.sectionIconBadge}>
              <Feather name="target" size={18} color="#14532D" />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Today&apos;s Milestone Rewards</Text>
              <Text style={styles.sectionSubtitle}>
                Progress: <Text style={{ fontWeight: '800', color: '#111827' }}>{tripsCompleted} completed {tripsCompleted === 1 ? 'trip' : 'trips'}</Text> today
              </Text>
            </View>
          </View>
        </View>

        {milestoneList.length > 0 ? (
          <View style={{ marginBottom: 24 }}>
            {milestoneList.map((milestone, idx) => {
              const isCompleted = milestone.isEarned || milestone.status === 'Completed' || tripsCompleted >= milestone.trips;
              const isInProgress = !isCompleted && (milestone.status === 'In Progress' || idx === 0 || tripsCompleted < milestone.trips);
              const progressPct = milestone.trips > 0
                ? Math.min(100, Math.max(0, Math.round((tripsCompleted / milestone.trips) * 100)))
                : 0;
              const remainingTrips = Math.max(0, milestone.trips - tripsCompleted);
              const currentCompleted = Math.min(tripsCompleted, milestone.trips);

              return (
                <View
                  key={idx}
                  style={[
                    styles.milestoneCard,
                    isCompleted && styles.milestoneCardCompleted,
                  ]}
                >
                  {/* Milestone Card Header */}
                  <View style={styles.milestoneCardHeader}>
                    <View style={styles.milestoneTag}>
                      <Text style={styles.milestoneTagText}>Milestone {idx + 1}</Text>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted && styles.statusBadgeCompleted,
                        isInProgress && !isCompleted && styles.statusBadgeInProgress,
                        !isCompleted && !isInProgress && styles.statusBadgeUpcoming,
                      ]}
                    >
                      <Feather
                        name={isCompleted ? 'check-circle' : isInProgress ? 'clock' : 'lock'}
                        size={12}
                        color={isCompleted ? '#047857' : isInProgress ? '#D97706' : '#64748B'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted && styles.statusBadgeTextCompleted,
                          isInProgress && !isCompleted && styles.statusBadgeTextInProgress,
                          !isCompleted && !isInProgress && styles.statusBadgeTextUpcoming,
                        ]}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>

                  {/* Requirements & Reward Row */}
                  <View style={styles.milestoneDetailsRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.milestoneTargetHeading}>
                        {milestone.trips} completed trips
                      </Text>
                      <Text style={styles.milestoneProgressCounter}>
                        Current Progress: <Text style={{ fontWeight: '800', color: '#111827' }}>{currentCompleted} / {milestone.trips} trips</Text>
                      </Text>
                    </View>

                    {/* Configured Reward Badge */}
                    <View style={styles.milestoneRewardBadge}>
                      <Text style={styles.milestoneRewardLabel}>REWARD</Text>
                      <Text style={styles.milestoneRewardAmount}>
                        {formatAmount(milestone.rewardAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar Track */}
                  <View style={styles.milestoneProgressBarContainer}>
                    <View style={styles.milestoneProgressBarTrack}>
                      <View
                        style={[
                          styles.milestoneProgressBarFill,
                          { width: `${progressPct}%` },
                          isCompleted && { backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Footer: Remaining / Achieved indicator */}
                  <View style={styles.milestoneCardFooter}>
                    <Text style={styles.milestonePercentLabel}>
                      {progressPct}% Completed
                    </Text>

                    {isCompleted ? (
                      <View style={styles.milestoneAchievedTag}>
                        <Feather name="check" size={12} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.milestoneAchievedText}>Reward Credited</Text>
                      </View>
                    ) : (
                      <Text style={styles.milestoneRemainingText}>
                        {remainingTrips} {remainingTrips === 1 ? 'trip' : 'trips'} remaining
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Ionicons name="flag-outline" size={32} color="#94A3B8" style={{ marginBottom: 6 }} />
            <Text style={styles.emptyStateTitle}>No Target Milestones</Text>
            <Text style={styles.emptyStateSubtitle}>
              Milestone tiers configured by Admin will automatically appear here.
            </Text>
          </View>
        )}

        {/* ── SECTION C: Other Active Incentive Offers ── */}
        {otherActiveOffers.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={styles.sectionHeaderWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.sectionIconBadge, { backgroundColor: '#FEF3C7' }]}>
                  <Feather name="zap" size={18} color="#D97706" />
                </View>
                <View>
                  <Text style={styles.sectionTitle}>Active Incentive Offers</Text>
                  <Text style={styles.sectionSubtitle}>Surge bonuses, weather surge & performance rewards</Text>
                </View>
              </View>
            </View>

            {otherActiveOffers.map((offer) => {
              const progressPct = offer.target > 0
                ? Math.min(100, Math.max(0, Math.round((offer.currentProgress / offer.target) * 100)))
                : 0;
              const isCompleted = offer.status === 'Completed' || offer.status === 'Earned' || offer.isEarned;
              const isInProgress = offer.status === 'In Progress';

              return (
                <View key={offer.id} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <View style={styles.offerTitleRow}>
                      <View style={styles.offerIconWrap}>
                        {renderCategoryIcon(offer.category, offer.id)}
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.offerTitle}>{offer.title}</Text>
                        <Text style={styles.offerValidity}>{offer.validityPeriod || offer.category}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted && styles.statusBadgeCompleted,
                        isInProgress && styles.statusBadgeInProgress,
                        !isCompleted && !isInProgress && styles.statusBadgeUpcoming,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted && styles.statusBadgeTextCompleted,
                          isInProgress && styles.statusBadgeTextInProgress,
                          !isCompleted && !isInProgress && styles.statusBadgeTextUpcoming,
                        ]}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.offerDescription}>{offer.description}</Text>

                  {/* Progress Bar */}
                  <View style={styles.progressBarSection}>
                    <View style={styles.progressLabelRow}>
                      <Text style={styles.progressCountText}>
                        Progress: <Text style={{ fontWeight: '800', color: '#1A202C' }}>{offer.currentProgress} / {offer.target} {offer.target > 1 ? 'orders' : 'condition'}</Text>
                      </Text>
                      <Text style={styles.progressPercentText}>{progressPct}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View
                        style={[
                          styles.progressBarFill,
                          { width: `${progressPct}%` },
                          isCompleted && { backgroundColor: '#10B981' },
                        ]}
                      />
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.offerFooter}>
                    <View style={styles.rewardTag}>
                      <Feather name="gift" size={14} color="#14532D" style={{ marginRight: 4 }} />
                      <Text style={styles.rewardTagText}>
                        Reward: <Text style={styles.rewardTagAmount}>{formatAmount(offer.rewardAmount)}</Text> {offer.unit ? `(${offer.unit})` : ''}
                      </Text>
                    </View>

                    {offer.remaining != null && offer.remaining > 0 ? (
                      <Text style={styles.remainingText}>{offer.remaining} remaining</Text>
                    ) : isCompleted ? (
                      <View style={styles.earnedPill}>
                        <Feather name="check-circle" size={12} color="#10B981" style={{ marginRight: 4 }} />
                        <Text style={styles.earnedPillText}>Target Achieved</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── SECTION D: Recent Incentive Activity ── */}
        <View style={styles.sectionHeaderWrap}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.sectionIconBadge, { backgroundColor: '#E0E7FF' }]}>
                <Feather name="clock" size={18} color="#4338CA" />
              </View>
              <View>
                <Text style={styles.sectionTitle}>Recent Incentive Activity</Text>
                <Text style={styles.sectionSubtitle}>Verified transaction history</Text>
              </View>
            </View>

            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => [styles.miniRefreshBtn, pressed && { opacity: 0.6 }]}
              accessibilityLabel="Refresh Transactions"
            >
              <Feather name="rotate-cw" size={15} color="#4338CA" />
            </Pressable>
          </View>
        </View>

        {transactions.length > 0 ? (
          <View style={styles.transactionsContainer}>
            {transactions.map((tx, idx) => (
              <View key={tx.id || idx} style={styles.transactionCard}>
                <View style={styles.transactionIconWrap}>
                  <Feather name="arrow-down-left" size={18} color="#15803D" />
                </View>

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.transactionTitle}>
                    {tx.ruleTitle || 'Incentive Reward'}
                  </Text>
                  <Text style={styles.transactionDate}>
                    {formatTransactionDate(tx.earnedAt)}
                  </Text>
                  {tx.referenceType ? (
                    <Text style={styles.transactionReference}>
                      Ref: {tx.referenceType}
                    </Text>
                  ) : null}
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.transactionAmount}>
                    +{formatAmount(tx.amount)}
                  </Text>
                  <View style={styles.creditedPill}>
                    <Text style={styles.creditedPillText}>Credited</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyTransactionsCard}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={32} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTransactionsMessage}>
              “Your incentive transactions will appear here.”
            </Text>
            <Text style={styles.emptyTransactionsSubtext}>
              Complete eligible delivery trips to earn milestone rewards and surge bonuses.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Navigation ── */}
      <BottomNav />
    </View>
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
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A7F3D0',
    marginTop: 2,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // ── Calendar Strip ──
  calendarStrip: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    marginTop: -12,
  },
  calendarContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dayCell: {
    width: 58,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginHorizontal: 2,
    borderRadius: 10,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: '#F59E0B',
  },
  dayCellToday: {
    backgroundColor: '#FFFBEB',
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    marginBottom: 4,
  },
  dayNameSelected: {
    color: '#FFFFFF',
  },
  dayNameToday: {
    color: '#F59E0B',
    fontWeight: '700',
  },
  dayNameFuture: {
    color: '#CBD5E0',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A202C',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dayNumberToday: {
    color: '#F59E0B',
  },
  dayNumberFuture: {
    color: '#CBD5E0',
  },
  dayUnderline: {
    position: 'absolute',
    bottom: 4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 70,
  },
  // ── Error Banner ──
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  // ── Summary Cards (Section A) ──
  totalEarningsCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  totalEarningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalEarningsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalEarningsLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.8,
  },
  totalEarningsSublabel: {
    fontSize: 11,
    color: '#047857',
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  totalEarningsAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: '#064E3B',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  totalEarningsFootnote: {
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
    lineHeight: 16,
  },
  splitCardsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  earnedCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  pendingCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  miniIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCardLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  earnedAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#166534',
    marginBottom: 2,
  },
  pendingAmountText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#B45309',
    marginBottom: 2,
  },
  miniCardSubtext: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // ── Section Headers ──
  sectionHeaderWrap: {
    marginBottom: 12,
  },
  sectionIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  // ── Milestone Cards (Section B) ──
  milestoneCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  milestoneCardCompleted: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  milestoneCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  milestoneTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  milestoneDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  milestoneTargetHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 2,
  },
  milestoneProgressCounter: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  milestoneRewardBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  milestoneRewardLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  milestoneRewardAmount: {
    fontSize: 16,
    fontWeight: '900',
    color: '#15803D',
  },
  milestoneProgressBarContainer: {
    marginBottom: 8,
  },
  milestoneProgressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  milestoneProgressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  milestoneCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  milestonePercentLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  milestoneRemainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  milestoneAchievedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  milestoneAchievedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  // ── Status Badges ──
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  statusBadgeInProgress: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusBadgeUpcoming: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadgeTextCompleted: {
    color: '#047857',
  },
  statusBadgeTextInProgress: {
    color: '#D97706',
  },
  statusBadgeTextUpcoming: {
    color: '#64748B',
  },
  // ── Active Incentive Offer Cards (Section C) ──
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  offerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  offerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  offerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
  },
  offerValidity: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    marginTop: 2,
  },
  offerDescription: {
    fontSize: 13,
    color: '#4A5568',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressBarSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressCountText: {
    fontSize: 12,
    color: '#718096',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14532D',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  rewardTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A5568',
  },
  rewardTagAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14532D',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
  },
  earnedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  earnedPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  // ── Transactions Section (Section D) ──
  miniRefreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsContainer: {
    marginBottom: 24,
    gap: 8,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  transactionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  transactionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  transactionReference: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 4,
  },
  creditedPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  creditedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  emptyTransactionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTransactionsMessage: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyTransactionsSubtext: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
});
