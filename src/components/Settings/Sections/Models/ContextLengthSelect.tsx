import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const MIN = 4096;
const MAX = 204800;
const STEP = 1024;

const formatValue = (v: number) => `${Math.round(v / 1024)}K`;

const ContextLengthSelect = () => {
  const [value, setValue] = useState(8192);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('contextLength');
    if (stored) setValue(parseInt(stored, 10));
  }, []);

  const handleSave = async (newValue: number) => {
    setLoading(true);
    setValue(newValue);
    try {
      localStorage.setItem('contextLength', String(newValue));
      window.dispatchEvent(new Event('client-config-changed'));
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contextLength: String(newValue) }),
      });
    } catch (error) {
      console.error('Error saving context length:', error);
      toast.error('Failed to save configuration.');
    } finally {
      setLoading(false);
    }
  };

  const percent = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <section className="rounded-xl border border-light-200 bg-light-primary/80 p-4 lg:p-6 transition-colors dark:border-dark-200 dark:bg-dark-primary/80">
      <div className="space-y-3 lg:space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm lg:text-sm text-black dark:text-white">
              Context Length
            </h4>
            <p className="text-[11px] lg:text-xs text-black/50 dark:text-white/50">
              Maximum tokens for conversation context. Warning shown at 80%
              usage.
            </p>
          </div>
          <span className="text-xs font-medium tabular-nums text-black/70 dark:text-white/70 ml-4 min-w-[48px] text-right">
            {formatValue(value)}
          </span>
        </div>

        <div className="relative pt-1">
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            onMouseUp={(e) => handleSave(Number(e.currentTarget.value))}
            onTouchEnd={(e) => handleSave(Number(e.currentTarget.value))}
            onKeyUp={(e) => {
              if (e.key === 'Enter') handleSave(Number(e.currentTarget.value));
            }}
            disabled={loading}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
              bg-light-200 dark:bg-dark-200
              disabled:opacity-60 disabled:cursor-not-allowed
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-[#24A0ED]
              [&::-webkit-slider-thumb]:shadow-sm
              [&::-webkit-slider-thumb]:cursor-grab
              [&::-webkit-slider-thumb]:active:cursor-grabbing
              [&::-moz-range-thumb]:appearance-none
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-white
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-[#24A0ED]
              [&::-moz-range-thumb]:shadow-sm
              [&::-moz-range-thumb]:cursor-grab
              [&::-moz-range-thumb]:active:cursor-grabbing"
            style={{
              background: `linear-gradient(to right, #24A0ED ${percent}%, transparent ${percent}%)`,
            }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-black/40 dark:text-white/40">
          <span>4K</span>
          <span>200K</span>
        </div>
      </div>
    </section>
  );
};

export default ContextLengthSelect;
