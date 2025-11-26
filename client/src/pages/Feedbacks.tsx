import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { MessageSquare, ThumbsUp, AlertCircle, TrendingUp, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEmployeeSearch } from "@/hooks/useEmployeeSearch";

export default function Feedbacks() {
  const { user } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<number | undefined>();
  const [filterType, setFilterType] = useState<"positivo" | "construtivo" | "desenvolvimento" | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "positivo" as "positivo" | "construtivo" | "desenvolvimento",
    category: "",
    content: "",
    context: "",
    actionItems: "",
    isPrivate: false,
  });

  const {
    searchTerm: employeeSearch,
    setSearchTerm: setEmployeeSearch,
    employees,
    isLoading: loadingEmployees
  } = useEmployeeSearch();
  const { data: feedbacks, refetch } = trpc.feedback.list.useQuery({
    employeeId: selectedEmployee,
    type: filterType,
  });
  const { data: stats } = trpc.feedback.getStats.useQuery({
    employeeId: selectedEmployee,
  });

  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      toast.success("Feedback registrado com sucesso!");
      setIsDialogOpen(false);
      refetch();
      // Reset form
      setFormData({
        employeeId: "",
        type: "positivo",
        category: "",
        content: "",
        context: "",
        actionItems: "",
        isPrivate: false,
      });
    },
    onError: (error) => {
      toast.error(`Erro ao registrar feedback: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.content) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    createMutation.mutate({
      employeeId: parseInt(formData.employeeId),
      type: formData.type,
      category: formData.category || undefined,
      content: formData.content,
      context: formData.context || undefined,
      actionItems: formData.actionItems || undefined,
      isPrivate: formData.isPrivate,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "positivo":
        return <ThumbsUp className="h-4 w-4" />;
      case "construtivo":
        return <AlertCircle className="h-4 w-4" />;
      case "desenvolvimento":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      positivo: "default",
      construtivo: "secondary",
      desenvolvimento: "destructive",
    };
    return variants[type] || "default";
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feedback Contínuo</h1>
          <p className="text-muted-foreground">
            Registre e acompanhe feedbacks 1-on-1 com colaboradores
          </p>
        </div>
        {user?.role !== "colaborador" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Registrar Novo Feedback</DialogTitle>
                <DialogDescription>
                  Registre um feedback para um colaborador
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="employeeId">Funcionário *</Label>
                  <Input
                    placeholder="Digite o nome do funcionário..."
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingEmployees ? (
                        <SelectItem value="loading" disabled>Carregando...</SelectItem>
                      ) : (
                        employees?.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="positivo">Positivo</SelectItem>
                        <SelectItem value="construtivo">Construtivo</SelectItem>
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Input
                      id="category"
                      placeholder="Ex: Comunicação, Liderança"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Conteúdo do Feedback *</Label>
                  <Textarea
                    id="content"
                    placeholder="Descreva o feedback de forma clara e objetiva"
                    rows={4}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="context">Contexto/Situação</Label>
                  <Textarea
                    id="context"
                    placeholder="Descreva o contexto ou situação específica"
                    rows={3}
                    value={formData.context}
                    onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="actionItems">Ações Recomendadas</Label>
                  <Textarea
                    id="actionItems"
                    placeholder="Liste ações ou próximos passos recomendados"
                    rows={3}
                    value={formData.actionItems}
                    onChange={(e) => setFormData({ ...formData, actionItems: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={formData.isPrivate}
                    onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="isPrivate" className="cursor-pointer">
                    Feedback privado (visível apenas para gestor e colaborador)
                  </Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Salvando..." : "Salvar Feedback"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Feedbacks</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positivos</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.positivo || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Construtivos</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.construtivo || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desenvolvimento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.desenvolvimento || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Colaborador</Label>
            <Select
              value={selectedEmployee?.toString()}
              onValueChange={(value) => setSelectedEmployee(value ? parseInt(value) : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os colaboradores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {employees?.map((item) => (
                  <SelectItem key={item.employee.id} value={item.employee.id.toString()}>
                    {item.employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label>Tipo</Label>
            <Select
              value={filterType}
              onValueChange={(value: any) => setFilterType(value === "all" ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="positivo">Positivo</SelectItem>
                <SelectItem value="construtivo">Construtivo</SelectItem>
                <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Feedbacks */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Feedbacks</CardTitle>
          <CardDescription>
            {feedbacks?.length || 0} feedback(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feedbacks && feedbacks.length > 0 ? (
            feedbacks.map((item) => (
              <Card key={item.feedback.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.feedback.type)}
                      <div>
                        <CardTitle className="text-base">{item.employee?.name}</CardTitle>
                        <CardDescription>
                          {new Date(item.feedback.createdAt).toLocaleDateString("pt-BR")}
                          {item.feedback.category && ` • ${item.feedback.category}`}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant={getTypeBadge(item.feedback.type)}>
                      {item.feedback.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Feedback:</p>
                    <p className="text-sm text-muted-foreground">{item.feedback.content}</p>
                  </div>
                  {item.feedback.context && (
                    <div>
                      <p className="text-sm font-medium">Contexto:</p>
                      <p className="text-sm text-muted-foreground">{item.feedback.context}</p>
                    </div>
                  )}
                  {item.feedback.actionItems && (
                    <div>
                      <p className="text-sm font-medium">Ações Recomendadas:</p>
                      <p className="text-sm text-muted-foreground">{item.feedback.actionItems}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum feedback encontrado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
