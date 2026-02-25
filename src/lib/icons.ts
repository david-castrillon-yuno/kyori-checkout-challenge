import {
  Wallet,
  Building2,
  Store,
  QrCode,
  ShoppingBag,
  CreditCard,
  HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  'wallet': Wallet,
  'building-2': Building2,
  'store': Store,
  'qr-code': QrCode,
  'shopping-bag': ShoppingBag,
  'credit-card': CreditCard,
};

export function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? HelpCircle;
}
