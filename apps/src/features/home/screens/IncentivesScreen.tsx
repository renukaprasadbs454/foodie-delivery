import React, { useMemo, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Skeleton } from '@/components/Skeleton';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import {
  useGetIncentivesProgressQuery,
  useGetEarningsSummaryQuery,
  useGetIncentiveEarningsQuery,
  type IncentiveOfferProgress,
  type IncentiveMilestone,
} from '@/api/endpoints/incentivesApi';
import { BottomNav } from '@/navigation/BottomNav';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Build an array of 7 consecutive dates centered around today. */
function buildDisplayDays(today: Date, count = 7): Date[] {
  const dates: Date[] = [];
  const startOffset = -1; // e.g. yesterday, today, +5 days
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + startOffset + i);
    dates.push(d);
  }
  return dates;
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

type BadgeType = 'earn_more' | 'special' | null;

function getBadgeForDate(date: Date): BadgeType {
  const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Monday and Tuesday are kickoff days for high-value weekly bonuses ("Special")
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    return 'special';
  }
  // Friday, Saturday, Sunday offer daily surge multipliers ("Earn more")
  if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
    return 'earn_more';
  }
  return null;
}

type Props = NativeStackScreenProps<MainStackParamList, 'Incentives'>;

export function IncentivesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Responsive breakpoints
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;
  const isWide = windowWidth >= 768;

  const now = useMemo(() => new Date(), []);
  const todayMidnight = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const [selectedDate, setSelectedDate] = useState<Date>(todayMidnight);
  const [isAllDayOffersExpanded, setIsAllDayOffersExpanded] = useState<boolean>(true);

  const displayDays = useMemo(() => buildDisplayDays(todayMidnight, 7), [todayMidnight]);
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

  // Fetch summary and history for full verification
  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    refetch: refetchSummary,
    isError: isSummaryError,
  } = useGetEarningsSummaryQuery(undefined, { refetchOnMountOrArgChange: true });

  const {
    isFetching: isHistoryFetching,
    refetch: refetchHistory,
  } = useGetIncentiveEarningsQuery(undefined, { refetchOnMountOrArgChange: true });

  const isRefreshing = isProgressFetching || isSummaryFetching || isHistoryFetching;
  const isInitialLoading = isProgressLoading && isSummaryLoading && !progressData && !summaryData;
  const hasError = isProgressError && isSummaryError && !progressData && !summaryData;

  const handleRefresh = useCallback(() => {
    void Promise.all([refetchProgress(), refetchSummary(), refetchHistory()]);
  }, [refetchProgress, refetchSummary, refetchHistory]);

  // Trips completed for selected date
  const tripsCompleted = progressData?.tripsCompleted ?? 0;

  // Selected date offer status: is it today or past/future
  const isSelectedToday = isSameDay(selectedDate, todayMidnight);
  const isSelectedDateLive = isSelectedToday;

  // Formatted date string for the Daily Incentive card (e.g., "Today, 17 Oct" or "Mon, 19 Oct")
  const cardDateLabel = useMemo(() => {
    const dayNum = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()];
    if (isSelectedToday) {
      return `Today, ${dayNum} ${month}`;
    }
    return `${DAY_NAMES[selectedDate.getDay()]}, ${dayNum} ${month}`;
  }, [selectedDate, isSelectedToday]);

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

  // Default standard 4-tier milestone ladder configured by the platform
  const defaultMilestones: IncentiveMilestone[] = useMemo(() => {
    return [
      {
        trips: 6,
        rewardAmount: 50,
        status: tripsCompleted >= 6 ? 'Completed' : 'In Progress',
        remaining: Math.max(0, 6 - tripsCompleted),
        isEarned: tripsCompleted >= 6,
      },
      {
        trips: 9,
        rewardAmount: 75,
        status: tripsCompleted >= 9 ? 'Completed' : (tripsCompleted >= 6 ? 'In Progress' : 'Locked'),
        remaining: Math.max(0, 9 - tripsCompleted),
        isEarned: tripsCompleted >= 9,
      },
      {
        trips: 13,
        rewardAmount: 120,
        status: tripsCompleted >= 13 ? 'Completed' : (tripsCompleted >= 9 ? 'In Progress' : 'Locked'),
        remaining: Math.max(0, 13 - tripsCompleted),
        isEarned: tripsCompleted >= 13,
      },
      {
        trips: 18,
        rewardAmount: 190,
        status: tripsCompleted >= 18 ? 'Completed' : (tripsCompleted >= 13 ? 'In Progress' : 'Locked'),
        remaining: Math.max(0, 18 - tripsCompleted),
        isEarned: tripsCompleted >= 18,
      },
    ];
  }, [tripsCompleted]);

  // Milestone list from active backend config (or standard 4-tier ladder)
  const milestoneList: IncentiveMilestone[] = useMemo(() => {
    if (dailyTargetOffer?.milestones && dailyTargetOffer.milestones.length >= 2) {
      return [...dailyTargetOffer.milestones].sort((a, b) => a.trips - b.trips);
    }
    return defaultMilestones;
  }, [dailyTargetOffer, defaultMilestones]);

  // Maximum reward amount configured (e.g. ₹190)
  const maxConfiguredReward = useMemo(() => {
    if (milestoneList.length > 0) {
      const maxM = milestoneList[milestoneList.length - 1];
      return Math.round(Number(maxM.rewardAmount || 190));
    }
    return 190;
  }, [milestoneList]);

  // Progress percentage across milestones for timeline bar
  const overallMilestoneProgressPct = useMemo(() => {
    if (milestoneList.length === 0) return 0;
    const maxTrips = milestoneList[milestoneList.length - 1].trips;
    if (maxTrips <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((tripsCompleted / maxTrips) * 100)));
  }, [milestoneList, tripsCompleted]);

  // Secondary active offers (e.g. peakHourBonus, weeklyTargetBonus, rainBonus)
  const otherOffers: IncentiveOfferProgress[] = useMemo(() => {
    if (!progressData?.offers) return [];
    return progressData.offers.filter(
      (o) => o.id !== 'dailyTargetBonus' && o.active !== false
    );
  }, [progressData?.offers]);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FFF"
            colors={['#FCD34D', '#10B981']}
          />
        }
      >
        {/* ── Signature Payout-Style Dark Green Gradient Header Arch (Placed inside ScrollView so ENTIRE page scrolls together) ── */}
        <LinearGradient
          colors={['#0F3E22', '#14532D', '#1B6A3A']}
          style={[
            styles.topGradientArch,
            {
              paddingTop: Math.max(insets.top, 14) + 14,
              paddingBottom: isWide ? 44 : 36,
            },
          ]}
        >
          <View style={[styles.headerRow, isWide && styles.responsiveContentContainer]}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Feather name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, isWide && styles.headerTitleWide]}>
                Extra Earning Offers
              </Text>
              <Text style={styles.headerSubtitle}>
                Performance incentives & daily target milestones
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Main Content Container ── */}
        <View style={[styles.pageContentWrapper, isWide && styles.responsiveContentContainer]}>
          {/* ── Horizontal Date Selector Elevated Card (Overlapping gradient arch bottom) ── */}
          <View style={[styles.dateSelectorCard, isWide && styles.dateSelectorCardWide]}>
            <FlatList
              ref={flatListRef}
              data={displayDays}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.toISOString()}
              style={styles.dateFlatList}
              contentContainerStyle={[
                styles.dateListContent,
                isWide && styles.dateListContentWide,
              ]}
              renderItem={({ item: day }) => {
                const isToday = isSameDay(day, todayMidnight);
                const isSelected = isSameDay(day, selectedDate);
                const badge = getBadgeForDate(day);

                return (
                  <Pressable
                    onPress={() => setSelectedDate(day)}
                    style={[styles.dateItemWrapper, isWide && styles.dateItemWrapperWide]}
                    accessibilityRole="button"
                    accessibilityLabel={`${isToday ? 'Today' : DAY_NAMES[day.getDay()]}, ${day.getDate()}`}
                  >
                    {/* Offer Badge Top Pill */}
                    <View style={styles.badgeSlot}>
                      {badge === 'earn_more' && (
                        <View style={styles.earnMoreBadge}>
                          <Text style={styles.earnMoreBadgeText}>Earn more</Text>
                        </View>
                      )}
                      {badge === 'special' && (
                        <View style={styles.specialBadgeRow}>
                          <Text style={styles.crownEmoji}>👑</Text>
                          <View style={styles.specialBadge}>
                            <Text style={styles.specialBadgeText}>Special</Text>
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Date Box */}
                    <View
                      style={[
                        styles.dateBox,
                        isWide && styles.dateBoxWide,
                        isSelected && styles.dateBoxSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dateWeekdayText,
                          isWide && styles.dateWeekdayTextWide,
                          isSelected && styles.dateWeekdayTextSelected,
                        ]}
                      >
                        {isToday ? 'Today' : DAY_NAMES[day.getDay()]}
                      </Text>
                      <Text
                        style={[
                          styles.dateNumberText,
                          isWide && styles.dateNumberTextWide,
                          isSelected && styles.dateNumberTextSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>

                      {/* Selected Bottom Orange Bar */}
                      {isSelected && <View style={styles.selectedUnderline} />}
                    </View>
                  </Pressable>
                );
              }}
            />
          </View>

          {/* ── ALL DAY OFFERS Header with Expand/Collapse ── */}
          <Pressable
            style={[styles.allDayOffersHeader, isWide && styles.allDayOffersHeaderWide]}
            onPress={() => setIsAllDayOffersExpanded((prev) => !prev)}
            accessibilityRole="button"
            accessibilityLabel="Toggle All Day Offers"
          >
            <Text style={[styles.allDayOffersTitle, isWide && styles.allDayOffersTitleWide]}>
              ALL DAY OFFERS
            </Text>
            <Feather
              name={isAllDayOffersExpanded ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#111827"
            />
          </Pressable>

          {/* ── Error Notification State ── */}
          {hasError && (
            <View style={styles.errorCard}>
              <Feather name="alert-circle" size={20} color="#DC2626" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.errorTitle}>Could not load offers</Text>
                <Text style={styles.errorSubtitle}>Tap Retry to refresh data</Text>
              </View>
              <Pressable onPress={handleRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* ── Loading Skeleton ── */}
          {isInitialLoading && (
            <View style={[styles.skeletonCard, isWide && styles.cardWide]}>
              <Skeleton.Block width="40%" height={20} />
              <Skeleton.Block width="60%" height={28} />
              <Skeleton.Block width="100%" height={100} />
            </View>
          )}

          {/* ── Daily Incentive Card ── */}
          {!isInitialLoading && isAllDayOffersExpanded && (
            <View style={[styles.dailyIncentiveCard, isWide && styles.cardWide]}>
              {/* Top Row: Gift Icon, Daily Incentive, LIVE badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Feather name="gift" size={isWide ? 24 : 22} color="#C2410C" style={styles.giftIcon} />
                  <Text style={[styles.dailyIncentiveHeading, isWide && styles.dailyIncentiveHeadingWide]}>
                    Daily Incentive
                  </Text>
                </View>

                {isSelectedDateLive && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </View>

              {/* Date line (e.g. Today, 17 Oct) */}
              <Text style={[styles.cardDateSubtext, isWide && styles.cardDateSubtextWide]}>
                {cardDateLabel}
              </Text>

              {/* Prominent Reward Title */}
              <Text style={[styles.earnUpToHeading, isWide && styles.earnUpToHeadingWide]}>
                Earn upto ₹{maxConfiguredReward} extra
              </Text>

              {/* Milestone Progress Tracker Table */}
              <View style={[styles.milestoneTableContainer, isWide && styles.milestoneTableContainerWide]}>
                {/* Left Column (Row Labels) */}
                <View style={[styles.milestoneLabelsColumn, isWide && styles.milestoneLabelsColumnWide]}>
                  <View style={styles.tableRowHeader}>
                    <Text style={[styles.tableRowLabel, isWide && styles.tableRowLabelWide]}>
                      Incentive
                    </Text>
                  </View>
                  <View style={styles.tableTrackSpacer} />
                  <View style={styles.tableRowFooter}>
                    <Text style={[styles.tableRowLabel, isWide && styles.tableRowLabelWide]}>
                      Trips Count
                    </Text>
                  </View>
                </View>

                {/* Milestones Horizontal Columns */}
                <View style={styles.milestonesTrackContainer}>
                  {/* Continuous Horizontal Track Line Behind Nodes */}
                  <View style={styles.horizontalTrackBg}>
                    <View
                      style={[
                        styles.horizontalTrackFill,
                        { width: `${overallMilestoneProgressPct}%` },
                      ]}
                    />
                  </View>

                  {milestoneList.map((m, idx) => {
                    const isCompleted = m.isEarned || tripsCompleted >= m.trips;
                    const isCurrentTarget =
                      !isCompleted &&
                      (idx === 0 || tripsCompleted >= milestoneList[idx - 1].trips);

                    return (
                      <View key={idx} style={styles.milestoneColumn}>
                        {/* Reward Amount on top */}
                        <Text style={[styles.milestoneRewardText, isWide && styles.milestoneRewardTextWide]}>
                          ₹{Math.round(Number(m.rewardAmount || 0))}
                        </Text>

                        {/* Middle Node on the Track */}
                        <View style={styles.trackNodeSlot}>
                          {isCompleted ? (
                            <View style={styles.completedNode}>
                              <Feather name="check" size={13} color="#FFFFFF" />
                            </View>
                          ) : isCurrentTarget ? (
                            <View style={styles.progressMarkerRow}>
                              {/* Cute Delivery Rocket / Scooter Marker Indicator */}
                              <View style={styles.scooterMarkerBadge}>
                                <Text style={styles.scooterMarkerEmoji}>🚀</Text>
                              </View>
                              <View style={styles.lockNode}>
                                <Feather name="lock" size={11} color="#FFFFFF" />
                              </View>
                            </View>
                          ) : (
                            <View style={styles.lockNode}>
                              <Feather name="lock" size={11} color="#FFFFFF" />
                            </View>
                          )}
                        </View>

                        {/* Trip count at the bottom */}
                        <Text style={[styles.milestoneTripsText, isWide && styles.milestoneTripsTextWide]}>
                          {m.trips}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Outlined Badge: Partner's Current Completed Trips */}
              <View style={[styles.yourTripsBadge, isWide && styles.yourTripsBadgeWide]}>
                <Text style={styles.yourTripsLabel}>
                  Your trips count:{' '}
                  <Text style={styles.yourTripsCountBold}>{tripsCompleted}</Text>
                </Text>
              </View>

              {/* OFFER CONDITIONS Header */}
              <View style={styles.conditionsHeaderRow}>
                <View style={styles.conditionDividerLine} />
                <Text style={[styles.conditionsHeaderText, isWide && styles.conditionsHeaderTextWide]}>
                  OFFER CONDITIONS
                </Text>
                <View style={styles.conditionDividerLine} />
              </View>

              {/* Responsive Conditions Grid (Side-by-side on Laptop/Tablet, Stacked on Mobile) */}
              <View style={[styles.conditionsGrid, isWide && styles.conditionsGridWide]}>
                {/* Condition 1: Mandatory Login Slot */}
                <View style={[styles.conditionSection, isWide && styles.conditionSectionWide]}>
                  <View style={styles.conditionTitleRow}>
                    <Feather name="clock" size={16} color="#4B5563" style={{ marginRight: 8 }} />
                    <Text style={styles.conditionHeading}>
                      Mandatory Login: Complete below slot
                    </Text>
                  </View>

                  <View style={[styles.slotConditionCard, isWide && styles.slotConditionCardWide]}>
                    <View style={styles.slotCardTopRow}>
                      <Text style={styles.slotTimeText}>7pm - 12am</Text>
                      <View style={styles.unselectedRadioCircle} />
                    </View>
                    <Text style={styles.slotDurationText}>4h 30m</Text>
                    {/* Thin progress bar at bottom of slot card */}
                    <View style={styles.slotProgressTrack}>
                      <View style={styles.slotProgressFill} />
                    </View>
                  </View>
                </View>

                {/* Condition 2: Other condition (Order Acceptance) */}
                <View style={[styles.conditionSection, isWide && styles.conditionSectionWide]}>
                  <View style={styles.conditionTitleRow}>
                    <Feather name="clock" size={16} color="#4B5563" style={{ marginRight: 8 }} />
                    <Text style={styles.conditionHeading}>Other condition</Text>
                  </View>

                  <View style={[styles.slotConditionCard, isWide && styles.slotConditionCardWide]}>
                    <View style={styles.slotCardTopRow}>
                      <Text style={styles.otherConditionTitle}>Do not reject</Text>
                      <View style={styles.unselectedRadioCircle} />
                    </View>
                    <Text style={styles.otherConditionSubtext}>more than 1 order</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── Additional Active Surge / Promotion Offers ── */}
          {!isInitialLoading && isAllDayOffersExpanded && otherOffers.length > 0 && (
            <View style={[styles.otherOffersContainer, isWide && styles.otherOffersContainerWide]}>
              {otherOffers.map((offer) => {
                const isOfferEarned = offer.isEarned || offer.status === 'Completed';

                return (
                  <View key={offer.id} style={[styles.secondaryOfferCard, isWide && styles.secondaryOfferCardWide]}>
                    <View style={styles.secondaryOfferHeader}>
                      <View style={styles.secondaryOfferTitleRow}>
                        <View style={styles.secondaryOfferIconWrap}>
                          <Feather
                            name={
                              offer.id.toLowerCase().includes('peak')
                                ? 'zap'
                                : offer.id.toLowerCase().includes('rain')
                                ? 'cloud-rain'
                                : 'award'
                            }
                            size={18}
                            color="#EA580C"
                          />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.secondaryOfferTitle}>{offer.title}</Text>
                          <Text style={styles.secondaryOfferValidity}>
                            {offer.validityPeriod || offer.category}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.secondaryOfferReward}>
                        +₹{Number(offer.rewardAmount || 0).toFixed(0)}
                      </Text>
                    </View>

                    <Text style={styles.secondaryOfferDesc}>{offer.description}</Text>

                    {isOfferEarned && (
                      <View style={styles.offerEarnedTag}>
                        <Feather name="check" size={13} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.offerEarnedTagText}>Earned today</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Space above BottomNav */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Preserve Bottom Navigation */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F2F2F7', // Apple/iOS soft grey background matching Payout page
  },
  mainScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'web' ? 120 : 90,
  },

  /* ── Top Gradient Arch inside ScrollView ── */
  topGradientArch: {
    width: '100%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  /* ── Header Row ── */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
    width: '100%',
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FCD34D', // Gold accent matching Payout screen
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  headerTitleWide: {
    fontSize: 32,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#A7F3D0', // Mint green subtitle
    fontWeight: '600',
  },

  /* ── Page Content Wrapper ── */
  pageContentWrapper: {
    width: '100%',
  },
  responsiveContentContainer: {
    width: '100%',
    maxWidth: 1080,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },

  /* ── Date Selector Elevated Card ── */
  dateSelectorCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -20, // Clean overlap with gradient arch
    borderRadius: 22,
    paddingTop: 12,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  dateSelectorCardWide: {
    marginHorizontal: 0,
    marginTop: -28,
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 20,
  },
  dateFlatList: {
    width: '100%',
  },
  dateListContent: {
    paddingHorizontal: 14,
  },
  dateListContentWide: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    width: '100%',
  },
  dateItemWrapper: {
    alignItems: 'center',
    width: 66,
    marginRight: 6,
  },
  dateItemWrapperWide: {
    flex: 1,
    maxWidth: 136,
    marginRight: 12,
  },
  badgeSlot: {
    height: 24,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
  },
  earnMoreBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  earnMoreBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  specialBadgeRow: {
    alignItems: 'center',
  },
  crownEmoji: {
    fontSize: 12,
    lineHeight: 12,
    marginBottom: -2,
  },
  specialBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  specialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateBox: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 10,
    position: 'relative',
  },
  dateBoxWide: {
    paddingVertical: 10,
    borderRadius: 12,
  },
  dateBoxSelected: {
    backgroundColor: '#FFF7ED', // Soft light peach/orange
  },
  dateWeekdayText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 2,
  },
  dateWeekdayTextWide: {
    fontSize: 14,
    marginBottom: 4,
  },
  dateWeekdayTextSelected: {
    color: '#EA580C',
    fontWeight: '700',
  },
  dateNumberText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
  },
  dateNumberTextWide: {
    fontSize: 26,
    fontWeight: '900',
  },
  dateNumberTextSelected: {
    color: '#EA580C',
    fontWeight: '900',
  },
  selectedUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: '#EA580C',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },

  /* ── ALL DAY OFFERS Section Header ── */
  allDayOffersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  allDayOffersHeaderWide: {
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 16,
  },
  allDayOffersTitle: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#111827',
  },
  allDayOffersTitleWide: {
    fontSize: 15,
    letterSpacing: 1,
  },

  /* ── Daily Incentive Card ── */
  dailyIncentiveCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 16,
  },
  cardWide: {
    marginHorizontal: 0,
    padding: 28,
    borderRadius: 24,
    marginBottom: 24,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftIcon: {
    marginRight: 10,
  },
  dailyIncentiveHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#C2410C', // Rich warm orange
  },
  dailyIncentiveHeadingWide: {
    fontSize: 22,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2', // Soft pink/red
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
    letterSpacing: 0.5,
  },
  cardDateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 6,
  },
  cardDateSubtextWide: {
    fontSize: 15,
    marginTop: 8,
  },
  earnUpToHeading: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    marginTop: 14,
    marginBottom: 18,
    letterSpacing: -0.3,
  },
  earnUpToHeadingWide: {
    fontSize: 28,
    marginTop: 16,
    marginBottom: 22,
    letterSpacing: -0.5,
  },

  /* ── Milestone Table Tracker ── */
  milestoneTableContainer: {
    backgroundColor: '#F1F5F9', // Crisp cool light grey
    borderRadius: 14,
    flexDirection: 'row',
    paddingVertical: 14,
    marginBottom: 16,
    overflow: 'hidden',
  },
  milestoneTableContainerWide: {
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  milestoneLabelsColumn: {
    width: 86,
    paddingLeft: 12,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  milestoneLabelsColumnWide: {
    width: 110,
    paddingLeft: 16,
  },
  tableRowHeader: {
    height: 24,
    justifyContent: 'center',
  },
  tableTrackSpacer: {
    height: 36,
  },
  tableRowFooter: {
    height: 24,
    justifyContent: 'center',
  },
  tableRowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
  },
  tableRowLabelWide: {
    fontSize: 13,
    fontWeight: '700',
  },
  milestonesTrackContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'relative',
    paddingHorizontal: 8,
  },
  horizontalTrackBg: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 40,
    height: 3.5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  horizontalTrackFill: {
    height: 3.5,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  milestoneColumn: {
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
    flex: 1,
  },
  milestoneRewardText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#111827',
    height: 24,
    textAlign: 'center',
  },
  milestoneRewardTextWide: {
    fontSize: 17,
  },
  trackNodeSlot: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#64748B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressMarkerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scooterMarkerBadge: {
    marginRight: -4,
    zIndex: 3,
  },
  scooterMarkerEmoji: {
    fontSize: 14,
  },
  milestoneTripsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    height: 24,
    textAlign: 'center',
  },
  milestoneTripsTextWide: {
    fontSize: 15,
    fontWeight: '800',
  },

  /* ── Current Trips Outlined Badge ── */
  yourTripsBadge: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  yourTripsBadgeWide: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  yourTripsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  yourTripsCountBold: {
    fontWeight: '900',
    color: '#111827',
  },

  /* ── OFFER CONDITIONS ── */
  conditionsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  conditionDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  conditionsHeaderText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: '#111827',
    marginHorizontal: 12,
  },
  conditionsHeaderTextWide: {
    fontSize: 13,
    letterSpacing: 1.5,
  },

  /* ── Conditions Grid (Side-by-side on wide screens) ── */
  conditionsGrid: {
    flexDirection: 'column',
    gap: 14,
  },
  conditionsGridWide: {
    flexDirection: 'row',
    gap: 20,
  },
  conditionSection: {
    marginBottom: 6,
  },
  conditionSectionWide: {
    flex: 1,
    marginBottom: 0,
  },
  conditionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  conditionHeading: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  slotConditionCard: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 14,
    width: 150,
    backgroundColor: '#FFFFFF',
  },
  slotConditionCardWide: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
  },
  slotCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotTimeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  unselectedRadioCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
  },
  slotDurationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
    marginBottom: 6,
  },
  slotProgressTrack: {
    height: 3.5,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  slotProgressFill: {
    height: 3.5,
    width: '28%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  otherConditionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4B5563',
  },
  otherConditionSubtext: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },

  /* ── Secondary Offers ── */
  otherOffersContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  otherOffersContainerWide: {
    paddingHorizontal: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  secondaryOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  secondaryOfferCardWide: {
    flex: 1,
    minWidth: 300,
    padding: 20,
    borderRadius: 20,
  },
  secondaryOfferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryOfferTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  secondaryOfferIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryOfferTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  secondaryOfferValidity: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  secondaryOfferReward: {
    fontSize: 16,
    fontWeight: '900',
    color: '#059669',
  },
  secondaryOfferDesc: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  offerEarnedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
  },
  offerEarnedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  /* ── Error & Skeleton States ── */
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 14,
    marginHorizontal: 16,
    padding: 14,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorSubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 2,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 20,
    gap: 12,
  },
});
