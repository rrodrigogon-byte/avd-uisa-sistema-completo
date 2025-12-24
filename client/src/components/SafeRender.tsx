import { ReactNode } from "react";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";

interface SafeRenderProps {
  data: any;
  children: (data: any) => ReactNode;
  fallback?: ReactNode;
  validate?: (data: any) => boolean;
}

/**
 * Componente para renderização segura de dados
 * Valida dados antes de renderizar para evitar erros de runtime
 */
export function SafeRender({ data, children, fallback = null, validate }: SafeRenderProps) {
  // Validação básica
  if (data === null || data === undefined) {
    return <>{fallback}</>;
  }

  // Validação customizada
  if (validate && !validate(data)) {
    return <>{fallback}</>;
  }

  // Validação para arrays
  if (Array.isArray(data) && data.length === 0) {
    return <>{fallback}</>;
  }

  try {
    return <>{children(data)}</>;
  } catch (error) {
    console.error("SafeRender error:", error);
    return <>{fallback}</>;
  }
}

/**
 * Hook para validação segura de valores antes de usar .toString()
 */
export function safeToString(value: any, fallback: string = ""): string {
  if (value === null || value === undefined) {
    return fallback;
  }
  
  try {
    return value.toString();
  } catch (error) {
    console.error("safeToString error:", error);
    return fallback;
  }
}

/**
 * Hook para validação segura de arrays antes de usar .map()
 */
export function safeMap<T, R>(
  array: T[] | null | undefined,
  callback: (item: T, index: number) => R,
  fallback: R[] = []
): R[] {
  if (!Array.isArray(array)) {
    return fallback;
  }

  try {
    return array.filter(item => item !== null && item !== undefined).map(callback);
  } catch (error) {
    console.error("safeMap error:", error);
    return fallback;
  }
}

/**
 * Hook para acesso seguro a propriedades de objetos
 */
export function safeGet<T>(
  obj: any,
  path: string,
  fallback?: T
): T | undefined {
  if (!obj || typeof obj !== "object") {
    return fallback;
  }

  const keys = path.split(".");
  let result = obj;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== "object") {
      return fallback;
    }
    result = result[key];
  }

  return result !== undefined ? result : fallback;
}
