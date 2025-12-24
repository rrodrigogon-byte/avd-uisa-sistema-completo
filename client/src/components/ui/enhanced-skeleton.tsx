import { cn } from "@/lib/utils";

/**
 * Enhanced Skeleton Component
 * Skeleton loaders aprimorados com animações suaves
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export function EnhancedSkeleton({
  className,
  variant = 'default',
  animation = 'pulse',
  width,
  height,
  ...props
}: SkeletonProps) {
  const baseClasses = "bg-muted";
  
  const variantClasses = {
    default: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-none",
    text: "rounded-sm h-4",
  };

  const animationClasses = {
    pulse: "animate-pulse",
    wave: "animate-shimmer bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%]",
    none: "",
  };

  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      style={style}
      {...props}
    />
  );
}

/**
 * Skeleton presets para casos comuns
 */
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <EnhancedSkeleton className="h-4 w-3/4" />
      <EnhancedSkeleton className="h-3 w-full" />
      <EnhancedSkeleton className="h-3 w-5/6" />
      <div className="flex gap-2 mt-4">
        <EnhancedSkeleton className="h-8 w-20" />
        <EnhancedSkeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <EnhancedSkeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <EnhancedSkeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <EnhancedSkeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1 space-y-2">
            <EnhancedSkeleton className="h-4 w-3/4" />
            <EnhancedSkeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="space-y-3">
      <EnhancedSkeleton className="h-6 w-1/3" />
      <EnhancedSkeleton className="h-[300px] w-full" />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <EnhancedSkeleton className="h-4 w-24" />
          <EnhancedSkeleton className="h-10 w-full" />
        </div>
      ))}
      <EnhancedSkeleton className="h-10 w-32 mt-6" />
    </div>
  );
}
