import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BadgeConfirmation } from '@/components/BadgeConfirmation';
import type { RecommendationResult } from '@/types';

interface RecommendationBannerProps {
  result: RecommendationResult;
}

export function RecommendationBanner({ result }: RecommendationBannerProps) {
  return (
    <AnimatePresence>
      {result.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 mb-6"
        >
          {/* Header row */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-green-600 shrink-0" />
            <span className="font-medium text-green-900">
              {result.explanation}
            </span>
            {result.isConfident && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200 text-xs"
              >
                High confidence
              </Badge>
            )}
          </div>

          {/* Recommendations row */}
          <div className="flex flex-wrap gap-3 mt-3">
            {result.recommendations.map((rec) => (
              <div
                key={rec.method.id}
                className="bg-white border border-green-200 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm">
                    {rec.method.name}
                  </span>
                  <BadgeConfirmation
                    confirmationTime={rec.method.confirmationTime}
                    size="sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
