import type { Market } from '@/types';

const FLAG_MAP: Record<Market, { emoji: string; name: string }> = {
  PH: { emoji: '\u{1F1F5}\u{1F1ED}', name: 'Philippines' },
  TH: { emoji: '\u{1F1F9}\u{1F1ED}', name: 'Thailand' },
  ID: { emoji: '\u{1F1EE}\u{1F1E9}', name: 'Indonesia' },
};

interface CountryFlagProps {
  market: Market;
  showLabel?: boolean;
  className?: string;
}

export function CountryFlag({
  market,
  showLabel = false,
  className,
}: CountryFlagProps) {
  const { emoji, name } = FLAG_MAP[market];

  return (
    <span className={className}>
      {emoji}
      {showLabel && ` ${name}`}
    </span>
  );
}
