import { X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { BadgeConfirmation } from '@/components/BadgeConfirmation';
import { formatAmount } from '@/lib/formatCurrency';
import type { ComparisonDrawerProps, PaymentMethod } from '@/types';

function SuccessRateBar({ rate }: { rate: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{Math.round(rate * 100)}%</span>
      <div className="h-2 w-20 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-green-500"
          style={{ width: `${rate * 100}%` }}
        />
      </div>
    </div>
  );
}

function BooleanCell({
  value,
  yesColor = 'text-red-600',
}: {
  value: boolean;
  yesColor?: string;
}) {
  if (value) {
    return <span className={yesColor}>&#10003; Yes</span>;
  }
  return <span className="text-green-600">&#10007; No</span>;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '\u2026';
}

interface RowProps {
  label: string;
  methods: PaymentMethod[];
  render: (method: PaymentMethod) => React.ReactNode;
  index: number;
}

function ComparisonRow({ label, methods, render, index }: RowProps) {
  const isOdd = index % 2 !== 0;
  const bgClass = isOdd ? 'bg-slate-50' : 'bg-white';

  return (
    <tr className={bgClass}>
      <td
        className={`sticky left-0 w-32 px-4 py-3 text-sm font-medium text-slate-600 ${bgClass}`}
      >
        {label}
      </td>
      {methods.map((method) => (
        <td
          key={method.id}
          className="min-w-[160px] px-4 py-3 text-center text-sm text-slate-900"
        >
          {render(method)}
        </td>
      ))}
    </tr>
  );
}

export function ComparisonDrawer({
  isOpen,
  onClose,
  methods,
  orderContext: _orderContext,
}: ComparisonDrawerProps) {
  if (methods.length === 0) return null;

  const rows: { label: string; render: (m: PaymentMethod) => React.ReactNode }[] = [
    {
      label: 'Confirmation time',
      render: (m) => <BadgeConfirmation confirmationTime={m.confirmationTime} size="sm" />,
    },
    {
      label: 'Success rate',
      render: (m) => <SuccessRateBar rate={m.successRate} />,
    },
    {
      label: 'Bank account needed',
      render: (m) => <BooleanCell value={m.requiresBankAccount} yesColor="text-red-600" />,
    },
    {
      label: 'Smartphone needed',
      render: (m) => <BooleanCell value={m.requiresSmartphone} />,
    },
    {
      label: 'Store visit needed',
      render: (m) => (
        <BooleanCell value={m.requiresPhysicalVisit} yesColor="text-amber-600" />
      ),
    },
    {
      label: 'Max amount',
      render: (m) => formatAmount(m.maxAmount, m.currency),
    },
    {
      label: 'Expiration window',
      render: (m) => m.expirationWindow,
    },
    {
      label: 'Payment flow',
      render: (m) => (
        <span title={m.flowDescription}>{truncate(m.flowDescription, 60)}</span>
      ),
    },
  ];

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerTitle className="sr-only">Payment method comparison</DrawerTitle>
        <DrawerHeader className="relative">
          <p className="text-lg font-semibold">Compare payment methods</p>
          <p className="text-sm text-slate-500">
            Comparing {methods.length} methods
          </p>
          <DrawerClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-x-auto p-4">
          <table className="min-w-[600px] w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="sticky left-0 w-32 bg-white px-4 py-3" />
                {methods.map((method) => (
                  <th
                    key={method.id}
                    className="min-w-[160px] px-4 py-3 text-center text-sm font-semibold text-slate-900"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: method.brandColor }}
                      />
                      {method.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <ComparisonRow
                  key={row.label}
                  label={row.label}
                  methods={methods}
                  render={row.render}
                  index={index}
                />
              ))}
            </tbody>
          </table>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
