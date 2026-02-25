import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ConfirmationTime } from '@/types';

const CONFIRMATION_CONFIG: Record<
  ConfirmationTime,
  { label: string; className: string }
> = {
  instant: {
    label: '\u26A1 Instant',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  '2hr': {
    label: '\u23F1 ~2 hours',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  '24hr': {
    label: '\u{1F550} ~24 hours',
    className: 'bg-orange-100 text-orange-800 border-orange-200',
  },
  '48hr': {
    label: '\u23F3 2 days',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
  '3day': {
    label: '\u{1F4C5} 3 days',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-1',
} as const;

interface BadgeConfirmationProps {
  confirmationTime: ConfirmationTime;
  size?: 'sm' | 'md';
}

export function BadgeConfirmation({
  confirmationTime,
  size = 'sm',
}: BadgeConfirmationProps) {
  const config = CONFIRMATION_CONFIG[confirmationTime];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, SIZE_CLASSES[size])}
    >
      {config.label}
    </Badge>
  );
}
