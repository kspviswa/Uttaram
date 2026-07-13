import React, { useEffect, useState } from 'react';
import AddProvider from './AddProviderDialog';
import {
  ConfigModelProvider,
  ModelProviderUISection,
  UIConfigField,
} from '@/lib/config/types';
import ModelProvider from './ModelProvider';
import ModelSelect from './ModelSelect';
import ContextLengthSelect from './ContextLengthSelect';
import SettingsField from '../../SettingsField';
import { Switch } from '@headlessui/react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const llmTimeoutField: UIConfigField = {
  name: 'LLM Timeout (s)',
  key: 'llmTimeout',
  type: 'number',
  required: false,
  description: 'Timeout in seconds for LLM inference calls',
  placeholder: '60',
  default: 60000,
  scope: 'server',
};

const llmRetryField: UIConfigField = {
  name: 'LLM Retry Count',
  key: 'llmMaxRetries',
  type: 'number',
  required: false,
  description: 'Number of retries when LLM inference times out',
  placeholder: '3',
  default: 3,
  scope: 'server',
};

const LlmTimeoutInput = ({ value }: { value: number }) => {
  const [val, setVal] = useState(Math.round(value / 1000));
  const [saving, setSaving] = useState(false);

  const handleSave = async (seconds: number) => {
    const clamped = Math.max(1, seconds);
    setVal(clamped);
    setSaving(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'search.llmTimeout', value: String(clamped * 1000) }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch {
      toast.error('Failed to save LLM timeout');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
      <div className="space-y-3 lg:space-y-5">
        <div>
          <h4 className="text-sm lg:text-sm text-black dark:text-white">
            LLM Timeout (s)
          </h4>
          <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
            Timeout in seconds for LLM inference calls
          </p>
        </div>
        <div className="relative">
          <input
            value={val}
            onChange={(e) => setVal(Number(e.target.value))}
            onBlur={(e) => handleSave(Number(e.target.value))}
            className="w-full rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary px-3 py-2 lg:px-4 lg:py-3 pr-10 !text-xs lg:!text-[13px] text-black/80 dark:text-white/80 placeholder:text-black/40 dark:placeholder:text-white/40 focus-visible:outline-none focus-visible:border-light-300 dark:focus-visible:border-dark-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            type="number"
            min={1}
            placeholder="60"
            disabled={saving}
          />
          {saving && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" />
            </span>
          )}
        </div>
      </div>
    </section>
  );
};

const LlmThrottleSettings = () => {
  const [enabled, setEnabled] = useState(
    () => localStorage.getItem('throttleEnabled') === 'true',
  );
  const [maxParallel, setMaxParallel] = useState(() => {
    const stored = localStorage.getItem('maxParallelLlmCalls');
    return stored ? parseInt(stored, 10) : 2;
  });
  const [saving, setSaving] = useState(false);

  const save = async (key: string, value: any) => {
    setSaving(true);
    localStorage.setItem(key, String(value));
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      if (!res.ok) throw new Error('Failed to save');
    } catch {
      toast.error('Failed to save throttle settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
        <div className="flex flex-row items-center space-x-3 lg:space-x-5 w-full justify-between">
          <div>
            <h4 className="text-sm lg:text-sm text-black dark:text-white">
              Throttle LLM Calls
            </h4>
            <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
              Limit concurrent LLM requests to reduce load on local inference
            </p>
          </div>
          <Switch
            checked={enabled}
            onChange={(v) => {
              setEnabled(v);
              save('throttleEnabled', v);
            }}
            disabled={saving}
            className="group relative flex h-6 w-12 shrink-0 cursor-pointer rounded-full bg-light-200 dark:bg-white/10 p-1 duration-200 ease-in-out focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed data-[checked]:bg-sky-500 dark:data-[checked]:bg-sky-500"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none inline-block size-4 translate-x-0 rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out group-data-[checked]:translate-x-6"
            />
          </Switch>
        </div>
      </section>
      {enabled && (
        <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
          <div className="space-y-3 lg:space-y-5">
            <div>
              <h4 className="text-sm lg:text-sm text-black dark:text-white">
                Max Parallel Calls
              </h4>
              <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
                Maximum number of LLM requests allowed at the same time
              </p>
            </div>
            <div className="relative">
              <input
                value={maxParallel}
                onChange={(e) => setMaxParallel(Number(e.target.value))}
                onBlur={(e) => {
                  const val = Math.max(1, Number(e.target.value));
                  setMaxParallel(val);
                  save('maxParallelLlmCalls', val);
                }}
                className="w-full rounded-lg border border-light-200 dark:border-dark-200 bg-light-primary dark:bg-dark-primary px-3 py-2 lg:px-4 lg:py-3 pr-10 !text-xs lg:!text-[13px] text-black/80 dark:text-white/80 placeholder:text-black/40 dark:placeholder:text-white/40 focus-visible:outline-none focus-visible:border-light-300 dark:focus-visible:border-dark-300 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                type="number"
                min={1}
                disabled={saving}
              />
              {saving && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </span>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

const Models = ({
  fields,
  values,
}: {
  fields: ModelProviderUISection[];
  values: ConfigModelProvider[];
}) => {
  const [providers, setProviders] = useState<ConfigModelProvider[]>(values);
  const [searchConfig, setSearchConfig] = useState<Record<string, any>>({});

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((data) => setSearchConfig(data.values.search || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 space-y-6 overflow-y-auto py-6">
      <div className="flex flex-col px-6 gap-y-4">
        <h3 className="text-xs lg:text-xs text-black/70 dark:text-white/70">
          Select models
        </h3>
        <ModelSelect
          providers={values.filter((p) =>
            p.chatModels.some((m) => m.key != 'error'),
          )}
          type="chat"
        />
        <ModelSelect
          providers={values.filter((p) =>
            p.chatModels.some((m) => m.key != 'error'),
          )}
          type="vision"
        />
        <ModelSelect
          providers={values.filter((p) =>
            p.embeddingModels.some((m) => m.key != 'error'),
          )}
          type="embedding"
        />
        <ModelSelect
          providers={values.filter((p) =>
            p.chatModels.some((m) => m.key != 'error'),
          )}
          type="classification"
        />
        <ContextLengthSelect />
      </div>
      <div className="border-t border-light-200 dark:border-dark-200" />
      <div className="flex flex-col px-6">
        <h3 className="text-xs lg:text-xs text-black/70 dark:text-white/70 mb-4">
          LLM Settings
        </h3>
        <LlmTimeoutInput value={searchConfig.llmTimeout ?? 60000} />
        <div className="mt-4">
          <SettingsField
            field={llmRetryField}
            value={searchConfig.llmMaxRetries ?? llmRetryField.default}
            dataAdd="search"
          />
        </div>
      </div>
      <div className="border-t border-light-200 dark:border-dark-200" />
      <div className="flex flex-col px-6">
        <h3 className="text-xs lg:text-xs text-black/70 dark:text-white/70 mb-4">
          LLM Throttle
        </h3>
        <LlmThrottleSettings />
      </div>
      <div className="border-t border-light-200 dark:border-dark-200" />
      <div className="flex flex-row justify-between items-center px-6 ">
        <p className="text-xs lg:text-xs text-black/70 dark:text-white/70">
          Manage connections
        </p>
        <AddProvider modelProviders={fields} setProviders={setProviders} />
      </div>
      <div className="flex flex-col px-6 gap-y-4">
        {providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed border-light-200 dark:border-dark-200 bg-light-secondary/10 dark:bg-dark-secondary/10">
            <div className="p-3 rounded-full bg-sky-500/10 dark:bg-sky-500/10 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 text-sky-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-black/70 dark:text-white/70 mb-1">
              No connections yet
            </p>
            <p className="text-xs text-black/50 dark:text-white/50 text-center max-w-sm mb-4">
              Add your first connection to start using AI models. Connect to
              OpenAI, Anthropic, Ollama, and more.
            </p>
          </div>
        ) : (
          providers.map((provider) => (
            <ModelProvider
              key={`provider-${provider.id}`}
              fields={
                (fields.find((f) => f.key === provider.type)?.fields ??
                  []) as UIConfigField[]
              }
              modelProvider={provider}
              setProviders={setProviders}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Models;
