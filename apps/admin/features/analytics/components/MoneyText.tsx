'use client';

import React from 'react';
import { Text } from 'foodie-shared-web';
import { formatMoneyInr } from '../types';

type Props = {
  value: number | string | null | undefined;
  'aria-label'?: string;
};

/** INR money display — UI-API MoneyText (feature-local). */
export function MoneyText({ value, 'aria-label': ariaLabel }: Props) {
  return (
    <Text as="span" variant="heading2" color="#14532D" aria-label={ariaLabel}>
      {formatMoneyInr(value)}
    </Text>
  );
}

