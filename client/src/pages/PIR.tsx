import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function PIR() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: pirData, isLoading } = trpc.pir.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  const myPirs = pirData?.asUser || [];
  const managedPirs = pirData?.asManager || [];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      draft: { variant: "outline", label: "Rascunho" },
      active: { variant: "default", label: "Ativo" },
      completed: { variant: "secondary", label: "Concluído" },
      cancelled: { variant: "destructive", label: "Cancelado" },
    };
    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">PIR - Plano Individual de Resultados</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus planos e acompanhe o progresso das metas</p>
          </div>
          <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
            <Plus className="w-4 h-4 mr-2" />
            Novo PIR
          </Button>
        </div>

        {/* Meus PIRs */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Meus PIRs
          </h2>
          {myPirs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Você ainda não possui PIRs cadastrados</p>
                <Button variant="outline" className="mt-4" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  Criar meu primeiro PIR
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myPirs.map((pir: any) => (
                <Card key={pir.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/pir/${pir.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pir.title}</CardTitle>
                      {getStatusBadge(pir.status)}
                    </div>
                    <CardDescription>{pir.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {pir.description && (
                        <p className="text-muted-foreground line-clamp-2">{pir.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pir.startDate).toLocaleDateString('pt-BR')} - {new Date(pir.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* PIRs que eu gerencio */}
        {managedPirs.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              PIRs sob minha gestão
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {managedPirs.map((pir: any) => (
                <Card key={pir.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/pir/${pir.id}`)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{pir.title}</CardTitle>
                      {getStatusBadge(pir.status)}
                    </div>
                    <CardDescription>{pir.period}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {pir.description && (
                        <p className="text-muted-foreground line-clamp-2">{pir.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(pir.startDate).toLocaleDateString('pt-BR')} - {new Date(pir.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
