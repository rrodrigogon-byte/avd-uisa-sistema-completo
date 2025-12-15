import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TourStep {
  target: string; // Seletor CSS do elemento alvo
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
}

const tourSteps: TourStep[] = [
  {
    target: "[data-tour='search']",
    title: "Busca Global",
    content: "Use Ctrl+K ou clique aqui para buscar rapidamente em todo o sistema: funcionários, metas, avaliações, PDIs e mais.",
    placement: "bottom",
  },
  {
    target: "[data-tour='favorites']",
    title: "Favoritos",
    content: "Adicione páginas aos favoritos para acesso rápido. Clique na estrela em qualquer página para favoritar.",
    placement: "bottom",
  },
  {
    target: "[data-tour='notifications']",
    title: "Notificações",
    content: "Receba alertas sobre aprovações pendentes, prazos e atualizações importantes.",
    placement: "bottom",
  },
  {
    target: "[data-tour='profile']",
    title: "Perfil",
    content: "Acesse suas configurações, preferências e informações pessoais.",
    placement: "bottom",
  },
  {
    target: "[data-tour='sidebar-metas']",
    title: "Gestão de Metas",
    content: "Crie, acompanhe e atualize suas metas SMART. Veja o progresso em tempo real.",
    placement: "right",
  },
  {
    target: "[data-tour='sidebar-avaliacoes']",
    title: "Avaliações",
    content: "Realize autoavaliações, avaliações 360° e acompanhe seu desempenho.",
    placement: "right",
  },
  {
    target: "[data-tour='sidebar-pdi']",
    title: "PDI - Plano de Desenvolvimento",
    content: "Crie seu plano de desenvolvimento individual com base em gaps de competências.",
    placement: "right",
  },
  {
    target: "[data-tour='sidebar-atividades']",
    title: "Minhas Atividades",
    content: "Registre suas atividades diárias e acompanhe sua produtividade.",
    placement: "right",
  },
];

const TOUR_COMPLETED_KEY = "avd-uisa-tour-completed";

export function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Verificar se o tour já foi completado
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!completed) {
      // Aguardar 1 segundo para garantir que a página carregou
      const timer = setTimeout(() => {
        setIsOpen(true);
        updatePosition();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [currentStep, isOpen]);

  const updatePosition = () => {
    const step = tourSteps[currentStep];
    const element = document.querySelector(step.target);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const placement = step.placement || "bottom";

      let top = 0;
      let left = 0;

      const cardWidth = 320; // largura do card em pixels
      const cardHeight = 200; // altura aproximada do card
      const margin = 20; // margem de segurança

      switch (placement) {
        case "bottom":
          top = rect.bottom + margin;
          left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, rect.left + rect.width / 2 - cardWidth / 2));
          break;
        case "top":
          top = Math.max(margin, rect.top - cardHeight - margin);
          left = Math.max(margin, Math.min(window.innerWidth - cardWidth - margin, rect.left + rect.width / 2 - cardWidth / 2));
          break;
        case "right":
          top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, rect.top + rect.height / 2 - cardHeight / 2));
          left = Math.min(window.innerWidth - cardWidth - margin, rect.right + margin);
          break;
        case "left":
          top = Math.max(margin, Math.min(window.innerHeight - cardHeight - margin, rect.top + rect.height / 2 - cardHeight / 2));
          left = Math.max(margin, rect.left - cardWidth - margin);
          break;
      }

      setPosition({ top, left });

      // Destacar elemento
      element.classList.add("tour-highlight");
      
      // Remover destaque de outros elementos
      document.querySelectorAll(".tour-highlight").forEach((el) => {
        if (el !== element) {
          el.classList.remove("tour-highlight");
        }
      });
    }
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    setIsOpen(false);
    
    // Remover todos os destaques
    document.querySelectorAll(".tour-highlight").forEach((el) => {
      el.classList.remove("tour-highlight");
    });
  };

  if (!isOpen) {
    return null;
  }

  const step = tourSteps[currentStep];

  return (
    <>
      {/* Overlay escuro */}
      <div className="fixed inset-0 bg-black/50 z-[9998]" onClick={handleSkip} />

      {/* Card do tour */}
      <Card
        className="fixed z-[9999] w-80 shadow-2xl border-2 border-primary/20"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <CardHeader className="pb-3 bg-primary/5">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {currentStep + 1} de {tourSteps.length}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
              onClick={handleSkip}
              title="Pular tour"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground">{step.content}</p>
        </CardContent>
        <CardFooter className="flex items-center justify-between pt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Pular tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" size="sm" onClick={handlePrevious}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep < tourSteps.length - 1 ? (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              ) : (
                "Concluir"
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Estilos para destaque */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 9999;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
          border-radius: 8px;
          animation: tour-pulse 2s ease-in-out infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
          }
        }
      `}</style>
    </>
  );
}

// Botão para reiniciar o tour
export function RestartTourButton() {
  const handleRestart = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    window.location.reload();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleRestart}>
      Reiniciar Tour
    </Button>
  );
}
