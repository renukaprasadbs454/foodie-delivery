import React, { useMemo, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable, FlatList } from 'react-native';
import { Text, useTheme } from 'foodie-shared-rn';
import { Feather, Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MainStackParamList } from '../../../navigation/types';
import { useGetWalletLedgerQuery } from '../../../api/endpoints/walletApi';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Build an array of working-day Date objects centered around today.
 *  We show 3 days before today and 3 days after, skipping Sundays. */
function buildWorkingDays(today: Date, count = 7): Date[] {
    const days: Date[] = [];
    // Go back up to 6 natural days to collect 3 working days before today
    const candidates: Date[] = [];
    for (let offset = -30; offset <= 30; offset++) {
        const d = new Date(today);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + offset);
        if (d.getDay() !== 0) { // skip Sunday
            candidates.push(d);
        }
    }
    // Find today index in candidates
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

    const ledgerQuery = useGetWalletLedgerQuery({ page: 0, size: 100, sort: 'createdAt' });

    const { deliveriesToday, incentiveToday } = useMemo(() => {
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
                    if (entry.referenceType === 'DELIVERY_EARNING') {
                        deliveries++;
                    } else if (entry.referenceType === 'INCENTIVE') {
                        incentive += entry.amount;
                    }
                }
            });
        }
        return { deliveriesToday: deliveries, incentiveToday: incentive };
    }, [ledgerQuery.data, selectedDate]);

    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    return (
        <View style={styles.container}>
            <View style={styles.appBar}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Feather name="arrow-left" size={24} color="#1A202C" />
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

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        {isSameDay(selectedDate, todayMidnight) ? "Today's Incentives Progress" : `${DAY_NAMES[selectedDate.getDay()]} ${selectedDate.getDate()} — Incentives`}
                    </Text>

                    <View style={styles.progressSection}>
                        <View style={styles.statRow}>
                            <Feather name="truck" size={24} color="#F59E0B" />
                            <View style={styles.statInfo}>
                                <Text style={styles.statValue}>{deliveriesToday}</Text>
                                <Text style={styles.statLabel}>Trips Completed</Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.statRow}>
                            <Feather name="dollar-sign" size={24} color="#10B981" />
                            <View style={styles.statInfo}>
                                <Text style={styles.statValue}>₹{incentiveToday.toFixed(2)}</Text>
                                <Text style={styles.statLabel}>Incentives Earned</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.conditionsDivider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.conditionsHeader}>OFFER CONDITIONS</Text>
                    <View style={styles.dividerLine} />
                </View>

                <View style={styles.adminMessageCard}>
                    <Ionicons name="information-circle-outline" size={32} color="#718096" style={{ marginBottom: 8 }} />
                    <Text style={styles.adminMessageText}>
                        Conditions are set by the Admin. Additional bonus conditions and details will appear here once the Admin configures them for your profile.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    appTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1A202C',
    },
    // ── Calendar Strip ──
    calendarStrip: {
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: '#FFFFFF',
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
        backgroundColor: '#FF5722',
    },
    dayCellToday: {
        backgroundColor: '#FFF3EE',
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
        color: '#FF5722',
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
        color: '#FF5722',
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
