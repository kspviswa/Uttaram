'use client';

import {
  ArrowLeft,
  BrainCog,
  Database,
  Search,
  Sliders,
  ToggleRight,
  BarChart3,
  ExternalLink,
} from 'lucide-react';
import Preferences from '@/components/Settings/Sections/Preferences';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Loader from '@/components/ui/Loader';
import Models from '@/components/Settings/Sections/Models/Section';
import SearchSection from '@/components/Settings/Sections/Search';
import Personalization from '@/components/Settings/Sections/Personalization';
import EmbeddingsSection from '@/components/Settings/Sections/Embeddings';
import AnalyticsSection from '@/components/Settings/Sections/Analytics';
import Link from 'next/link';

const sections = [
  { key: 'preferences', name: 'Preferences', icon: Sliders, component: Preferences, dataAdd: 'preferences' },
  { key: 'personalization', name: 'Personalization', icon: ToggleRight, component: Personalization, dataAdd: 'personalization' },
  { key: 'models', name: 'Models', icon: BrainCog, component: Models, dataAdd: 'modelProviders' },
  { key: 'search', name: 'Search', icon: Search, component: SearchSection, dataAdd: 'search' },
  { key: 'embeddings', name: 'Embeddings', icon: Database, component: EmbeddingsSection, dataAdd: 'embeddings' },
  { key: 'analytics', name: 'Analytics', icon: BarChart3, component: AnalyticsSection, dataAdd: 'analytics' },
];

export default function MobileSettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [activeSection, setActiveSection] = useState(sections[0].key);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [configRes, settingsRes] = await Promise.all([
          fetch('/api/config', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
          fetch('/api/settings', { method: 'GET', headers: { 'Content-Type': 'application/json' } }),
        ]);
        const configData = await configRes.json();
        const settingsData = await settingsRes.json();
        const merged = {
          ...configData,
          values: {
            ...configData.values,
            preferences: { ...configData.values.preferences, ...(settingsData.data ? {
              theme: settingsData.data.theme,
              measureUnit: settingsData.data.measureUnit,
              autoMediaSearch: settingsData.data.autoMediaSearch,
              showWeatherWidget: settingsData.data.showWeatherWidget,
              showNewsWidget: settingsData.data.showNewsWidget,
            } : {}) },
            personalization: { ...configData.values.personalization, ...(settingsData.data ? {
              userName: settingsData.data.userName,
              location: settingsData.data.location,
              systemInstructions: settingsData.data.systemInstructions,
              aboutMe: settingsData.data.aboutMe,
              enableMemories: settingsData.data.enableMemories,
              enableSuggestions: settingsData.data.enableSuggestions,
            } : {}) },
            embeddings: {},
            analytics: { ...(settingsData.data ? {
              similarityThreshold: settingsData.data.similarityThreshold,
              knnNeighbors: settingsData.data.knnNeighbors,
              analyticsLlmProviderId: settingsData.data.analyticsLlmProviderId,
              analyticsLlmKey: settingsData.data.analyticsLlmKey,
            } : {}) },
          },
        };
        setConfig(merged);
      } catch (error) {
        toast.error('Failed to load configuration.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <Loader />
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.key === activeSection)!;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-light-primary/95 dark:bg-dark-primary/95 backdrop-blur-sm border-b border-light-200/50 dark:border-dark-200/30">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href="/mobile"
            className="flex items-center gap-1.5 text-sm text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
          <h1 className="text-sm font-medium text-black/80 dark:text-white/90">Settings</h1>
          <div className="w-16" />
        </div>
        <div className="flex overflow-x-auto scrollbar-none gap-1 px-4 pb-3">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`whitespace-nowrap text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeSection === s.key
                  ? 'bg-black dark:bg-white text-white dark:text-black'
                  : 'text-black/60 dark:text-white/60 bg-light-secondary dark:bg-dark-secondary'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-8">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-black/90 dark:text-white/90">{selectedSection.name}</h2>
          </div>
          {selectedSection.component && (
            <selectedSection.component
              fields={config.fields[selectedSection.dataAdd]}
              values={config.values[selectedSection.dataAdd]}
            />
          )}
        </div>
        <div className="px-4 pb-8 flex items-center gap-3 text-[10px] text-black/50 dark:text-white/50">
          <span>Version: {process.env.NEXT_PUBLIC_VERSION}</span>
          <a href="https://github.com/kspviswa/uttaram" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-black/70 dark:hover:text-white/70">
            GitHub <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
}
