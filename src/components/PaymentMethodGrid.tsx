/**
 * PaymentMethodGrid — renders compatible and incompatible methods in a two-section
 * responsive grid with smooth layout animations.
 *
 * Layout:
 *   - Compatible methods first (full opacity, sorted by popularityRank)
 *   - A divider labeled "Other available methods" when both sections are non-empty
 *   - Incompatible methods below (dimmed via PaymentMethodCard opacity-60)
 *
 * AnimatePresence + motion.div per card ensures cards animate in/out when filters
 * change without the entire grid remounting. `mode="popLayout"` lets cards exit
 * before siblings reflow, preventing visual jumps.
 */
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '@/components/EmptyState';
import { PaymentMethodCard } from '@/components/PaymentMethodCard';
import { Separator } from '@/components/ui/separator';
import type { PaymentMethodGridProps } from '@/types';

export function PaymentMethodGrid({
  results,
  recommendedIds,
  recommendationReasons,
  selectedForComparison,
  onToggleComparison,
  orderContext,
}: PaymentMethodGridProps) {
  const compatibleMethods = results.filter(
    (r) => r.fitStatus === 'compatible',
  );
  const incompatibleMethods = results.filter(
    (r) => r.fitStatus === 'incompatible',
  );

  if (results.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {/* Compatible methods */}
      <AnimatePresence mode="popLayout">
        {compatibleMethods.map((r) => (
          <motion.div
            key={r.method.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <PaymentMethodCard
              method={r.method}
              isRecommended={recommendedIds.has(r.method.id)}
              recommendedReason={recommendationReasons.get(r.method.id)}
              isSelectedForComparison={selectedForComparison.includes(
                r.method.id,
              )}
              onToggleComparison={onToggleComparison}
              orderContext={orderContext}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Divider between compatible and incompatible */}
      {incompatibleMethods.length > 0 && compatibleMethods.length > 0 && (
        <div className="col-span-full">
          <Separator />
          <p className="text-sm text-slate-400 mt-2">
            Other available methods
          </p>
        </div>
      )}

      {/* Incompatible methods */}
      <AnimatePresence mode="popLayout">
        {incompatibleMethods.map((r) => (
          <motion.div
            key={r.method.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <PaymentMethodCard
              method={r.method}
              isRecommended={recommendedIds.has(r.method.id)}
              recommendedReason={recommendationReasons.get(r.method.id)}
              isSelectedForComparison={selectedForComparison.includes(
                r.method.id,
              )}
              onToggleComparison={onToggleComparison}
              orderContext={orderContext}
              incompatibleReason={r.fitReason}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
