import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type {
  ConvenienceFilter,
  FilterPanelProps,
  PaymentCategory,
  SpeedFilter,
} from '@/types';

const SPEED_OPTIONS: { value: SpeedFilter; label: string }[] = [
  { value: 'all', label: 'All speeds' },
  { value: 'instant', label: '\u26A1 Instant' },
  { value: 'under-2hr', label: 'Under 2h' },
  { value: 'under-24hr', label: 'Under 24h' },
];

const CONVENIENCE_OPTIONS: { value: ConvenienceFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'no-bank-account', label: 'No bank account' },
  { value: 'phone-only', label: 'Phone only' },
  { value: 'cash-preferred', label: 'Cash only' },
];

const CATEGORY_OPTIONS: { value: PaymentCategory; label: string }[] = [
  { value: 'e-wallet', label: 'E-Wallet' },
  { value: 'bank-transfer', label: 'Bank Transfer' },
  { value: 'cash-otc', label: 'Cash / OTC' },
  { value: 'qr-code', label: 'QR Code' },
  { value: 'card', label: 'Card' },
];

const DEFAULT_FILTER_STATE = {
  speed: 'all' as SpeedFilter,
  convenience: 'all' as ConvenienceFilter,
  categories: [] as PaymentCategory[],
  searchQuery: '',
};

export function FilterPanel({
  filterState,
  onFilterChange,
  totalCount,
  filteredCount,
}: FilterPanelProps) {
  const hasActiveFilters =
    filterState.speed !== 'all' ||
    filterState.convenience !== 'all' ||
    filterState.categories.length > 0 ||
    filterState.searchQuery.length > 0;

  const handleSpeedChange = useCallback(
    (value: string) => {
      if (!value) return;
      onFilterChange({ ...filterState, speed: value as SpeedFilter });
    },
    [filterState, onFilterChange],
  );

  const handleConvenienceChange = useCallback(
    (value: string) => {
      if (!value) return;
      onFilterChange({
        ...filterState,
        convenience: value as ConvenienceFilter,
      });
    },
    [filterState, onFilterChange],
  );

  const toggleCategory = useCallback(
    (category: PaymentCategory) => {
      const exists = filterState.categories.includes(category);
      const newCategories = exists
        ? filterState.categories.filter((c) => c !== category)
        : [...filterState.categories, category];
      onFilterChange({ ...filterState, categories: newCategories });
    },
    [filterState, onFilterChange],
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onFilterChange({ ...filterState, searchQuery: e.target.value });
    },
    [filterState, onFilterChange],
  );

  const handleClearAll = useCallback(() => {
    onFilterChange(DEFAULT_FILTER_STATE);
  }, [onFilterChange]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-5">
      {/* Section 1: Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Badge variant="secondary" className="text-slate-500">
          {filteredCount} / {totalCount}
        </Badge>
      </div>

      {/* Section 2: Speed filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Payment speed</label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={filterState.speed}
          onValueChange={handleSpeedChange}
          className="flex-wrap"
        >
          {SPEED_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Section 3: Requirements filter */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Requirements</label>
        <ToggleGroup
          type="single"
          variant="outline"
          value={filterState.convenience}
          onValueChange={handleConvenienceChange}
          className="flex-wrap"
        >
          {CONVENIENCE_OPTIONS.map((opt) => (
            <ToggleGroupItem key={opt.value} value={opt.value} className="text-xs">
              {opt.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* Section 4: Category filter (checkboxes) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Category</label>
        <div className="space-y-1.5">
          {CATEGORY_OPTIONS.map((opt) => {
            const isChecked = filterState.categories.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 hover:text-slate-900"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategory(opt.value)}
                  className="size-4 rounded border-slate-300 text-primary accent-slate-900"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </div>

      {/* Section 5: Search */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Search</label>
        <Input
          value={filterState.searchQuery}
          onChange={handleSearchChange}
          placeholder="Search payment methods..."
        />
      </div>

      {/* Section 6: Clear all button */}
      <Button
        variant="ghost"
        className="w-full"
        disabled={!hasActiveFilters}
        onClick={handleClearAll}
      >
        Clear all filters
      </Button>
    </div>
  );
}
