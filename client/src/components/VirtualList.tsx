import { useRef, useState, useEffect, CSSProperties } from "react";
import { useThrottle } from "@/lib/performance";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Número de itens extras para renderizar fora da viewport
  className?: string;
}

/**
 * Componente de lista virtual para renderizar eficientemente grandes listas
 * Renderiza apenas os itens visíveis + overscan
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = "",
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Throttle do scroll para performance
  const throttledScrollTop = useThrottle(scrollTop, 16); // ~60fps

  // Calcular quais itens devem ser renderizados
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(throttledScrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((throttledScrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Array<{
    key: string;
    header: string;
    render: (item: T) => React.ReactNode;
    width?: string;
  }>;
  rowHeight?: number;
  containerHeight?: number;
  overscan?: number;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
}

/**
 * Tabela virtual otimizada para grandes conjuntos de dados
 */
export function VirtualTable<T>({
  data,
  columns,
  rowHeight = 48,
  containerHeight = 600,
  overscan = 5,
  onRowClick,
  className = "",
}: VirtualTableProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const throttledScrollTop = useThrottle(scrollTop, 16);

  const totalHeight = data.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(throttledScrollTop / rowHeight) - overscan);
  const endIndex = Math.min(
    data.length - 1,
    Math.ceil((throttledScrollTop + containerHeight) / rowHeight) + overscan
  );

  const visibleRows = data.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * rowHeight;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Header fixo */}
      <div className="border-b bg-muted/50">
        <div className="flex">
          {columns.map((col) => (
            <div
              key={col.key}
              className="px-4 py-3 text-sm font-medium"
              style={{ width: col.width || `${100 / columns.length}%` }}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body com scroll virtual */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto"
        style={{ height: containerHeight }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((row, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={actualIndex}
                  className="flex border-b hover:bg-accent/50 cursor-pointer transition-colors"
                  style={{ height: rowHeight }}
                  onClick={() => onRowClick?.(row, actualIndex)}
                >
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      className="px-4 py-3 text-sm flex items-center"
                      style={{ width: col.width || `${100 / columns.length}%` }}
                    >
                      {col.render(row)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer com info */}
      <div className="border-t px-4 py-2 text-sm text-muted-foreground bg-muted/30">
        Mostrando {startIndex + 1}-{endIndex + 1} de {data.length} itens
      </div>
    </div>
  );
}

/**
 * Hook para infinite scroll
 */
export function useInfiniteScroll(
  callback: () => void,
  options: {
    threshold?: number; // Distância do fim (em px) para disparar callback
    enabled?: boolean;
  } = {}
) {
  const { threshold = 200, enabled = true } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { rootMargin: `${threshold}px` }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [callback, threshold, enabled]);

  return sentinelRef;
}

/**
 * Componente sentinela para infinite scroll
 */
export function InfiniteScrollSentinel({
  onIntersect,
  enabled = true,
}: {
  onIntersect: () => void;
  enabled?: boolean;
}) {
  const sentinelRef = useInfiniteScroll(onIntersect, { enabled });

  return <div ref={sentinelRef} className="h-4" />;
}
