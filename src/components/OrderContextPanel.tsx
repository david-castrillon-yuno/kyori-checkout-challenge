import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { formatCurrency } from '@/lib/formatCurrency';
import type { DeliveryType, Market, OrderContextPanelProps } from '@/types';

const MARKET_OPTIONS: { value: Market; label: string }[] = [
  { value: 'PH', label: 'PH \u{1F1F5}\u{1F1ED}' },
  { value: 'TH', label: 'TH \u{1F1F9}\u{1F1ED}' },
  { value: 'ID', label: 'ID \u{1F1EE}\u{1F1E9}' },
];

const DELIVERY_OPTIONS: { value: DeliveryType; label: string }[] = [
  { value: 'same-day', label: 'Same-day' },
  { value: 'express', label: 'Express' },
  { value: 'standard', label: 'Standard' },
  { value: 'scheduled', label: 'Scheduled' },
];

const SLIDER_RANGE: Record<Market, { min: number; max: number; step: number }> = {
  PH: { min: 100, max: 10000, step: 100 },
  TH: { min: 50, max: 5000, step: 50 },
  ID: { min: 10000, max: 2000000, step: 10000 },
};

const DEFAULT_ORDER_VALUE: Record<Market, number> = {
  PH: 500,
  TH: 200,
  ID: 100000,
};

export function OrderContextPanel({
  orderContext,
  onOrderContextChange,
  presets,
}: OrderContextPanelProps) {
  const range = SLIDER_RANGE[orderContext.market];

  const handleMarketChange = useCallback(
    (value: string) => {
      if (!value) return;
      const newMarket = value as Market;
      onOrderContextChange({
        ...orderContext,
        market: newMarket,
        orderValue: DEFAULT_ORDER_VALUE[newMarket],
      });
    },
    [orderContext, onOrderContextChange],
  );

  const handleDeliveryChange = useCallback(
    (value: string) => {
      if (!value) return;
      onOrderContextChange({
        ...orderContext,
        deliveryType: value as DeliveryType,
      });
    },
    [orderContext, onOrderContextChange],
  );

  const handleSliderChange = useCallback(
    (value: number[]) => {
      onOrderContextChange({
        ...orderContext,
        orderValue: value[0],
      });
    },
    [orderContext, onOrderContextChange],
  );

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm px-4 md:px-6 py-3">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Section 1: Market selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Market:</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={orderContext.market}
            onValueChange={handleMarketChange}
          >
            {MARKET_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Section 2: Delivery type selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Delivery:</span>
          <ToggleGroup
            type="single"
            variant="outline"
            value={orderContext.deliveryType}
            onValueChange={handleDeliveryChange}
          >
            {DELIVERY_OPTIONS.map((opt) => (
              <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* Section 3: Order value slider */}
        <div className="flex items-center gap-2 w-full min-w-[200px] flex-1 md:max-w-xs">
          <span className="text-sm font-medium text-slate-700 shrink-0">Order value:</span>
          <Slider
            min={range.min}
            max={range.max}
            step={range.step}
            value={[orderContext.orderValue]}
            onValueChange={handleSliderChange}
            className="flex-1"
          />
          <span className="text-sm font-semibold text-slate-900 shrink-0">
            {formatCurrency(orderContext.orderValue, orderContext.market)}
          </span>
        </div>

        {/* Section 4: Preset buttons */}
        {presets.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-sm font-medium text-slate-700 shrink-0">Presets:</span>
            <div className="flex gap-1.5">
              {presets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => onOrderContextChange(preset)}
                >
                  {preset.label ?? `${preset.market} ${preset.deliveryType}`}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
