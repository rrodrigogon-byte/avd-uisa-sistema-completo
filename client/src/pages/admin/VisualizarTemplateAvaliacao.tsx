import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, FileText, CheckCircle2, XCircle, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Página de visualização de template de avaliação
 */
export default function VisualizarTemplateAvaliacao() {
  const [, params] = useRoute("/admin/templates-avaliacao/:id");
  const [, setLocation] = useLocation();
  const templateId = params?.id ? parseInt(params.id) : 0;

  const { data: template, isLoading } = trpc.evaluationTemplates.getById.useQuery(
    { id: templateId },
    { enabled: templateId > 0 }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Template não encontrado
            </h3>
            <p className="text-gray-600 mb-4">
              O template solicitado não existe ou foi removido.
            </p>
            <Button onClick={() => setLocation("/admin/templates-avaliacao")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Templates
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/admin/templates-avaliacao")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {template.name}
              {template.isDefault && (
                <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              )}
            </h1>
            <p className="text-gray-600 mt-1">{template.description || "Sem descrição"}</p>
          </div>
        </div>
        <Button onClick={() => setLocation(`/admin/templates-avaliacao/${templateId}/editar`)}>
          <Edit className="h-4 w-4 mr-2" />
          Editar Template
        </Button>
      </div>

      {/* Informações do Template */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={template.templateType === "360" ? "default" : "secondary"}>
              {template.templateType === "360" ? "Avaliação 360°" : template.templateType || "Padrão"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {template.isActive ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="text-green-600 font-medium">Ativo</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600 font-medium">Inativo</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Nível Hierárquico</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {template.hierarchyLevel === "operacional" && "Operacional"}
              {template.hierarchyLevel === "coordenacao" && "Coordenação"}
              {template.hierarchyLevel === "gerencia" && "Gerência"}
              {template.hierarchyLevel === "diretoria" && "Diretoria"}
              {!template.hierarchyLevel && "Não especificado"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Perguntas do Template */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas do Template</CardTitle>
          <CardDescription>
            {template.questions?.length || 0} perguntas configuradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {template.questions && template.questions.length > 0 ? (
            <div className="space-y-4">
              {template.questions.map((question: any, index: number) => (
                <div key={question.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-500">
                          Questão {index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {question.questionType === "rating" && "Escala"}
                          {question.questionType === "text" && "Texto"}
                          {question.questionType === "multiple_choice" && "Múltipla Escolha"}
                        </Badge>
                        {question.isRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatória
                          </Badge>
                        )}
                      </div>
                      <p className="text-base font-medium">{question.questionText}</p>
                      {question.helpText && (
                        <p className="text-sm text-gray-600 mt-1">{question.helpText}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Peso</div>
                      <div className="text-lg font-semibold">{question.weight || 1}</div>
                    </div>
                  </div>

                  {question.competencyId && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Competência ID: {question.competencyId}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma pergunta configurada neste template</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
