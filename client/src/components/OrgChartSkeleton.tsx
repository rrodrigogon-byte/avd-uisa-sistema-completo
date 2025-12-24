import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton loader para o organograma
 * Simula a estrutura hierárquica com cards de funcionários
 */
export function OrgChartSkeleton() {
  return (
    <div className="space-y-6">
      {/* Filtros skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Controles skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Organograma skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-8">
            {/* Nível 1 - CEO */}
            <div className="flex justify-center">
              <OrgNodeSkeleton />
            </div>

            {/* Nível 2 - Diretores */}
            <div className="flex justify-center gap-8">
              <OrgNodeSkeleton />
              <OrgNodeSkeleton />
              <OrgNodeSkeleton />
            </div>

            {/* Nível 3 - Gerentes */}
            <div className="flex justify-center gap-4">
              <OrgNodeSkeleton size="sm" />
              <OrgNodeSkeleton size="sm" />
              <OrgNodeSkeleton size="sm" />
              <OrgNodeSkeleton size="sm" />
              <OrgNodeSkeleton size="sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Skeleton de um nó individual do organograma
 */
function OrgNodeSkeleton({ size = "md" }: { size?: "sm" | "md" }) {
  const cardClass = size === "sm" ? "w-32" : "w-48";
  const avatarClass = size === "sm" ? "h-8 w-8" : "h-12 w-12";
  const textClass = size === "sm" ? "h-3" : "h-4";

  return (
    <Card className={`${cardClass} animate-pulse`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className={`${avatarClass} rounded-full`} />
          <div className="flex-1 space-y-1">
            <Skeleton className={`${textClass} w-full`} />
            <Skeleton className="h-2 w-3/4" />
          </div>
        </div>
        {size === "md" && (
          <div className="space-y-1">
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-2/3" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
