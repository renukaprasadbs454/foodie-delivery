import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const STEPS = [
  { label: 'Basic Info', icon: '🏪' },
  { label: 'Documents', icon: '📄' },
  { label: 'Images', icon: '🖼️' },
  { label: 'Approval', icon: '⏳' },
] as const;

type Props = {
  activeIndex: number;
};

/**
 * iOS Foodie Stepper matching the Home Page & Login Screen design system.
 * Uses #14532D (Brand Primary Green) and #F59E0B (Accent Gold).
 */
export function OnboardingStepper({ activeIndex }: Props) {
  return (
    <View style={styles.container} accessibilityLabel={`Step ${activeIndex + 1} of ${STEPS.length}`}>
      <View style={styles.stepTrack}>
        {STEPS.map((step, index) => {
          const active = index === activeIndex;
          const done = index < activeIndex;
          return (
            <React.Fragment key={step.label}>
              {index > 0 ? (
                <View
                  style={[
                    styles.connectorLine,
                    done && styles.connectorLineDone,
                  ]}
                />
              ) : null}
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.badge,
                    active && styles.badgeActive,
                    done && styles.badgeDone,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      active && styles.badgeTextActive,
                      done && styles.badgeTextDone,
                    ]}
                  >
                    {done ? '✓' : index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.label,
                    active && styles.labelActive,
                    done && styles.labelDone,
                  ]}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  stepTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  stepItem: {
    alignItems: 'center',
    gap: 6,
    zIndex: 2,
  },
  connectorLine: {
    flex: 1,
    height: 2.5,
    backgroundColor: '#E2E8F0',
    marginHorizontal: -4,
    marginTop: -18,
  },
  connectorLineDone: {
    backgroundColor: '#14532D',
  },
  badge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeActive: {
    backgroundColor: '#14532D',
    borderColor: '#F59E0B',
    shadowColor: '#14532D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeDone: {
    backgroundColor: '#14532D',
    borderColor: '#14532D',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  badgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  badgeTextDone: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  labelActive: {
    color: '#14532D',
    fontWeight: '800',
  },
  labelDone: {
    color: '#166534',
    fontWeight: '700',
  },
});
