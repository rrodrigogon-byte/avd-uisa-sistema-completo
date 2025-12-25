import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackPath?: string;
  label?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  className?: string;
}

/**
 * Componente BackButton Global
 * Navegação inteligente: volta para página anterior ou fallback
 */
export default function BackButton({
  fallbackPath = "/",
  label = "Voltar",
  variant = "ghost",
  className = "",
}: BackButtonProps) {
  const [, navigate] = useLocation();

  const handleBack = () => {
    // Tentar voltar no histórico
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Se não houver histórico, ir para fallback
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleBack}
      className={`gap-2 ${className}`}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
