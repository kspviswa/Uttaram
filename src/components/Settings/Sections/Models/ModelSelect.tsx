import Select from '@/components/ui/Select';
import { ConfigModelProvider } from '@/lib/config/types';
import { useChat } from '@/lib/hooks/useChat';
import { useMemo, useState } from 'react';
import { Check, Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

const localStorageKeyFor = (
  type: 'chat' | 'embedding' | 'vision' | 'classification' | 'analytics',
  field: 'providerId' | 'key',
) => {
  const prefix =
    type === 'chat'
      ? 'chatModel'
      : type === 'vision'
        ? 'visionModel'
        : type === 'classification'
          ? 'classificationModel'
          : type === 'analytics'
            ? 'analyticsLlm'
            : 'embeddingModel';
  return `${prefix}${field === 'providerId' ? 'ProviderId' : field === 'key' ? 'Key' : ''}`;
};

const settingsKeyFor = (
  type: 'chat' | 'embedding' | 'vision' | 'classification' | 'analytics',
  field: 'providerId' | 'key',
) => {
  if (type === 'analytics') {
    return field === 'providerId' ? 'analyticsLlmProviderId' : 'analyticsLlmKey';
  }
  if (type === 'classification') {
    return field === 'providerId' ? 'classificationModelProviderId' : 'classificationModelKey';
  }
  return `${type}Model${field === 'providerId' ? 'ProviderId' : 'Key'}`;
};

const buildSavedValue = (
  type: 'chat' | 'embedding' | 'vision' | 'classification' | 'analytics',
) => {
  if (typeof window === 'undefined') return '';
  const providerId = localStorage.getItem(localStorageKeyFor(type, 'providerId'));
  const key = localStorage.getItem(localStorageKeyFor(type, 'key'));
  if (!providerId || !key) return '';
  return `${providerId}/${key}`;
};

const ModelSelect = ({
  providers,
  type,
}: {
  providers: ConfigModelProvider[];
  type: 'chat' | 'embedding' | 'vision' | 'classification' | 'analytics';
}) => {
  const [savedValue, setSavedValue] = useState<string>(buildSavedValue(type));
  const [draftValue, setDraftValue] = useState<string>(savedValue);
  const [loading, setLoading] = useState(false);
  const { setChatModelProvider, setEmbeddingModelProvider } = useChat();

  const options = useMemo(() => {
    const modelKind = type === 'embedding' ? 'embeddingModels' : 'chatModels';
    return providers.flatMap((provider) =>
      provider[modelKind]
        .filter((model) => model.key !== 'error')
        .map((model) => ({
          value: `${provider.id}/${model.key}`,
          label: `${provider.name} - ${model.name}`,
        })),
    );
  }, [providers, type]);

  const dirty = draftValue !== savedValue;

  const handleSave = async () => {
    if (!dirty || !draftValue) return;
    setLoading(true);

    const providerId = draftValue.split('/')[0];
    const modelKey = draftValue.split('/').slice(1).join('/');

    const lsProviderId = localStorageKeyFor(type, 'providerId');
    const lsKey = localStorageKeyFor(type, 'key');

    const previousProviderId = localStorage.getItem(lsProviderId);
    const previousKey = localStorage.getItem(lsKey);

    localStorage.setItem(lsProviderId, providerId);
    localStorage.setItem(lsKey, modelKey);

    if (type === 'chat') {
      setChatModelProvider({ providerId, key: modelKey });
    } else if (type === 'embedding') {
      setEmbeddingModelProvider({ providerId, key: modelKey });
    }

    const payload: Record<string, any> = {};
    (['chat', 'embedding', 'vision', 'classification', 'analytics'] as const).forEach(
      (t) => {
        payload[settingsKeyFor(t, 'providerId')] =
          t === type ? providerId : localStorage.getItem(localStorageKeyFor(t, 'providerId'));
        payload[settingsKeyFor(t, 'key')] =
          t === type ? modelKey : localStorage.getItem(localStorageKeyFor(t, 'key'));
      },
    );

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save');

      setSavedValue(draftValue);
      toast.success(
        `${type === 'chat' ? 'Chat' : type === 'vision' ? 'Vision' : type === 'classification' ? 'Classification' : type === 'analytics' ? 'Analytics' : 'Embedding'} model updated.`,
      );
    } catch (error) {
      console.error('Error saving config:', error);
      if (previousProviderId) localStorage.setItem(lsProviderId, previousProviderId);
      else localStorage.removeItem(lsProviderId);
      if (previousKey) localStorage.setItem(lsKey, previousKey);
      else localStorage.removeItem(lsKey);
      setDraftValue(buildSavedValue(type));
      toast.error('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDraftValue(savedValue);
  };

  const heading =
    type === 'chat'
      ? 'Chat Model'
      : type === 'vision'
        ? 'Vision Model'
        : type === 'classification'
          ? 'Classification Model (Fast Model)'
          : type === 'analytics'
            ? 'Analytics Model (Cluster Naming)'
            : 'Embedding Model';

  const description =
    type === 'chat'
      ? 'Choose which model to use for generating responses'
      : type === 'vision'
        ? 'Choose which model to use for image analysis'
        : type === 'classification'
          ? 'Choose a fast, lightweight model for query classification (optional; uses chat model if not set)'
          : type === 'analytics'
            ? 'Choose which model to use for generating cluster names in the Curiosity Map'
            : 'Choose which model to use for generating embeddings';

  return (
    <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
      <div className="space-y-3 lg:space-y-5">
        <div>
          <h4 className="text-sm lg:text-sm text-black dark:text-white">Select {heading}</h4>
          <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">{description}</p>
        </div>
        <Select
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          options={options}
          className="!text-xs lg:!text-[13px]"
          disabled={loading}
        />
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-light-200 dark:border-dark-200 px-3 py-2 text-xs lg:text-[13px] text-black/70 dark:text-white/70 hover:bg-light-200/60 dark:hover:bg-dark-200/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || loading || !draftValue}
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-3 py-2 text-xs lg:text-[13px] font-medium text-white hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save
          </button>
        </div>
      </div>
    </section>
  );
};

export default ModelSelect;
