import type { OrderContext } from '@/types';

export const DEFAULT_ORDER_CONTEXT: OrderContext = {
  market: 'PH',
  deliveryType: 'same-day',
  orderValue: 500,
};

export const ORDER_CONTEXT_PRESETS: OrderContext[] = [
  { market: 'PH', deliveryType: 'same-day', orderValue: 500, label: 'Manila \u00b7 Same-day \u00b7 Small' },
  { market: 'PH', deliveryType: 'standard', orderValue: 5000, label: 'Manila \u00b7 Standard \u00b7 Large' },
  { market: 'TH', deliveryType: 'same-day', orderValue: 200, label: 'Bangkok \u00b7 Same-day \u00b7 Small' },
  { market: 'TH', deliveryType: 'scheduled', orderValue: 2000, label: 'Bangkok \u00b7 Scheduled \u00b7 Large' },
  { market: 'ID', deliveryType: 'express', orderValue: 100000, label: 'Jakarta \u00b7 Express \u00b7 Small' },
  { market: 'ID', deliveryType: 'standard', orderValue: 1000000, label: 'Jakarta \u00b7 Standard \u00b7 Large' },
];
