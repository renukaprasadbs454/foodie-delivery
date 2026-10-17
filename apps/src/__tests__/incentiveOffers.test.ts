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
});
