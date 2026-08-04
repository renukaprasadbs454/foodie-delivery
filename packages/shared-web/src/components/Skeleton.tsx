import React from 'react';
import { useTheme } from '../hooks/useTheme';

export function SkeletonBlock({
  width = '100%',
  height = 16,
}: {
  width?: number | string;
  height?: number;
}) {
  const { tokens } = useTheme();
  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        borderRadius: tokens.radius.sm,
        background: tokens.color.border,
      }}
    />
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  const { tokens } = useTheme();
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: tokens.radius.full,
        background: tokens.color.border,
      }}
    />
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const { tokens } = useTheme();
  return (
    <div style={{ display: 'grid', gap: tokens.spacing.sm }}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonBlock
          key={`skeleton-line-${index}`}
          height={tokens.typography.body.fontSize}
          width={index === lines - 1 ? '70%' : '100%'}
        />
      ))}
    </div>
  );
}

export const Skeleton = {
  Block: SkeletonBlock,
  Circle: SkeletonCircle,
  Text: SkeletonText,
};
