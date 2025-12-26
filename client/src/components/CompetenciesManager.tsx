import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Pencil, Trash2, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompetenciesManagerProps {
  employeeId: number;
}

export default function CompetenciesManager({ employeeId }: CompetenciesManagerProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<any>(null);
  const [newCompetency, setNewCompetency] = useState({ competencyId: 0, currentLevel: 1 });
  const [editLevel, setEditLevel] = useState(1);

  const utils = trpc.useUtils();
  const { data: competencies, isLoading } = trpc.employeeProfile.listCompetencies.useQuery({ employeeId });
  const { data: availableCompetencies } = trpc.employeeProfile.listAvailableCompetencies.useQuery({});

  const addMutation = trpc.employeeProfile.addCompetency.useMutation({
    onSuccess: () => {
      toast.success("Competência adicionada com sucesso!");
      utils.employeeProfile.listCompetencies.invalidate({ employeeId });
      setAddDialogOpen(false);
      setNewCompetency({ competencyId: 0, currentLevel: 1 });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar competência");
    },
  });

  const updateMutation = trpc.employeeProfile.updateCompetency.useMutation({
    onSuccess: () => {
      toast.success("Nível atualizado com sucesso!");
      utils.employeeProfile.listCompetencies.invalidate({ employeeId });
      setEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar nível");
    },
  });

  const deleteMutation = trpc.employeeProfile.removeCompetency.useMutation({
    onSuccess: () => {
      toast.success("Competência removida com sucesso!");
      utils.employeeProfile.listCompetencies.invalidate({ employeeId });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover competência");
    },
  });

  const handleAdd = () => {
    if (newCompetency.competencyId === 0) {
      toast.error("Selecione uma competência");
      return;
    }
    addMutation.mutate({
      employeeId,
      competencyId: newCompetency.competencyId,
      currentLevel: newCompetency.currentLevel,
    });
  };

  const handleEdit = () => {
    if (selectedCompetency) {
      updateMutation.mutate({
        id: selectedCompetency.id,
        currentLevel: editLevel,
      });
    }
  };

  const handleDelete = () => {
    if (selectedCompetency) {
      deleteMutation.mutate({ id: selectedCompetency.id });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "tecnica":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "comportamental":
        return "bg-green-100 text-green-700 border-green-200";
      case "lideranca":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getLevelStars = (level: number) => {
    return "★".repeat(level) + "☆".repeat(5 - level);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Competências</h3>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-[#F39200] hover:bg-[#d97f00]">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Competência
          </Button>
        </div>

        {competencies && competencies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {competencies.map((comp) => (
              <Card key={comp.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{comp.competencyName}</CardTitle>
                      <Badge variant="outline" className={`mt-2 ${getCategoryColor(comp.competencyCategory || "")}`}>
                        {comp.competencyCategory}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCompetency(comp);
                          setEditLevel(comp.currentLevel);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedCompetency(comp);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {comp.competencyDescription && (
                      <p className="text-sm text-gray-600">{comp.competencyDescription}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Nível Atual:</span>
                      <span className="text-lg text-[#F39200]">{getLevelStars(comp.currentLevel)}</span>
                    </div>
                    {comp.evaluatedAt && (
                      <p className="text-xs text-gray-500">
                        Avaliado em: {new Date(comp.evaluatedAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12">
            <div className="text-center text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">Nenhuma competência registrada</p>
              <Button onClick={() => setAddDialogOpen(true)} className="bg-[#F39200] hover:bg-[#d97f00]">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Competência
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Dialog Adicionar */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Competência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Competência</Label>
              <Select
                value={newCompetency.competencyId.toString()}
                onValueChange={(value) => setNewCompetency({ ...newCompetency, competencyId: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma competência" />
                </SelectTrigger>
                <SelectContent>
                  {availableCompetencies?.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id.toString()}>
                      {comp.name} ({comp.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível Atual (1-5)</Label>
              <Select
                value={newCompetency.currentLevel.toString()}
                onValueChange={(value) => setNewCompetency({ ...newCompetency, currentLevel: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {getLevelStars(level)} - Nível {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending}>
              {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Nível de Competência</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="font-semibold">{selectedCompetency?.competencyName}</p>
              <p className="text-sm text-gray-600">{selectedCompetency?.competencyDescription}</p>
            </div>

            <div className="space-y-2">
              <Label>Novo Nível (1-5)</Label>
              <Select value={editLevel.toString()} onValueChange={(value) => setEditLevel(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      {getLevelStars(level)} - Nível {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a competência "{selectedCompetency?.competencyName}"? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
