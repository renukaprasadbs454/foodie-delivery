import React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectActiveModule, setActiveModule } from '@/store/moduleSlice';

export type MarketplaceModule = 'FOOD' | 'RESTAURANTS' | 'CAFES' | 'CLOUD_KITCHEN';

export interface ModuleSwitcherProps {
  activeModule?: MarketplaceModule;
  onModuleChange?: (module: MarketplaceModule) => void;
}

const MODULES: { id: MarketplaceModule; label: string; icon: string; badgeColor: string }[] = [
  { id: 'FOOD', label: 'All Food Delivery', icon: '', badgeColor: '#14532D' },
  { id: 'RESTAURANTS', label: 'Fine Dining & Pizzerias', icon: '', badgeColor: '#0284C7' },
  { id: 'CAFES', label: 'Cafes & Bakery', icon: '', badgeColor: '#D97706' },
  { id: 'CLOUD_KITCHEN', label: 'Cloud Kitchens', icon: '', badgeColor: '#7C3AED' },
];

export function ModuleSwitcher({ activeModule: externalModule, onModuleChange }: ModuleSwitcherProps) {
  const dispatch = useAppDispatch();
  const reduxModule = useAppSelector(selectActiveModule);
  const currentModule = externalModule ?? reduxModule;

  const handleSelect = (mod: MarketplaceModule) => {
    dispatch(setActiveModule(mod));
    if (onModuleChange) {
      onModuleChange(mod);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FFFFFF',
        padding: '6px 10px',
        borderRadius: 10,
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', paddingRight: 4 }}>
        Module:
      </span>
      {MODULES.map((m) => {
        const isActive = currentModule === m.id;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => handleSelect(m.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 6,
              border: isActive ? `1px solid ${m.badgeColor}` : '1px solid transparent',
              backgroundColor: isActive ? '#FEF3C7' : 'transparent',
              color: isActive ? '#14532D' : '#475569',
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease-in-out',
            }}
          >
            <span>{m.icon}</span>
            <span>{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
