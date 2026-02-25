import { ShoppingCart } from 'lucide-react';

import { CountryFlag } from '@/components/CountryFlag';
import type { Market } from '@/types';

interface HeaderProps {
  market: Market;
}

export function Header({ market }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 w-full items-center justify-between bg-slate-900 px-4 text-white md:px-6">
      <div className="flex items-center gap-2">
        <ShoppingCart className="h-5 w-5" />
        <span className="font-bold">Kyori Grocery</span>
      </div>

      <span className="text-sm text-slate-400">Payment Advisor</span>

      <div className="rounded-md bg-slate-800 px-2.5 py-1 text-sm">
        <CountryFlag market={market} showLabel />
      </div>
    </header>
  );
}
