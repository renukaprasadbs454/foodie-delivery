import { Suspense } from 'react';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';

export default function AdminSettingsRoute() {
  return (
    <Suspense fallback={<div>Loading settings...</div>}>
      <SettingsPage />
    </Suspense>
  );
}
