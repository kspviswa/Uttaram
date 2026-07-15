'use client';

import SettingsField from '@/components/Settings/SettingsField';
import { UIConfigField } from '@/lib/config/types';

export default function AnalyticsSection({
  fields,
  values,
}: {
  fields: UIConfigField[];
  values: Record<string, any>;
}) {
  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      <div className="space-y-1">
        <p className="text-xs text-black/50 dark:text-white/50">
          Adjust how chats are clustered and connected in the Curiosity Map.
          Changes take effect on next page load.
        </p>
      </div>
      {fields.map((field) => (
        <SettingsField
          key={field.key}
          field={field}
          value={values[field.key] ?? field.default}
          dataAdd="analytics"
        />
      ))}
    </div>
  );
}
