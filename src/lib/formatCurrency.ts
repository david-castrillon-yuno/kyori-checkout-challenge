import type { Market } from '@/types';

const CURRENCY_CONFIG: Record<Market, { code: string; locale: string }> = {
  PH: { code: 'PHP', locale: 'en-PH' },
  TH: { code: 'THB', locale: 'th-TH' },
  ID: { code: 'IDR', locale: 'id-ID' },
};

export function formatCurrency(amount: number, market: Market): string {
  const { code, locale } = CURRENCY_CONFIG[market];
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatAmount(amount: number, currency: string): string {
  if (currency === 'MULTI') return `${amount.toLocaleString()}`;
  const localeMap: Record<string, string> = {
    PHP: 'en-PH',
    THB: 'th-TH',
    IDR: 'id-ID',
  };
  return new Intl.NumberFormat(localeMap[currency] ?? 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
