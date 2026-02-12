interface LoadingSkeletonProps {
  type?: "text" | "title" | "card";
  count?: number;
  className?: string;
}

export function LoadingSkeleton({
  type = "text",
  count = 1,
  className = "",
}: LoadingSkeletonProps) {
  const skeletonClass = `skeleton-${type} ${className}`;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClass} />
      ))}
    </>
  );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-lg p-6 space-y-4"
        >
          <div className="skeleton-title" />
          <div className="skeleton-text" />
          <div className="skeleton-text" />
          <div className="skeleton-text w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex gap-4">
          <div className="skeleton-text w-1/4" />
          <div className="skeleton-text w-1/3" />
          <div className="skeleton-text w-1/4" />
          <div className="skeleton-text w-1/6" />
        </div>
      ))}
    </div>
  );
}
