import { createElement, useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, ChevronUp, Check, Plus, AlertTriangle } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BadgeConfirmation } from '@/components/BadgeConfirmation';
import { getIcon } from '@/lib/icons';
import { formatAmount } from '@/lib/formatCurrency';
import type { PaymentMethodCardProps, PaymentCategory } from '@/types';

const CATEGORY_LABELS: Record<PaymentCategory, string> = {
  'e-wallet': 'E-Wallet',
  'bank-transfer': 'Bank Transfer',
  'cash-otc': 'Cash OTC',
  'qr-code': 'QR Code',
  card: 'Card',
};

export function PaymentMethodCard({
  method,
  isRecommended,
  recommendedReason,
  isSelectedForComparison,
  onToggleComparison,
  orderContext,
  incompatibleReason,
}: PaymentMethodCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const showSameDayWarning =
    orderContext.deliveryType === 'same-day' && method.confirmationMinutes > 120;

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={incompatibleReason ? 'opacity-60' : undefined}
    >
      <Card className="h-full">
        {/* Header */}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {createElement(getIcon(method.iconName), { className: 'w-6 h-6', style: { color: method.brandColor } })}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">
                    {method.name}
                  </span>
                  <BadgeConfirmation
                    confirmationTime={method.confirmationTime}
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500">
                    {method.tagline}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {CATEGORY_LABELS[method.category]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Incompatible reason banner */}
          {incompatibleReason && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {incompatibleReason}
            </div>
          )}

          {/* Same-day warning */}
          {showSameDayWarning && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              May not confirm before delivery
            </div>
          )}

          {/* Recommended banner */}
          {isRecommended && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
              <Check className="w-4 h-4 shrink-0" />
              {recommendedReason ?? 'Recommended'}
            </div>
          )}

          {/* Flow description */}
          <p className="text-sm text-slate-600">{method.flowDescription}</p>

          {/* Expand/collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="text-slate-500 px-0"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show more
              </>
            )}
          </Button>

          {/* Expanded section */}
          {isExpanded && (
            <div className="space-y-3">
              {/* Prerequisites */}
              {method.prerequisites.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Prerequisites
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {method.prerequisites.map((prereq) => (
                      <Badge
                        key={prereq}
                        variant="outline"
                        className="text-xs"
                      >
                        {prereq}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Limitations */}
              {method.limitations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1">
                    Limitations
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {method.limitations.map((limitation) => (
                      <Badge
                        key={limitation}
                        variant="outline"
                        className="text-xs"
                      >
                        {limitation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Success rate */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 shrink-0">
                  Success rate:
                </span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${method.successRate * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
                  />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {Math.round(method.successRate * 100)}%
                </span>
              </div>

              {/* Expiration window */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Pay within:</span>
                <span className="font-medium text-slate-700">
                  {method.expirationWindow}
                </span>
              </div>

              {/* Amount range */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Amount:</span>
                <span className="font-medium text-slate-700">
                  {formatAmount(method.minAmount, method.currency)} &ndash;{' '}
                  {formatAmount(method.maxAmount, method.currency)}
                </span>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer with compare button */}
        <CardFooter className="justify-end">
          <Button
            variant={isSelectedForComparison ? 'default' : 'outline'}
            size="sm"
            onClick={() => onToggleComparison(method.id)}
            disabled={!isSelectedForComparison && !!incompatibleReason}
            className={
              !isSelectedForComparison && incompatibleReason
                ? 'pointer-events-none'
                : undefined
            }
          >
            {isSelectedForComparison ? (
              <>
                <Check className="w-4 h-4" />
                Selected
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Compare
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
