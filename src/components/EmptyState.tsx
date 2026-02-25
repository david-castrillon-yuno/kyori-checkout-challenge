import { SearchX } from 'lucide-react';

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <SearchX className="h-12 w-12 text-slate-300" />
      <h3 className="mt-4 text-lg font-semibold text-slate-700">
        No payment methods match your filters
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Try adjusting your filters or clearing them to see all available methods
      </p>
    </div>
  );
}
