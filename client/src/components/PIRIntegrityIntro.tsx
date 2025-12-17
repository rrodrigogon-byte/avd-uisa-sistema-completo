import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  BookOpen, 
  Target, 
  Users, 
  MessageSquare, 
  Heart, 
  Zap, 
  CheckCircle2,
  Info
} from "lucide-react";

/**
 * Componente de introdução ao teste PIR Integridade
 * Explica a metodologia, dimensões e fornece contexto ao usuário
 */
export function PIRIntegrityIntro() {
  const dimensions = [
    {
      code: "HON",
      name: "Honestidade",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "Capacidade de agir com transparência e verdade em todas as situações"
    },
    {
      code: "CON",
      name: "Confiabilidade",
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: "Consistência em cumprir compromissos e manter a palavra dada"
    },
    {
      code: "RES",
      name: "Responsabilidade",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Assumir as consequências de suas ações e decisões"
    },
    {
      code: "RSP",
      name: "Respeito",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      description: "Valorização da dignidade e direitos de todas as pessoas"
    },
    {
      code: "JUS",
      name: "Justiça",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
      description: "Equidade e imparcialidade nas relações e decisões"
    },
    {
      code: "COR",
      name: "Coragem Moral",
      icon: Zap,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      description: "Capacidade de defender valores éticos mesmo sob pressão"
    }
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Sobre o Teste */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Sobre o Teste PIR Integridade</CardTitle>
              <CardDescription>Baseado na Teoria de Desenvolvimento Moral de Lawrence Kohlberg</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            O <strong>PIR (Perfil de Integridade e Responsabilidade)</strong> é uma ferramenta científica que avalia aspectos éticos e comportamentais fundamentais para o ambiente profissional. Desenvolvido com base na teoria de desenvolvimento moral de Lawrence Kohlberg, o teste identifica como você toma decisões éticas em diferentes contextos.
          </p>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Como Funciona</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>Você será apresentado a cenários e afirmações relacionadas a situações do dia a dia profissional. Não existem respostas certas ou erradas - o objetivo é entender seu perfil natural de integridade.</p>
              <p className="font-medium text-foreground">Responda com sinceridade e baseado em como você realmente agiria, não em como acha que deveria agir.</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Vídeo Explicativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Vídeo Explicativo
          </CardTitle>
          <CardDescription>Entenda melhor o teste antes de começar (opcional)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video rounded-lg overflow-hidden bg-black">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
              title="Vídeo Explicativo - Teste PIR Integridade"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            💡 <strong>Dica:</strong> Assista ao vídeo para entender melhor como funciona o teste e como responder com sinceridade.
          </p>
        </CardContent>
      </Card>

      {/* Dimensões Avaliadas */}
      <Card>
        <CardHeader>
          <CardTitle>Dimensões Avaliadas</CardTitle>
          <CardDescription>O teste avalia 6 dimensões fundamentais de integridade</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dimensions.map((dim) => {
              const Icon = dim.icon;
              return (
                <div
                  key={dim.code}
                  className={`${dim.bgColor} rounded-lg p-4 border border-border/50 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${dim.color} mt-0.5`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{dim.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {dim.code}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {dim.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Teoria de Kohlberg */}
      <Card>
        <CardHeader>
          <CardTitle>Teoria de Desenvolvimento Moral de Kohlberg</CardTitle>
          <CardDescription>Base científica do teste</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lawrence Kohlberg (1927-1987) foi um psicólogo americano que desenvolveu uma das teorias mais influentes sobre desenvolvimento moral. Sua pesquisa identificou três níveis principais de raciocínio moral:
          </p>

          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-semibold text-sm mb-1">Nível 1: Pré-Convencional</h4>
              <p className="text-xs text-muted-foreground">
                Decisões baseadas em consequências pessoais (punição/recompensa)
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h4 className="font-semibold text-sm mb-1">Nível 2: Convencional</h4>
              <p className="text-xs text-muted-foreground">
                Decisões baseadas em normas sociais e expectativas do grupo
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h4 className="font-semibold text-sm mb-1">Nível 3: Pós-Convencional</h4>
              <p className="text-xs text-muted-foreground">
                Decisões baseadas em princípios éticos universais e valores internalizados
              </p>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              O teste PIR identifica seu nível predominante de raciocínio moral e como ele se manifesta nas 6 dimensões de integridade avaliadas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
