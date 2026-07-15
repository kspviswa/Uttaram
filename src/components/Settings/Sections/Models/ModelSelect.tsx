import Select from '@/components/ui/Select';
import { ConfigModelProvider } from '@/lib/config/types';
import { useChat } from '@/lib/hooks/useChat';
import { useState } from 'react';
import { toast } from 'sonner';

const ModelSelect = ({
  providers,
  type,
}: {
  providers: ConfigModelProvider[];
  type: 'chat' | 'embedding' | 'vision' | 'classification' | 'analytics';
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    if (type === 'chat') return `${localStorage.getItem('chatModelProviderId')}/${localStorage.getItem('chatModelKey')}`;
    if (type === 'vision') return `${localStorage.getItem('visionModelProviderId')}/${localStorage.getItem('visionModelKey')}`;
    if (type === 'classification') return `${localStorage.getItem('classificationModelProviderId') || ''}/${localStorage.getItem('classificationModelKey') || ''}`;
    if (type === 'analytics') return `${localStorage.getItem('analyticsLlmProviderId') || ''}/${localStorage.getItem('analyticsLlmKey') || ''}`;
    return `${localStorage.getItem('embeddingModelProviderId')}/${localStorage.getItem('embeddingModelKey')}`;
  });
  const [loading, setLoading] = useState(false);
  const { setChatModelProvider, setEmbeddingModelProvider } = useChat();

  const handleSave = async (newValue: string) => {
    setLoading(true);
    setSelectedModel(newValue);

    try {
      const providerId = newValue.split('/')[0];
      const modelKey = newValue.split('/').slice(1).join('/');

      if (type === 'chat') {
        localStorage.setItem('chatModelProviderId', providerId);
        localStorage.setItem('chatModelKey', modelKey);
        setChatModelProvider({ providerId, key: modelKey });
      } else if (type === 'vision') {
        localStorage.setItem('visionModelProviderId', providerId);
        localStorage.setItem('visionModelKey', modelKey);
      } else if (type === 'classification') {
        localStorage.setItem('classificationModelProviderId', providerId);
        localStorage.setItem('classificationModelKey', modelKey);
      } else if (type === 'analytics') {
        localStorage.setItem('analyticsLlmProviderId', providerId);
        localStorage.setItem('analyticsLlmKey', modelKey);
      } else {
        localStorage.setItem('embeddingModelProviderId', providerId);
        localStorage.setItem('embeddingModelKey', modelKey);
        setEmbeddingModelProvider({ providerId, key: modelKey });
      }

      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatModelProviderId: type === 'chat' ? providerId : localStorage.getItem('chatModelProviderId'),
          chatModelKey: type === 'chat' ? modelKey : localStorage.getItem('chatModelKey'),
          embeddingModelProviderId: type === 'embedding' ? providerId : localStorage.getItem('embeddingModelProviderId'),
          embeddingModelKey: type === 'embedding' ? modelKey : localStorage.getItem('embeddingModelKey'),
          visionModelProviderId: type === 'vision' ? providerId : localStorage.getItem('visionModelProviderId'),
          visionModelKey: type === 'vision' ? modelKey : localStorage.getItem('visionModelKey'),
          classificationModelProviderId: type === 'classification' ? providerId : localStorage.getItem('classificationModelProviderId'),
          classificationModelKey: type === 'classification' ? modelKey : localStorage.getItem('classificationModelKey'),
          analyticsLlmProviderId: type === 'analytics' ? providerId : localStorage.getItem('analyticsLlmProviderId'),
          analyticsLlmKey: type === 'analytics' ? modelKey : localStorage.getItem('analyticsLlmKey'),
        }),
      });
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
      <div className="space-y-3 lg:space-y-5">
        <div>
          <h4 className="text-sm lg:text-sm text-black dark:text-white">
            Select {type === 'chat' ? 'Chat Model' : type === 'vision' ? 'Vision Model' : type === 'classification' ? 'Classification Model (Fast Model)' : type === 'analytics' ? 'Analytics Model (Cluster Naming)' : 'Embedding Model'}
          </h4>
          <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
            {type === 'chat'
              ? 'Choose which model to use for generating responses'
              : type === 'vision'
                ? 'Choose which model to use for image analysis'
                : type === 'classification'
                  ? 'Choose a fast, lightweight model for query classification (optional; uses chat model if not set)'
                  : type === 'analytics'
                    ? 'Choose which model to use for generating cluster names in the Curiosity Map'
                    : 'Choose which model to use for generating embeddings'}
          </p>
        </div>
        <Select
          value={selectedModel}
          onChange={(event) => handleSave(event.target.value)}
          options={
            type === 'embedding'
              ? providers.flatMap((provider) =>
                  provider.embeddingModels.map((model) => ({
                    value: `${provider.id}/${model.key}`,
                    label: `${provider.name} - ${model.name}`,
                  })),
                )
              : providers.flatMap((provider) =>
                  provider.chatModels.map((model) => ({
                    value: `${provider.id}/${model.key}`,
                    label: `${provider.name} - ${model.name}`,
                  })),
                )
          }
          className="!text-xs lg:!text-[13px]"
          loading={loading}
          disabled={loading}
        />
      </div>
    </section>
  );
};

export default ModelSelect;
