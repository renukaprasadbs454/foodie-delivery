import React, { useMemo, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { Text } from '@/components/Text';
import { useTheme } from '@/hooks/useTheme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '@/navigation/types';
import { useGetIncentivesProgressQuery, type IncentiveOfferProgress } from '@/api/endpoints/incentivesApi';
import { useGetWalletLedgerQuery } from '@/api/endpoints/walletApi';
import { BottomNav } from '@/navigation/BottomNav';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build an array of working-day Date objects centered around today.
 *  We show 3 days before today and 3 days after, skipping Sundays. */
function buildWorkingDays(today: Date, count = 7): Date[] {
    const days: Date[] = [];
    const candidates: Date[] = [];
    for (let offset = -30; offset <= 30; offset++) {
        const d = new Date(today);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + offset);
        if (d.getDay() !== 0) { // skip Sunday
            candidates.push(d);
        }
    }
    const todayMidnight = new Date(today);
    todayMidnight.setHours(0, 0, 0, 0);
    const todayIdx = candidates.findIndex(d => d.getTime() === todayMidnight.getTime());
    const start = Math.max(0, todayIdx - 3);
    return candidates.slice(start, start + count);
}

function isSameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function formatDateToIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
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

    // Fetch real-time progress & active offers from backend
    const { data: progressData, isLoading: isProgressLoading } = useGetIncentivesProgressQuery({ date: selectedDateIso });
    const ledgerQuery = useGetWalletLedgerQuery({ page: 0, size: 100, sort: 'createdAt' });

    // Fallback if progress query is pending or empty
    const { fallbackDeliveries, fallbackIncentive } = useMemo(() => {
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        let deliveries = 0;
        let incentive = 0;

        if (ledgerQuery.data) {
            ledgerQuery.data.forEach((entry: any) => {
                const entryDate = new Date(entry.createdAt);
                if (entryDate >= startOfDay && entryDate <= endOfDay) {
                    if (entry.referenceType === 'DELIVERY_EARNING' || entry.referenceType === 'DELIVERY_ASSIGNMENT') {
                        deliveries++;
                    } else if (entry.referenceType === 'INCENTIVE') {
                        incentive += entry.amount;
                    }
                }
            });
        }
        return { fallbackDeliveries: deliveries, fallbackIncentive: incentive };
    }, [ledgerQuery.data, selectedDate]);

    const tripsCompleted = progressData?.tripsCompleted ?? fallbackDeliveries;
    const incentivesEarned = progressData?.incentivesEarned ?? fallbackIncentive;
    const activeOffers: IncentiveOfferProgress[] = progressData?.offers || [];

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

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

            <View style={styles.appBar}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#FFFFFF" />
                </Pressable>
                <Text style={styles.appTitle}>Extra Earning Offers</Text>
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
                    initialScrollIndex={Math.max(0, workingDays.findIndex(d => isSameDay(d, todayMidnight)) - 1)}
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
                                <Text style={[
                                    styles.dayName,
                                    isSelected && styles.dayNameSelected,
                                    isToday && !isSelected && styles.dayNameToday,
                                    isFuture && !isSelected && styles.dayNameFuture,
                                ]}>
                                    {isToday ? 'Today' : DAY_NAMES[day.getDay()]}
                                </Text>
                                <Text style={[
                                    styles.dayNumber,
                                    isSelected && styles.dayNumberSelected,
                                    isToday && !isSelected && styles.dayNumberToday,
                                    isFuture && !isSelected && styles.dayNumberFuture,
                                ]}>
                                    {day.getDate()}
                                </Text>
                                {isSelected && <View style={styles.dayUnderline} />}
                            </Pressable>
                        );
                    }}
                />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Today's Incentives Progress ── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {isSameDay(selectedDate, todayMidnight) ? "Today's Incentives Progress" : `${DAY_NAMES[selectedDate.getDay()]} ${selectedDate.getDate()} — Incentives`}
                    </Text>

                    <View style={styles.progressSection}>
                        <View style={styles.statRow}>
                            <Feather name="truck" size={24} color="#F59E0B" />
                            <View style={styles.statInfo}>
                                <Text style={styles.statValue}>{tripsCompleted}</Text>
                                <Text style={styles.statLabel}>Trips Completed</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Feather name="dollar-sign" size={24} color="#14532D" />
                            <View style={styles.statInfo}>
                                <Text style={styles.statValue}>₹{Number(incentivesEarned || 0).toFixed(2)}</Text>
                                <Text style={styles.statLabel}>Incentives Earned</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ── Offer Conditions Header ── */}
                <View style={styles.conditionsDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.conditionsHeader}>OFFER CONDITIONS</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* ── Dynamic Real Active Offers List ── */}
                {activeOffers.length > 0 ? (
                    activeOffers.map((offer) => {
                        const progressPct = offer.target > 0
                            ? Math.min(100, Math.round((offer.currentProgress / offer.target) * 100))
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
                                    <View style={[
                                        styles.statusBadge,
                                        isCompleted && styles.statusBadgeCompleted,
                                        isInProgress && styles.statusBadgeInProgress,
                                        !isCompleted && !isInProgress && styles.statusBadgeUpcoming,
                                    ]}>
                                        <Text style={[
                                            styles.statusBadgeText,
                                            isCompleted && styles.statusBadgeTextCompleted,
                                            isInProgress && styles.statusBadgeTextInProgress,
                                            !isCompleted && !isInProgress && styles.statusBadgeTextUpcoming,
                                        ]}>
                                            {isCompleted ? 'Completed' : (isInProgress ? 'In Progress' : 'Upcoming')}
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
                                        <View style={[
                                            styles.progressBarFill,
                                            { width: `${progressPct}%` },
                                            isCompleted && { backgroundColor: '#10B981' }
                                        ]} />
                                    </View>
                                </View>

                                {/* Reward & Details Footer */}
                                <View style={styles.offerFooter}>
                                    <View style={styles.rewardTag}>
                                        <Feather name="gift" size={14} color="#14532D" style={{ marginRight: 4 }} />
                                        <Text style={styles.rewardTagText}>
                                            Reward: <Text style={styles.rewardTagAmount}>₹{offer.rewardAmount}</Text> {offer.unit ? `(${offer.unit})` : ''}
                                        </Text>
                                    </View>
                                    {offer.remaining != null && offer.remaining > 0 ? (
                                        <Text style={styles.remainingText}>{offer.remaining} remaining</Text>
                                    ) : (
                                        isCompleted ? (
                                            <View style={styles.earnedPill}>
                                                <Feather name="check-circle" size={12} color="#10B981" style={{ marginRight: 4 }} />
                                                <Text style={styles.earnedPillText}>Target Achieved</Text>
                                            </View>
                                        ) : null
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : (
                    <View style={styles.adminMessageCard}>
                        <Ionicons name="information-circle-outline" size={32} color="#718096" style={{ marginBottom: 8 }} />
                        <Text style={styles.adminMessageText}>
                            Conditions are set by the Admin. Active bonus offers configured by the Admin will appear here for your profile.
                        </Text>
                    </View>
                )}
            </ScrollView>
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
        paddingBottom: 24,
        paddingHorizontal: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    // ── Calendar Strip ──
    calendarStrip: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingTop: 8,
        marginTop: -16,
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
    // ── End Calendar Strip ──
    scrollContent: {
        padding: 20,
        paddingBottom: 60,
    },
    card: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1A202C',
        padding: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderColor: '#E2E8F0',
    },
    progressSection: {
        paddingLeft: 16,
        paddingRight: 16,
        paddingBottom: 20,
        paddingTop: 12,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    statInfo: {
        marginLeft: 16,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1A202C',
    },
    statLabel: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginLeft: 40,
    },
    conditionsDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    conditionsHeader: {
        marginHorizontal: 16,
        fontSize: 12,
        fontWeight: '800',
        color: '#1A202C',
        letterSpacing: 1,
    },
    // ── Real Incentive Offer Cards ──
    offerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        marginBottom: 16,
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
        fontSize: 16,
        fontWeight: '700',
        color: '#1A202C',
    },
    offerValidity: {
        fontSize: 11,
        fontWeight: '600',
        color: '#718096',
        marginTop: 2,
    },
    statusBadge: {
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
    adminMessageCard: {
        backgroundColor: '#F1F5F9',
        padding: 24,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    adminMessageText: {
        fontSize: 15,
        color: '#4A5568',
        textAlign: 'center',
        lineHeight: 22,
        fontWeight: '500',
    }
});
