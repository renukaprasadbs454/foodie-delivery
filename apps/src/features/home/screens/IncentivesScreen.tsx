import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  RefreshControl,
  useWindowDimensions,
  Platform,
  AppState,
  type AppStateStatus,
  Animated,
  Easing,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '@/components/Text';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import {
  useGetIncentivesProgressQuery,
  type IncentiveMilestone,
  type IncentiveConditionProgress,
} from '@/api/endpoints/incentivesApi';
import { getStoredActiveShift, type ActiveShiftData } from '@/features/home/shiftStorage';
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

/** Default 4-milestone ladder matching screenshot */
const DEFAULT_MILESTONES: IncentiveMilestone[] = [
  { trips: 6, rewardAmount: 50, status: 'Locked', remaining: 6, isEarned: false },
  { trips: 9, rewardAmount: 75, status: 'Locked', remaining: 9, isEarned: false },
  { trips: 13, rewardAmount: 120, status: 'Locked', remaining: 13, isEarned: false },
  { trips: 18, rewardAmount: 190, status: 'Locked', remaining: 18, isEarned: false },
];

/** Formats start and end times into clean card display matching screenshot (e.g. "5pm - 11pm") */
export function formatSlotDisplay(startTime?: string, endTime?: string): string {
  if (!startTime || !endTime) return '5pm - 11pm';
  const formatTime = (t: string) => {
    const trimmed = t.trim();
    const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (match12) {
      const h = parseInt(match12[1], 10);
      const m = match12[2] ? parseInt(match12[2], 10) : 0;
      const ampm = match12[3].toLowerCase();
      return m === 0 ? `${h}${ampm}` : `${h}:${String(m).padStart(2, '0')}${ampm}`;
    }
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      const ampm = h >= 12 ? 'pm' : 'am';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
    }
    return trimmed.toLowerCase().replace(':00', '').replace(/\s+/g, '');
  };
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/** Default offer conditions matching screenshot */
const DEFAULT_CONDITIONS: IncentiveConditionProgress[] = [
  {
    id: 'login-slot-1',
    type: 'LOGIN_SLOT',
    title: 'Mandatory Login: Complete below slot',
    value: '5pm - 11pm',
    subtext: '6h',
    status: 'PENDING',
    progressPercentage: 0,
  },
  {
    id: 'order-rej-1',
    type: 'ORDER_REJECTION',
    title: 'Other condition',
    value: 'Do not reject',
    subtext: 'more than 1 order',
    status: 'PENDING',
    progressPercentage: 100,
  },
];

/** Returns an appropriate icon name for each offer type */
export function getOfferIcon(id: string, category?: string): any {
  const lowerId = (id || '').toLowerCase();
  if (lowerId.includes('rain') || lowerId.includes('weather')) return 'cloud-rain';
  if (lowerId.includes('peak') || lowerId.includes('hour') || lowerId.includes('time')) return 'clock';
  if (lowerId.includes('weekly') || lowerId.includes('target')) return 'trending-up';
  if (lowerId.includes('distance') || lowerId.includes('mileage') || lowerId.includes('location')) return 'map-pin';
  if (lowerId.includes('referral')) return 'users';
  if (lowerId.includes('rating') || lowerId.includes('performance')) return 'award';
  if (category === 'Weather & Surge') return 'zap';
  if (category === 'Reward & Rating') return 'award';
  return 'gift';
}

/**
 * Calculates the horizontal percentage position (0% - 100%) of the animated airplane / rocket
 * along the milestone timeline according to delivery partner's completed trips.
 *
 * - 0 trips: at the starting point (just before the 1st milestone)
 * - At milestone trips (e.g. 6, 9, 13, 18): precisely reaches each milestone node
 * - Between milestones: smoothly interpolates across segments
 * - > final milestone: glides to end of track and remains at the end
 */
export function calculateAirplaneProgressPct(trips: number, milestones: IncentiveMilestone[]): number {
  if (!milestones || milestones.length === 0) return 0;
  const N = milestones.length;
  const firstCenterPct = (0.5 / N) * 100;
  const lastCenterPct = ((N - 1 + 0.5) / N) * 100;
  const startPct = Math.max(2, firstCenterPct - 8);
  const endPct = Math.min(98, lastCenterPct + 8);

  if (trips <= 0) {
    return startPct;
  }

  const firstTrips = milestones[0].trips;
  if (trips <= firstTrips) {
    const fraction = trips / firstTrips;
    return startPct + fraction * (firstCenterPct - startPct);
  }

  const lastTrips = milestones[N - 1].trips;
  if (trips >= lastTrips) {
    const extraFraction = Math.min(1, (trips - lastTrips) / 2);
    return lastCenterPct + extraFraction * (endPct - lastCenterPct);
  }

  for (let i = 0; i < N - 1; i++) {
    const tCurrent = milestones[i].trips;
    const tNext = milestones[i + 1].trips;
    if (trips >= tCurrent && trips <= tNext) {
      const segFraction = (trips - tCurrent) / (tNext - tCurrent);
      const cCurrent = ((i + 0.5) / N) * 100;
      const cNext = ((i + 1 + 0.5) / N) * 100;
      return cCurrent + segFraction * (cNext - cCurrent);
    }
  }

  return lastCenterPct;
}

type Props = NativeStackScreenProps<MainStackParamList, 'Incentives'>;

export function IncentivesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
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
    isFetching: isProgressFetching,
    refetch: refetchProgress,
  } = useGetIncentivesProgressQuery({ date: selectedDateIso });

  const handleRefresh = useCallback(() => {
    void refetchProgress();
  }, [refetchProgress]);

  const [activeShift, setActiveShift] = useState<ActiveShiftData | null>(null);

  useEffect(() => {
    let isMounted = true;
    void getStoredActiveShift().then((stored) => {
      if (stored && isMounted) {
        setActiveShift(stored);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Refresh: Screen Focus & 5s polling interval for immediate Admin sync
  useFocusEffect(
    useCallback(() => {
      void refetchProgress();
      void getStoredActiveShift().then((stored) => {
        if (stored) setActiveShift(stored);
      });
      const pollInterval = setInterval(() => {
        void refetchProgress();
      }, 5000);

      return () => {
        clearInterval(pollInterval);
      };
    }, [refetchProgress])
  );

  // Live Refresh: AppState return to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        void refetchProgress();
        void getStoredActiveShift().then((stored) => {
          if (stored) setActiveShift(stored);
        });
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [refetchProgress]);

  // Trips completed for selected date (defaults to 0)
  const tripsCompleted = progressData?.tripsCompleted ?? 0;

  // Selected date offer status: is it today or past/future
  const isSelectedToday = isSameDay(selectedDate, todayMidnight);

  // Formatted date string for the Daily Incentive card (e.g. "Today, 18 Oct")
  const cardDateLabel = useMemo(() => {
    const dayNum = selectedDate.getDate();
    const month = MONTH_NAMES[selectedDate.getMonth()];
    if (isSelectedToday) {
      return `Today, ${dayNum} ${month}`;
    }
    return `${DAY_NAMES[selectedDate.getDay()]}, ${dayNum} ${month}`;
  }, [selectedDate, isSelectedToday]);

  // Find dynamic daily target bonus offer configured for the partner
  const dailyTargetOffer = useMemo(() => {
    if (!progressData?.offers) return null;
    return (
      progressData.offers.find((o) => o.id === 'dailyTargetBonus' && o.active !== false) ||
      progressData.offers.find((o) => o.category === 'Target & Mileage' && (o.milestones?.length ?? 0) > 0 && o.active !== false) ||
      progressData.offers.find((o) => (o.milestones?.length ?? 0) > 0 && o.active !== false) ||
      null
    );
  }, [progressData?.offers]);

  // Other active offers configured in Admin (marked ON)
  const otherActiveOffers = useMemo(() => {
    if (!progressData?.offers) return [];
    return progressData.offers.filter(
      (o) => o.id !== dailyTargetOffer?.id && o.active !== false
    );
  }, [progressData?.offers, dailyTargetOffer]);

  // Milestone list: active backend config or default fallback matching screenshot
  const milestoneList: IncentiveMilestone[] = useMemo(() => {
    if (dailyTargetOffer?.milestones && dailyTargetOffer.milestones.length > 0) {
      return [...dailyTargetOffer.milestones].sort((a, b) => a.trips - b.trips);
    }
    return dailyTargetOffer ? DEFAULT_MILESTONES : [];
  }, [dailyTargetOffer]);

  // Maximum reward amount configured
  const maxConfiguredReward = useMemo(() => {
    if (milestoneList.length > 0) {
      const maxM = milestoneList[milestoneList.length - 1];
      return Math.round(Number(maxM.rewardAmount || 0));
    }
    if (dailyTargetOffer?.rewardAmount) {
      return Math.round(Number(dailyTargetOffer.rewardAmount));
    }
    return 190;
  }, [milestoneList, dailyTargetOffer]);

  // Conditions list: active backend config or default fallback matching screenshot
  const conditionsList: IncentiveConditionProgress[] = useMemo(() => {
    if (dailyTargetOffer?.conditions && dailyTargetOffer.conditions.length > 0) {
      return dailyTargetOffer.conditions.map((cond) => {
        if (cond.type === 'LOGIN_SLOT' && activeShift && (!cond.value || cond.value === '7pm - 12am' || cond.value === '5pm - 11pm')) {
          const formattedShift = formatSlotDisplay(activeShift.startTime, activeShift.endTime);
          return {
            ...cond,
            value: cond.value && cond.value !== '7pm - 12am' && cond.value !== '5pm - 11pm' ? cond.value : formattedShift,
            subtext: activeShift.durationHours
              ? (activeShift.durationHours.includes('h') ? activeShift.durationHours : `${activeShift.durationHours}h`)
              : (cond.subtext || '6h'),
          };
        }
        return cond;
      });
    }

    if (activeShift) {
      const formattedShift = formatSlotDisplay(activeShift.startTime, activeShift.endTime);
      const durationStr = activeShift.durationHours
        ? (activeShift.durationHours.includes('h') ? activeShift.durationHours : `${activeShift.durationHours}h`)
        : '6h';
      return [
        {
          id: 'login-slot-1',
          type: 'LOGIN_SLOT',
          title: 'Mandatory Login: Complete below slot',
          value: formattedShift,
          subtext: durationStr,
          status: 'PENDING',
          progressPercentage: 0,
        },
        DEFAULT_CONDITIONS[1],
      ];
    }

    return DEFAULT_CONDITIONS;
  }, [dailyTargetOffer, activeShift]);

  // Animated Airplane & Progress Track
  const initialAirplanePct = useMemo(
    () => calculateAirplaneProgressPct(tripsCompleted, milestoneList),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const animatedAirplaneProgress = useRef(new Animated.Value(initialAirplanePct)).current;
  const animatedTrackFill = useRef(new Animated.Value(tripsCompleted > 0 ? initialAirplanePct : 0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      setReduceMotion(enabled);
    });
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    const targetAirplanePct = calculateAirplaneProgressPct(tripsCompleted, milestoneList);
    const targetFillPct = tripsCompleted <= 0 ? 0 : targetAirplanePct;
    const duration = reduceMotion ? 0 : 700;

    Animated.parallel([
      Animated.timing(animatedAirplaneProgress, {
        toValue: targetAirplanePct,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animatedTrackFill, {
        toValue: targetFillPct,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [tripsCompleted, milestoneList, reduceMotion]);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isProgressFetching}
            onRefresh={handleRefresh}
            tintColor="#FFF"
            colors={['#FCD34D', '#10B981']}
          />
        }
      >
        {/* ── Signature Dark Green Gradient Header Arch ── */}
        <LinearGradient
          colors={['#0F3E22', '#14532D', '#1B6A3A']}
          style={[
            styles.topGradientArch,
            {
              paddingTop: Math.max(insets.top, 14) + 14,
              paddingBottom: isWide ? 48 : 38,
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
                        <View style={styles.specialBadge}>
                          <Text style={styles.specialBadgeText}>Special</Text>
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

          {/* ── Daily Incentive Card (Rendered only when marked ON in Admin) ── */}
          {isAllDayOffersExpanded && dailyTargetOffer && (
            <View style={[styles.dailyIncentiveCard, isWide && styles.cardWide]}>
              {/* Top Row: Gift Icon, Daily Incentive Title, LIVE badge */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardHeaderLeft}>
                  <Feather name="gift" size={isWide ? 24 : 22} color="#C2410C" style={styles.giftIcon} />
                  <Text style={[styles.dailyIncentiveHeading, isWide && styles.dailyIncentiveHeadingWide]}>
                    {dailyTargetOffer.title || 'Daily Target Bonus'}
                  </Text>
                </View>

                {isSelectedToday && (
                  <View style={styles.liveBadge}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
              </View>

              {/* Date line & validity */}
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
                    <Animated.View
                      style={[
                        styles.horizontalTrackFill,
                        {
                          width: animatedTrackFill.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                          }),
                        },
                      ]}
                    />
                  </View>

                  {/* Floating Animated Airplane / Rocket on Track */}
                  <Animated.View
                    style={[
                      styles.animatedAirplaneWrapper,
                      {
                        left: animatedAirplaneProgress.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                    pointerEvents="none"
                    accessibilityLabel="Delivery trip progress airplane"
                  >
                    <View style={styles.airplaneBadge}>
                      <Text style={styles.airplaneEmoji}>🚀</Text>
                    </View>
                  </Animated.View>

                  {milestoneList.map((m, idx) => {
                    const isCompleted = m.isEarned || (tripsCompleted >= m.trips && m.status === 'Completed');

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

              {/* Responsive Conditions Grid (Side-by-side) */}
              <View style={[styles.conditionsGrid, isWide && styles.conditionsGridWide]}>
                {conditionsList.map((cond) => {
                  const isSatisfied = cond.status === 'SATISFIED';
                  const isFailed = cond.status === 'FAILED';

                  const renderStatusIndicator = () => {
                    if (isSatisfied) {
                      return (
                        <View style={styles.satisfiedRadioCircle}>
                          <Feather name="check" size={10} color="#FFFFFF" />
                        </View>
                      );
                    }
                    if (isFailed) {
                      return (
                        <View style={styles.failedRadioCircle}>
                          <Feather name="x" size={10} color="#FFFFFF" />
                        </View>
                      );
                    }
                    return <View style={styles.unselectedRadioCircle} />;
                  };

                  if (cond.type === 'LOGIN_SLOT') {
                    const progressPct = Math.min(100, Math.max(0, cond.progressPercentage ?? 0));
                    const fillColor = isSatisfied ? '#10B981' : isFailed ? '#EF4444' : '#10B981';

                    return (
                      <View key={cond.id} style={[styles.conditionSection, isWide && styles.conditionSectionWide]}>
                        <View style={styles.conditionTitleRow}>
                          <Feather name="clock" size={16} color="#334155" style={{ marginRight: 8 }} />
                          <Text style={styles.conditionHeading}>{cond.title}</Text>
                        </View>

                        <View style={[styles.slotConditionCard, isWide && styles.slotConditionCardWide]}>
                          <View style={styles.slotCardTopRow}>
                            <Text style={styles.slotTimeText}>{cond.value}</Text>
                            {renderStatusIndicator()}
                          </View>
                          <Text style={styles.slotDurationText}>{cond.subtext}</Text>
                          {/* Live Progress Bar */}
                          <View style={styles.slotProgressTrack}>
                            <View
                              style={[
                                styles.slotProgressFill,
                                {
                                  width: `${progressPct}%`,
                                  backgroundColor: fillColor,
                                },
                              ]}
                            />
                          </View>
                        </View>
                      </View>
                    );
                  }

                  // ORDER_REJECTION or other condition
                  return (
                    <View key={cond.id} style={[styles.conditionSection, isWide && styles.conditionSectionWide]}>
                      <View style={styles.conditionTitleRow}>
                        <Feather name="clock" size={16} color="#334155" style={{ marginRight: 8 }} />
                        <Text style={styles.conditionHeading}>
                          {cond.type === 'ORDER_REJECTION' && cond.title === 'Do not reject'
                            ? 'Other condition'
                            : (cond.title || 'Other condition')}
                        </Text>
                      </View>

                      <View style={[styles.slotConditionCard, isWide && styles.slotConditionCardWide]}>
                        <View style={styles.slotCardTopRow}>
                          <Text style={styles.otherConditionTitle}>{cond.value}</Text>
                          {renderStatusIndicator()}
                        </View>
                        <Text style={styles.otherConditionSubtext}>{cond.subtext}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* ── Other Active Offers Configured in Admin (Rendered only when marked ON) ── */}
          {isAllDayOffersExpanded &&
            otherActiveOffers.map((offer) => {
              const offerIcon = getOfferIcon(offer.id, offer.category);
              const isTargetBased = offer.target > 1;
              const targetTrips = offer.target;
              const progress = offer.currentProgress;
              const progressPct =
                targetTrips > 0 ? Math.min(100, Math.round((progress / targetTrips) * 100)) : 0;

              return (
                <View key={offer.id} style={[styles.secondaryOfferCard, isWide && styles.cardWide]}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <Feather
                        name={offerIcon}
                        size={isWide ? 22 : 20}
                        color="#C2410C"
                        style={styles.giftIcon}
                      />
                      <Text
                        style={[
                          styles.secondaryOfferHeading,
                          isWide && styles.dailyIncentiveHeadingWide,
                        ]}
                      >
                        {offer.title}
                      </Text>
                    </View>

                    {offer.isEarned ? (
                      <View style={styles.earnedBadge}>
                        <Feather name="check" size={12} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.earnedBadgeText}>EARNED</Text>
                      </View>
                    ) : isSelectedToday ? (
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>LIVE</Text>
                      </View>
                    ) : (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>

                  {offer.validityPeriod ? (
                    <Text style={[styles.cardDateSubtext, isWide && styles.cardDateSubtextWide]}>
                      {offer.validityPeriod}
                    </Text>
                  ) : null}

                  <Text style={[styles.secondaryRewardHeading, isWide && styles.earnUpToHeadingWide]}>
                    Earn ₹{Math.round(Number(offer.rewardAmount || 0))}{' '}
                    {offer.unit ? offer.unit.replace('₹', '').replace('/', '').trim() : 'extra'}
                  </Text>

                  {offer.description ? (
                    <Text style={styles.secondaryDescriptionText}>{offer.description}</Text>
                  ) : null}

                  {isTargetBased && (
                    <View style={styles.secondaryProgressWrapper}>
                      <View style={styles.secondaryProgressRow}>
                        <Text style={styles.secondaryProgressLabel}>
                          Target: {targetTrips} orders
                        </Text>
                        <Text style={styles.secondaryProgressRemaining}>
                          {offer.remaining != null && offer.remaining > 0
                            ? `${offer.remaining} remaining`
                            : 'Completed'}
                        </Text>
                      </View>
                      <View style={styles.secondaryTrackBg}>
                        <View style={[styles.secondaryTrackFill, { width: `${progressPct}%` }]} />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}

          {/* ── Empty State when all offers are OFF ── */}
          {isAllDayOffersExpanded && !dailyTargetOffer && otherActiveOffers.length === 0 && (
            <View style={[styles.emptyOffersCard, isWide && styles.cardWide]}>
              <Feather name="gift" size={36} color="#9CA3AF" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyOffersTitle}>No Active Offers</Text>
              <Text style={styles.emptyOffersSubtitle}>
                There are currently no active extra earning offers in your zone. Please check back later!
              </Text>
            </View>
          )}

          {/* Bottom spacing above BottomNav */}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    height: '100%',
    backgroundColor: '#F2F2F7', // iOS/Apple style soft background
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
    color: '#FCD34D', // Gold accent
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

  /* ── Date Selector Elevated Card (Overlapping header arch) ── */
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
  specialBadge: {
    backgroundColor: '#2563EB', // Solid royal blue matching monitor photo
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
    color: '#C2410C',
  },
  dailyIncentiveHeadingWide: {
    fontSize: 22,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
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
    backgroundColor: '#F1F5F9',
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
  animatedAirplaneWrapper: {
    position: 'absolute',
    top: 30,
    marginLeft: -12,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airplaneBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  airplaneEmoji: {
    fontSize: 16,
    lineHeight: 18,
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
    backgroundColor: '#FFFFFF',
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

  /* ── Conditions Grid ── */
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
    width: '100%',
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
  satisfiedRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  failedRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  otherConditionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  otherConditionSubtext: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    marginTop: 8,
  },
  /* ── Secondary / Other Active Offer Cards ── */
  secondaryOfferCard: {
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
  secondaryOfferHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  secondaryRewardHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#C2410C',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  secondaryDescriptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    lineHeight: 18,
    marginTop: 4,
  },
  secondaryProgressWrapper: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  secondaryProgressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryProgressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
  },
  secondaryProgressRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  secondaryTrackBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  secondaryTrackFill: {
    height: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  activeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 14,
  },
  earnedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  /* ── Empty State Card ── */
  emptyOffersCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyOffersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 6,
  },
  emptyOffersSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
