// ─── Primitive Unions ───────────────────────────────────────────────────────

export type Market = 'PH' | 'TH' | 'ID';

export type PaymentCategory =
  | 'e-wallet'
  | 'bank-transfer'
  | 'cash-otc'
  | 'qr-code'
  | 'card';

export type DeliveryType = 'same-day' | 'express' | 'standard' | 'scheduled';

export type ConfirmationTime = 'instant' | '2hr' | '24hr' | '48hr' | '3day';

export type SpeedFilter = 'all' | 'instant' | 'under-2hr' | 'under-24hr';

export type ConvenienceFilter =
  | 'all'
  | 'no-bank-account'
  | 'phone-only'
  | 'cash-preferred';

export type Currency = 'PHP' | 'THB' | 'IDR' | 'MULTI';

// ─── Core Domain ────────────────────────────────────────────────────────────

export interface PaymentMethod {
  id: string;
  name: string;
  category: PaymentCategory;
  markets: Market[];
  confirmationTime: ConfirmationTime;
  /** Minutes until confirmation (0=instant, 120=2hr, 1440=24hr, 4320=3days) */
  confirmationMinutes: number;
  expirationWindow: string;
  /** 1-2 sentence description of the payment flow */
  flowDescription: string;
  prerequisites: string[];
  requiresBankAccount: boolean;
  requiresSmartphone: boolean;
  requiresPhysicalVisit: boolean;
  minAmount: number;
  maxAmount: number;
  currency: Currency;
  /** 0.0-1.0 */
  successRate: number;
  /** 1 = most popular in primary market */
  popularityRank: number;
  brandColor: string;
  /** lucide-react icon name as string key */
  iconName: string;
  tagline: string;
  limitations: string[];
}

export interface OrderContext {
  market: Market;
  deliveryType: DeliveryType;
  orderValue: number;
  label?: string;
}

export interface FilterState {
  speed: SpeedFilter;
  convenience: ConvenienceFilter;
  categories: PaymentCategory[];
  searchQuery: string;
}

// ─── Filtering Result ────────────────────────────────────────────────────────

export type FitStatus = 'compatible' | 'incompatible';

export interface FilteredMethod {
  method: PaymentMethod;
  fitStatus: FitStatus;
  fitReason?: string;
}

// ─── Recommendation Engine ───────────────────────────────────────────────────

export interface RecommendedMethod {
  method: PaymentMethod;
  score: number;
  reason: string;
}

export interface RecommendationResult {
  recommendations: RecommendedMethod[];
  explanation: string;
  isConfident: boolean;
}

// ─── Component Props ─────────────────────────────────────────────────────────

export interface FilterPanelProps {
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export interface OrderContextPanelProps {
  orderContext: OrderContext;
  onOrderContextChange: (ctx: OrderContext) => void;
  presets: OrderContext[];
}

export interface PaymentMethodCardProps {
  method: PaymentMethod;
  isRecommended: boolean;
  recommendedReason?: string;
  isSelectedForComparison: boolean;
  onToggleComparison: (id: string) => void;
  orderContext: OrderContext;
  incompatibleReason?: string;
}

export interface PaymentMethodGridProps {
  results: FilteredMethod[];
  recommendedIds: Set<string>;
  recommendationReasons: Map<string, string>;
  selectedForComparison: string[];
  onToggleComparison: (id: string) => void;
  orderContext: OrderContext;
}

export interface ComparisonDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  methods: PaymentMethod[];
  orderContext: OrderContext;
}
