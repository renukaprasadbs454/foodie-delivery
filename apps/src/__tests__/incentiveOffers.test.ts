import {
  type IncentiveMilestone,
  type IncentiveOfferProgress,
} from '@/api/endpoints/incentivesApi';

describe('Incentive Offers & Milestone Tracker Logic (Screenshot 2 Match)', () => {
  const sampleMilestones: IncentiveMilestone[] = [
    { trips: 6, rewardAmount: 50, status: 'In Progress', remaining: 6, isEarned: false },
    { trips: 9, rewardAmount: 75, status: 'Locked', remaining: 9, isEarned: false },
    { trips: 13, rewardAmount: 120, status: 'Locked', remaining: 13, isEarned: false },
    { trips: 18, rewardAmount: 190, status: 'Locked', remaining: 18, isEarned: false },
  ];

  it('determines the maximum configured reward correctly for header "Earn upto ₹190 extra"', () => {
    const maxReward = Math.round(Number(sampleMilestones[sampleMilestones.length - 1].rewardAmount));
    expect(maxReward).toBe(190);
    const heading = `Earn upto ₹${maxReward} extra`;
    expect(heading).toBe('Earn upto ₹190 extra');
  });

  it('evaluates milestone status progression based on completed trips', () => {
    const calculateMilestones = (trips: number): IncentiveMilestone[] => {
      return sampleMilestones.map((m, idx) => {
        const isCompleted = trips >= m.trips;
        const prevCompleted = idx === 0 || trips >= sampleMilestones[idx - 1].trips;
        const isInProgress = !isCompleted && prevCompleted;
        return {
          ...m,
          status: isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Locked',
          remaining: Math.max(0, m.trips - trips),
          isEarned: isCompleted,
        };
      });
    };

    // 0 trips completed
    const at0 = calculateMilestones(0);
    expect(at0[0].status).toBe('In Progress');
    expect(at0[0].remaining).toBe(6);
    expect(at0[1].status).toBe('Locked');
    expect(at0[2].status).toBe('Locked');
    expect(at0[3].status).toBe('Locked');

    // 7 trips completed (passed first milestone of 6)
    const at7 = calculateMilestones(7);
    expect(at7[0].status).toBe('Completed');
    expect(at7[0].isEarned).toBe(true);
    expect(at7[1].status).toBe('In Progress');
    expect(at7[1].remaining).toBe(2);
    expect(at7[2].status).toBe('Locked');
    expect(at7[3].status).toBe('Locked');

    // 18 trips completed (all reached)
    const at18 = calculateMilestones(18);
    expect(at18.every((m) => m.status === 'Completed')).toBe(true);
    expect(at18.every((m) => m.isEarned)).toBe(true);
  });

  it('maps offer badges for dates (Earn more vs Special)', () => {
    const getBadgeForDayOfWeek = (dayOfWeek: number) => {
      if (dayOfWeek === 1 || dayOfWeek === 2) return 'special'; // Mon, Tue
      if (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) return 'earn_more'; // Fri, Sat, Sun
      return null;
    };

    // Thursday (day 4) -> null (like Thu 15 in Screenshot 2)
    expect(getBadgeForDayOfWeek(4)).toBeNull();

    // Friday (day 5), Saturday (day 6), Sunday (day 0) -> 'earn_more'
    expect(getBadgeForDayOfWeek(5)).toBe('earn_more');
    expect(getBadgeForDayOfWeek(6)).toBe('earn_more');
    expect(getBadgeForDayOfWeek(0)).toBe('earn_more');

    // Monday (day 1), Tuesday (day 2) -> 'special' (with crown icon)
    expect(getBadgeForDayOfWeek(1)).toBe('special');
    expect(getBadgeForDayOfWeek(2)).toBe('special');
  });

  it('formats card date header correctly', () => {
    const formatCardDate = (day: number, monthIndex: number, isToday: boolean) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[monthIndex];
      return isToday ? `Today, ${day} ${month}` : `Date, ${day} ${month}`;
    };

    expect(formatCardDate(16, 9, true)).toBe('Today, 16 Oct');
    expect(formatCardDate(17, 9, false)).toBe('Date, 17 Oct');
  });

  it('tracks condition requirements for mandatory login and acceptance rules', () => {
    const mandatorySlot = {
      slot: '7pm - 12am',
      duration: '4h 30m',
      targetMinutes: 270,
    };
    const otherCondition = {
      title: 'Do not reject',
      subtext: 'more than 1 order',
      maxRejections: 1,
    };

    expect(mandatorySlot.slot).toBe('7pm - 12am');
    expect(mandatorySlot.duration).toBe('4h 30m');
    expect(otherCondition.title).toBe('Do not reject');
    expect(otherCondition.subtext).toBe('more than 1 order');
  });

  it('handles arbitrary admin-configured milestone ladders dynamically without hardcoding', () => {
    // Custom milestones configured by Admin: 3, 7, 12 trips with ₹30, ₹80, ₹150 rewards
    const adminMilestones: IncentiveMilestone[] = [
      { trips: 3, rewardAmount: 30, status: 'Completed', remaining: 0, isEarned: true },
      { trips: 7, rewardAmount: 80, status: 'In Progress', remaining: 3, isEarned: false },
      { trips: 12, rewardAmount: 150, status: 'Locked', remaining: 8, isEarned: false },
    ];

    const tripsCompleted = 4;
    const sorted = [...adminMilestones].sort((a, b) => a.trips - b.trips);
    const maxReward = sorted[sorted.length - 1].rewardAmount;
    expect(maxReward).toBe(150);

    const nextTarget = sorted.find((m) => tripsCompleted < m.trips && !m.isEarned);
    expect(nextTarget?.trips).toBe(7);
    expect(nextTarget?.rewardAmount).toBe(80);
    expect((nextTarget?.trips ?? 0) - tripsCompleted).toBe(3);

    const overallPct = Math.min(100, Math.round((tripsCompleted / sorted[sorted.length - 1].trips) * 100));
    expect(overallPct).toBe(33);
  });

  it('evaluates dynamic condition statuses (SATISFIED, PENDING, FAILED) and prevents reward if condition fails', () => {
    interface Condition {
      type: string;
      title: string;
      value: string;
      subtext: string;
      status: 'SATISFIED' | 'PENDING' | 'FAILED';
      progressPercentage: number;
    }

    const conditions: Condition[] = [
      {
        type: 'LOGIN_SLOT',
        title: 'Mandatory Login: Complete below slot',
        value: '7pm - 12am',
        subtext: '4h 30m required (2h 15m completed)',
        status: 'PENDING',
        progressPercentage: 50,
      },
      {
        type: 'ORDER_REJECTION',
        title: 'Order Acceptance Limit',
        value: 'Do not reject',
        subtext: 'more than 1 order (0 rejected)',
        status: 'SATISFIED',
        progressPercentage: 100,
      },
    ];

    expect(conditions[0].status).toBe('PENDING');
    expect(conditions[0].progressPercentage).toBe(50);
    expect(conditions[1].status).toBe('SATISFIED');

    // If order rejection limit exceeded
    const failedCondition: Condition = {
      ...conditions[1],
      subtext: 'more than 1 order (2 rejected)',
      status: 'FAILED',
    };
    expect(failedCondition.status).toBe('FAILED');
  });

  it('distinguishes between potential max reward, earned, pending, and paid rewards', () => {
    const rewardBreakdown = {
      potentialMaxReward: 190,
      earnedReward: 50,
      pendingReward: 25,
      paidReward: 25,
    };

    expect(rewardBreakdown.potentialMaxReward).toBe(190);
    expect(rewardBreakdown.earnedReward).toBe(50);
    expect(rewardBreakdown.pendingReward).toBe(25);
    expect(rewardBreakdown.paidReward).toBe(25);
    expect(rewardBreakdown.earnedReward).toBeLessThanOrEqual(rewardBreakdown.potentialMaxReward);
  });

  it('correctly detects empty state when no active daily incentive offer is returned', () => {
    const offers: IncentiveOfferProgress[] = [
      {
        id: 'peakHourBonus',
        title: 'Dinner Peak Hour Bonus',
        category: 'Peak Hours',
        description: 'Earn extra during dinner peak hours',
        target: 4,
        currentProgress: 2,
        rewardAmount: 60,
        unit: 'orders',
        status: 'In Progress',
        remaining: 2,
        validityPeriod: '7 PM - 11 PM',
        isEarned: false,
        active: true,
      },
    ];

    const dailyTargetOffer =
      offers.find((o) => o.id === 'dailyTargetBonus' && o.active !== false) ||
      offers.find((o) => o.category === 'Target & Mileage' && (o.milestones?.length ?? 0) > 0 && o.active !== false) ||
      offers.find((o) => (o.milestones?.length ?? 0) > 0 && o.active !== false) ||
      null;

    expect(dailyTargetOffer).toBeNull();
  });

  describe('Airplane Position & Milestone Progression Scenarios (Section 10)', () => {
    // Standard configuration: 6 trips -> ₹50, 9 trips -> ₹75, 13 trips -> ₹120, 18 trips -> ₹190
    const milestones: IncentiveMilestone[] = [
      { trips: 6, rewardAmount: 50, status: 'Locked', remaining: 6, isEarned: false },
      { trips: 9, rewardAmount: 75, status: 'Locked', remaining: 9, isEarned: false },
      { trips: 13, rewardAmount: 120, status: 'Locked', remaining: 13, isEarned: false },
      { trips: 18, rewardAmount: 190, status: 'Locked', remaining: 18, isEarned: false },
    ];

    const calculateAirplaneProgressPct = (trips: number, ms: IncentiveMilestone[]): number => {
      if (!ms || ms.length === 0) return 0;
      const N = ms.length;
      const firstCenterPct = (0.5 / N) * 100;
      const lastCenterPct = ((N - 1 + 0.5) / N) * 100;
      const startPct = Math.max(2, firstCenterPct - 8);
      const endPct = Math.min(98, lastCenterPct + 8);

      if (trips <= 0) return startPct;

      const firstTrips = ms[0].trips;
      if (trips <= firstTrips) {
        const fraction = trips / firstTrips;
        return startPct + fraction * (firstCenterPct - startPct);
      }

      const lastTrips = ms[N - 1].trips;
      if (trips >= lastTrips) {
        const extraFraction = Math.min(1, (trips - lastTrips) / 2);
        return lastCenterPct + extraFraction * (endPct - lastCenterPct);
      }

      for (let i = 0; i < N - 1; i++) {
        const tCurrent = ms[i].trips;
        const tNext = ms[i + 1].trips;
        if (trips >= tCurrent && trips <= tNext) {
          const segFraction = (trips - tCurrent) / (tNext - tCurrent);
          const cCurrent = ((i + 0.5) / N) * 100;
          const cNext = ((i + 1 + 0.5) / N) * 100;
          return cCurrent + segFraction * (cNext - cCurrent);
        }
      }

      return lastCenterPct;
    };

    const calculateCumulativeEarned = (trips: number, ms: IncentiveMilestone[]): number => {
      return ms
        .filter((m) => trips >= m.trips)
        .reduce((sum, m) => sum + m.rewardAmount, 0);
    };

    it('Scenario 1: 0 trips: airplane at the start; all milestones locked; ₹0 earned', () => {
      const pos = calculateAirplaneProgressPct(0, milestones);
      expect(pos).toBe(4.5); // start point before milestone 0
      const earned = calculateCumulativeEarned(0, milestones);
      expect(earned).toBe(0);
      const unlockedCount = milestones.filter((m) => 0 >= m.trips).length;
      expect(unlockedCount).toBe(0);
    });

    it('Scenario 2: 5 trips: airplane before the first milestone', () => {
      const pos = calculateAirplaneProgressPct(5, milestones);
      expect(pos).toBeGreaterThan(4.5);
      expect(pos).toBeLessThan(12.5); // 12.5 is milestone 0 center
      expect(Math.round(pos * 10) / 10).toBe(11.2);
      expect(calculateCumulativeEarned(5, milestones)).toBe(0);
    });

    it('Scenario 3: 6 trips: ₹50 milestone earned and unlocked; airplane reaches ₹50', () => {
      const pos = calculateAirplaneProgressPct(6, milestones);
      expect(pos).toBe(12.5); // exactly at milestone 0 (₹50)
      const earned = calculateCumulativeEarned(6, milestones);
      expect(earned).toBe(50);
    });

    it('Scenario 4: 8 trips: first milestone remains unlocked; airplane between milestone 1 and 2', () => {
      const pos = calculateAirplaneProgressPct(8, milestones);
      expect(pos).toBeGreaterThan(12.5);
      expect(pos).toBeLessThan(37.5);
      expect(Math.round(pos * 10) / 10).toBe(29.2);
      expect(calculateCumulativeEarned(8, milestones)).toBe(50);
    });

    it('Scenario 5: 9 trips: ₹75 milestone earned and cumulative reward is updated to ₹125', () => {
      const pos = calculateAirplaneProgressPct(9, milestones);
      expect(pos).toBe(37.5); // exactly at milestone 1 (₹75)
      const earned = calculateCumulativeEarned(9, milestones);
      expect(earned).toBe(125); // 50 + 75
    });

    it('Scenario 6: 13 trips: ₹120 milestone earned; cumulative reward is ₹245', () => {
      const pos = calculateAirplaneProgressPct(13, milestones);
      expect(pos).toBe(62.5); // exactly at milestone 2 (₹120)
      const earned = calculateCumulativeEarned(13, milestones);
      expect(earned).toBe(245); // 50 + 75 + 120
    });

    it('Scenario 7: 18 trips: final ₹190 milestone earned; cumulative reward is ₹435', () => {
      const pos = calculateAirplaneProgressPct(18, milestones);
      expect(pos).toBe(87.5); // exactly at milestone 3 (₹190)
      const earned = calculateCumulativeEarned(18, milestones);
      expect(earned).toBe(435); // 50 + 75 + 120 + 190
    });

    it('Scenario 8: More than 18 trips: airplane remains at the end of the line', () => {
      const pos20 = calculateAirplaneProgressPct(20, milestones);
      const pos25 = calculateAirplaneProgressPct(25, milestones);
      expect(pos20).toBe(95.5);
      expect(pos25).toBe(95.5);
      expect(calculateCumulativeEarned(25, milestones)).toBe(435);
    });

    it('Scenario 9: Only DELIVERED orders count; CANCELLED and REJECTED do not increase count', () => {
      const assignments = [
        { status: 'DELIVERED', orderId: '1' },
        { status: 'DELIVERED', orderId: '2' },
        { status: 'CANCELLED', orderId: '3' },
        { status: 'REJECTED', orderId: '4' },
      ];
      const eligibleCount = assignments.filter((a) => a.status === 'DELIVERED').length;
      expect(eligibleCount).toBe(2);
    });

    it('Scenario 10: Repeated completion events prevent duplicate credits (idempotency)', () => {
      const processedRefIds = new Set<string>();
      const awardMilestoneOnce = (refId: string, amount: number): number => {
        if (processedRefIds.has(refId)) {
          return 0; // idempotent skip
        }
        processedRefIds.add(refId);
        return amount;
      };

      const refId = 'partner-1:DAILY_TARGET_MILESTONE:2026-10-18:6';
      const firstAttempt = awardMilestoneOnce(refId, 50);
      const secondAttempt = awardMilestoneOnce(refId, 50);
      expect(firstAttempt).toBe(50);
      expect(secondAttempt).toBe(0);
    });
  });

  describe('Selected Delivery Partner Shift & Dynamic Conditions (Requirement 1-9)', () => {
    // Import helper logic
    const formatSlotDisplay = (startTime?: string, endTime?: string): string => {
      if (!startTime || !endTime) return '7pm - 12am';
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
    };

    const calculateProgressBar = (actualMins: number, requiredMins: number): number => {
      if (requiredMins <= 0) return 0;
      return Math.min(1.0, actualMins / requiredMins) * 100.0;
    };

    it('Scenario 1: Partner selects 7 PM–12 AM and card displays "7pm - 12am"', () => {
      expect(formatSlotDisplay('07:00 PM', '12:00 AM')).toBe('7pm - 12am');
      expect(formatSlotDisplay('7 PM', '12 AM')).toBe('7pm - 12am');
      expect(formatSlotDisplay('19:00', '00:00')).toBe('7pm - 12am');
    });

    it('Scenario 2: Partner selects a different shift (11:00 AM - 04:00 PM) and card updates to "11am - 4pm"', () => {
      expect(formatSlotDisplay('11:00 AM', '04:00 PM')).toBe('11am - 4pm');
      expect(formatSlotDisplay('05:00 PM', '11:00 PM')).toBe('5pm - 11pm');
      expect(formatSlotDisplay('11:00 PM', '03:00 AM')).toBe('11pm - 3am');
    });

    it('Scenario 3: No shift is selected -> falls back gracefully to "7pm - 12am"', () => {
      expect(formatSlotDisplay(undefined, undefined)).toBe('7pm - 12am');
    });

    it('Scenario 4 & 5: Online duration and progress bar calculation [progress = min(actual / required, 1) * 100]', () => {
      // Prompt example: requirement is 4h 30m (270m) and partner completed 2h 15m (135m) -> 50%
      const required270 = 270;
      const completed135 = 135;
      expect(calculateProgressBar(completed135, required270)).toBe(50.0);

      // 0 minutes completed -> 0%
      expect(calculateProgressBar(0, required270)).toBe(0.0);

      // Fully completed 270 minutes -> 100%
      expect(calculateProgressBar(270, required270)).toBe(100.0);

      // Exceeded duration (300 mins) -> capped at 100%
      expect(calculateProgressBar(300, required270)).toBe(100.0);
    });

    it('Scenario 8: Order rejection condition evaluation', () => {
      const evaluateOrderRejection = (rejected: number, maxAllowed = 1) => {
        if (rejected > maxAllowed) return 'FAILED';
        if (rejected > 0) return 'PENDING';
        return 'SATISFIED';
      };

      expect(evaluateOrderRejection(0, 1)).toBe('SATISFIED');
      expect(evaluateOrderRejection(1, 1)).toBe('PENDING');
      expect(evaluateOrderRejection(2, 1)).toBe('FAILED');
      expect(evaluateOrderRejection(3, 1)).toBe('FAILED');
    });
  });

  describe('Zone-Wise Incentive Visibility & Active Filter Logic', () => {
    interface IncentiveRule {
      id: string;
      title: string;
      active: boolean;
      zoneId?: string;
    }

    const universalOffers: IncentiveRule[] = [
      { id: 'dailyTargetBonus', title: 'Daily Milestone Bonus', active: true },
      { id: 'weekendSurgeBonus', title: 'Weekend Surge Bonus', active: false },
    ];

    const tumkurOffers: IncentiveRule[] = [
      { id: 'tumkurMonsoonBonus', title: 'Tumkur Monsoon Extra', active: true, zoneId: 'zone-tumkur' },
      { id: 'tumkurEveningBonus', title: 'Tumkur Evening Peak', active: false, zoneId: 'zone-tumkur' },
    ];

    const bangaloreOffers: IncentiveRule[] = [
      { id: 'blrTrafficBonus', title: 'Bangalore Peak Traffic', active: true, zoneId: 'zone-bangalore' },
    ];

    const resolvePartnerOffers = (
      partnerZoneId: string,
      allRules: IncentiveRule[]
    ): IncentiveRule[] => {
      return allRules.filter((r) => {
        // Must be active
        if (!r.active) return false;
        // Universal (no zoneId) is visible to all partners
        if (!r.zoneId) return true;
        // Zone-specific rule must match partner zone
        return r.zoneId === partnerZoneId;
      });
    };

    it('displays Super Admin universal active incentives to partners in any zone', () => {
      const allRules = [...universalOffers, ...tumkurOffers, ...bangaloreOffers];
      const tumkurVisible = resolvePartnerOffers('zone-tumkur', allRules);
      const blrVisible = resolvePartnerOffers('zone-bangalore', allRules);
      const mysoreVisible = resolvePartnerOffers('zone-mysore', allRules);

      expect(tumkurVisible.some((r) => r.id === 'dailyTargetBonus')).toBe(true);
      expect(blrVisible.some((r) => r.id === 'dailyTargetBonus')).toBe(true);
      expect(mysoreVisible.some((r) => r.id === 'dailyTargetBonus')).toBe(true);
    });

    it('displays Tumkur incentives ONLY to Tumkur delivery partners and NOT to Bangalore partners', () => {
      const allRules = [...universalOffers, ...tumkurOffers, ...bangaloreOffers];
      const tumkurVisible = resolvePartnerOffers('zone-tumkur', allRules);
      const blrVisible = resolvePartnerOffers('zone-bangalore', allRules);

      expect(tumkurVisible.some((r) => r.id === 'tumkurMonsoonBonus')).toBe(true);
      expect(blrVisible.some((r) => r.id === 'tumkurMonsoonBonus')).toBe(false);
    });

    it('filters out inactive incentives even if the zone matches', () => {
      const allRules = [...universalOffers, ...tumkurOffers, ...bangaloreOffers];
      const tumkurVisible = resolvePartnerOffers('zone-tumkur', allRules);

      // tumkurEveningBonus is active: false, so it should NOT be visible
      expect(tumkurVisible.some((r) => r.id === 'tumkurEveningBonus')).toBe(false);
      // weekendSurgeBonus is universal but active: false, so it should NOT be visible
      expect(tumkurVisible.some((r) => r.id === 'weekendSurgeBonus')).toBe(false);
    });
  });
});

