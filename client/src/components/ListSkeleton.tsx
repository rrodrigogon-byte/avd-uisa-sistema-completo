import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  /**
   * Número de itens skeleton a exibir
   */
  count?: number;
  /**
   * Mostrar header do card
   */
  showHeader?: boolean;
  /**
   * Altura de cada item
   */
  itemHeight?: string;
  /**
   * Classe CSS adicional
   */
  className?: string;
}

/**
 * Componente de skeleton para listagens
 * Exibe placeholders animados enquanto os dados estão carregando
 */
export default function ListSkeleton({
  count = 3,
  showHeader = false,
  itemHeight = "h-20",
  className = "",
}: ListSkeletonProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={`flex items-center gap-4 p-4 border rounded-lg ${itemHeight}`}>
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton para tabelas
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton para cards em grid
 */
export function GridSkeleton({ count = 6, columns = 3 }: { count?: number; columns?: number }) {
  const gridClass = columns === 2 ? "grid-cols-2" : columns === 3 ? "grid-cols-3" : "grid-cols-4";
  
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
