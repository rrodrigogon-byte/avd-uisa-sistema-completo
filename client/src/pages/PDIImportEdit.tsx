import { useState, useEffect } from 'react';
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  Target,
  Calendar,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PDIError {
  field: string;
  message: string;
  row?: number;
  value?: string;
}

interface PDIAction {
  id?: number;
  title: string;
  description: string;
  category: '70_pratica' | '20_mentoria' | '10_curso';
  dueDate: string;
  status: string;
  responsible: string;
  hasError?: boolean;
  errorMessage?: string;
}

interface PDIData {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeCode: string;
  positionTitle: string;
  departmentName: string;
  cycleId: number;
  cycleName: string;
  status: string;
  startDate: string;
  endDate: string;
  strategicContext: string;
  durationMonths: number;
  overallProgress: number;
  actions: PDIAction[];
  competencyGaps: Array<{
    id?: number;
    competencyName: string;
    currentLevel: number;
    targetLevel: number;
    gap: number;
    priority: string;
    hasError?: boolean;
    errorMessage?: string;
  }>;
  errors: PDIError[];
}

export default function PDIImportEdit() {
  const params = useParams();
  const [, navigate] = useLocation();
  const importId = parseInt(params.id || '0');
  
  const [pdiData, setPdiData] = useState<PDIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNote, setApprovalNote] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<PDIError[]>([]);

  // Queries
  const { data: importDetails, refetch: refetchImport } = trpc.pdi.getImportDetails.useQuery(
    { id: importId },
    { enabled: !!importId }
  );

  const { data: cycles } = trpc.cycles.list.useQuery();
  const { data: employees } = trpc.employees.list.useQuery({ limit: 1000 });

  // Mutations
  const savePdiMutation = trpc.pdi.updateImportedPdi.useMutation({
    onSuccess: () => {
      toast.success('PDI salvo com sucesso!');
      setHasUnsavedChanges(false);
      refetchImport();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const submitForApprovalMutation = trpc.pdi.submitForApproval.useMutation({
    onSuccess: () => {
      toast.success('PDI enviado para aprovação!', {
        description: 'O Diretor de Gente, Administração e Inovação será notificado.',
      });
      setShowApprovalDialog(false);
      navigate('/pdi/import/history');
    },
    onError: (error) => {
      toast.error(`Erro ao enviar para aprovação: ${error.message}`);
    },
  });

  // Load PDI data from import details
  useEffect(() => {
    if (importDetails) {
      // Parse import details into PDI data structure
      const parsedData: PDIData = {
        id: importDetails.pdiId || 0,
        employeeId: importDetails.employeeId || 0,
        employeeName: importDetails.employeeName || '',
        employeeCode: importDetails.employeeCode || '',
        positionTitle: importDetails.positionTitle || '',
        departmentName: importDetails.departmentName || '',
        cycleId: importDetails.cycleId || 0,
        cycleName: importDetails.cycleName || '',
        status: importDetails.status || 'rascunho',
        startDate: importDetails.startDate || new Date().toISOString().split('T')[0],
        endDate: importDetails.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        strategicContext: importDetails.strategicContext || '',
        durationMonths: importDetails.durationMonths || 24,
        overallProgress: importDetails.overallProgress || 0,
        actions: importDetails.actions || [],
        competencyGaps: importDetails.competencyGaps || [],
        errors: importDetails.errors || [],
      };

      // Mark fields with errors
      if (parsedData.errors && parsedData.errors.length > 0) {
        parsedData.errors.forEach((error) => {
          if (error.field.startsWith('action_')) {
            const actionIndex = parseInt(error.field.split('_')[1]);
            if (parsedData.actions[actionIndex]) {
              parsedData.actions[actionIndex].hasError = true;
              parsedData.actions[actionIndex].errorMessage = error.message;
            }
          } else if (error.field.startsWith('gap_')) {
            const gapIndex = parseInt(error.field.split('_')[1]);
            if (parsedData.competencyGaps[gapIndex]) {
              parsedData.competencyGaps[gapIndex].hasError = true;
              parsedData.competencyGaps[gapIndex].errorMessage = error.message;
            }
          }
        });
      }

      setPdiData(parsedData);
      setValidationErrors(parsedData.errors);
      setIsLoading(false);
    }
  }, [importDetails]);

  // Validate PDI data
  const validatePdi = (): PDIError[] => {
    const errors: PDIError[] = [];

    if (!pdiData) return errors;

    // Validate required fields
    if (!pdiData.employeeName || pdiData.employeeName.trim() === '') {
      errors.push({ field: 'employeeName', message: 'Nome do funcionário é obrigatório' });
    }

    if (!pdiData.cycleId || pdiData.cycleId === 0) {
      errors.push({ field: 'cycleId', message: 'Ciclo de avaliação é obrigatório' });
    }

    if (!pdiData.startDate) {
      errors.push({ field: 'startDate', message: 'Data de início é obrigatória' });
    }

    if (!pdiData.endDate) {
      errors.push({ field: 'endDate', message: 'Data de término é obrigatória' });
    }

    if (pdiData.startDate && pdiData.endDate && new Date(pdiData.startDate) >= new Date(pdiData.endDate)) {
      errors.push({ field: 'endDate', message: 'Data de término deve ser posterior à data de início' });
    }

    // Validate actions
    pdiData.actions.forEach((action, index) => {
      if (!action.title || action.title.trim() === '') {
        errors.push({ field: `action_${index}_title`, message: `Ação ${index + 1}: Título é obrigatório`, row: index });
      }
      if (!action.category) {
        errors.push({ field: `action_${index}_category`, message: `Ação ${index + 1}: Categoria é obrigatória`, row: index });
      }
      if (!action.dueDate) {
        errors.push({ field: `action_${index}_dueDate`, message: `Ação ${index + 1}: Data de conclusão é obrigatória`, row: index });
      }
    });

    // Validate competency gaps
    pdiData.competencyGaps.forEach((gap, index) => {
      if (!gap.competencyName || gap.competencyName.trim() === '') {
        errors.push({ field: `gap_${index}_competencyName`, message: `Gap ${index + 1}: Nome da competência é obrigatório`, row: index });
      }
      if (gap.currentLevel < 1 || gap.currentLevel > 5) {
        errors.push({ field: `gap_${index}_currentLevel`, message: `Gap ${index + 1}: Nível atual deve estar entre 1 e 5`, row: index });
      }
      if (gap.targetLevel < 1 || gap.targetLevel > 5) {
        errors.push({ field: `gap_${index}_targetLevel`, message: `Gap ${index + 1}: Nível alvo deve estar entre 1 e 5`, row: index });
      }
    });

    return errors;
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    if (!pdiData) return;

    setPdiData({ ...pdiData, [field]: value });
    setHasUnsavedChanges(true);

    // Clear error for this field
    setValidationErrors(prev => prev.filter(e => e.field !== field));
  };

  // Handle action change
  const handleActionChange = (index: number, field: string, value: any) => {
    if (!pdiData) return;

    const newActions = [...pdiData.actions];
    newActions[index] = { ...newActions[index], [field]: value, hasError: false, errorMessage: '' };
    setPdiData({ ...pdiData, actions: newActions });
    setHasUnsavedChanges(true);

    // Clear error for this action field
    setValidationErrors(prev => prev.filter(e => !e.field.startsWith(`action_${index}`)));
  };

  // Handle gap change
  const handleGapChange = (index: number, field: string, value: any) => {
    if (!pdiData) return;

    const newGaps = [...pdiData.competencyGaps];
    newGaps[index] = { ...newGaps[index], [field]: value, hasError: false, errorMessage: '' };
    setPdiData({ ...pdiData, competencyGaps: newGaps });
    setHasUnsavedChanges(true);

    // Clear error for this gap field
    setValidationErrors(prev => prev.filter(e => !e.field.startsWith(`gap_${index}`)));
  };

  // Add new action
  const addAction = (category: '70_pratica' | '20_mentoria' | '10_curso') => {
    if (!pdiData) return;

    const newAction: PDIAction = {
      title: '',
      description: '',
      category,
      dueDate: pdiData.endDate,
      status: 'pendente',
      responsible: '',
    };

    setPdiData({ ...pdiData, actions: [...pdiData.actions, newAction] });
    setHasUnsavedChanges(true);
  };

  // Remove action
  const removeAction = (index: number) => {
    if (!pdiData) return;

    const newActions = pdiData.actions.filter((_, i) => i !== index);
    setPdiData({ ...pdiData, actions: newActions });
    setHasUnsavedChanges(true);
  };

  // Add new gap
  const addGap = () => {
    if (!pdiData) return;

    const newGap = {
      competencyName: '',
      currentLevel: 1,
      targetLevel: 3,
      gap: 2,
      priority: 'media',
    };

    setPdiData({ ...pdiData, competencyGaps: [...pdiData.competencyGaps, newGap] });
    setHasUnsavedChanges(true);
  };

  // Remove gap
  const removeGap = (index: number) => {
    if (!pdiData) return;

    const newGaps = pdiData.competencyGaps.filter((_, i) => i !== index);
    setPdiData({ ...pdiData, competencyGaps: newGaps });
    setHasUnsavedChanges(true);
  };

  // Save PDI
  const handleSave = async () => {
    if (!pdiData) return;

    const errors = validatePdi();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Corrija os erros antes de salvar', {
        description: `${errors.length} erro(s) encontrado(s)`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await savePdiMutation.mutateAsync({
        importId,
        pdiData: {
          employeeId: pdiData.employeeId,
          cycleId: pdiData.cycleId,
          startDate: pdiData.startDate,
          endDate: pdiData.endDate,
          strategicContext: pdiData.strategicContext,
          durationMonths: pdiData.durationMonths,
          actions: pdiData.actions,
          competencyGaps: pdiData.competencyGaps,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit for approval
  const handleSubmitForApproval = async () => {
    if (!pdiData) return;

    const errors = validatePdi();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Corrija os erros antes de enviar para aprovação', {
        description: `${errors.length} erro(s) encontrado(s)`,
      });
      setShowApprovalDialog(false);
      return;
    }

    await submitForApprovalMutation.mutateAsync({
      importId,
      pdiId: pdiData.id,
      note: approvalNote,
    });
  };

  // Check if field has error
  const hasError = (field: string): boolean => {
    return validationErrors.some(e => e.field === field || e.field.startsWith(field));
  };

  // Get error message for field
  const getErrorMessage = (field: string): string | undefined => {
    const error = validationErrors.find(e => e.field === field || e.field.startsWith(field));
    return error?.message;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
        </div>
      </DashboardLayout>
    );
  }

  if (!pdiData) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-600">PDI não encontrado</p>
          <Button onClick={() => navigate('/pdi/import/history')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Histórico
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalErrors = validationErrors.length;
  const actionsByCategory = {
    '70_pratica': pdiData.actions.filter(a => a.category === '70_pratica'),
    '20_mentoria': pdiData.actions.filter(a => a.category === '20_mentoria'),
    '10_curso': pdiData.actions.filter(a => a.category === '10_curso'),
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/pdi/import/history')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Histórico
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Editar PDI Importado</h1>
            <p className="text-gray-600 mt-1">
              Corrija os campos com erro e envie para aprovação
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Rascunho
            </Button>
            <Button
              onClick={() => setShowApprovalDialog(true)}
              disabled={totalErrors > 0}
              className="bg-[#F39200] hover:bg-[#d97f00]"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar para Aprovação
            </Button>
          </div>
        </div>

        {/* Error Summary */}
        {totalErrors > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção: {totalErrors} erro(s) encontrado(s)</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2 space-y-1">
                {validationErrors.slice(0, 5).map((error, index) => (
                  <li key={index} className="text-sm">{error.message}</li>
                ))}
                {validationErrors.length > 5 && (
                  <li className="text-sm">... e mais {validationErrors.length - 5} erro(s)</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progresso da Correção</span>
              <span className="text-sm text-gray-600">
                {totalErrors === 0 ? 'Pronto para aprovação' : `${totalErrors} erro(s) pendente(s)`}
              </span>
            </div>
            <Progress 
              value={totalErrors === 0 ? 100 : Math.max(0, 100 - (totalErrors * 10))} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações
              {(hasError('employeeName') || hasError('cycleId') || hasError('startDate') || hasError('endDate')) && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Gaps
              {pdiData.competencyGaps.some(g => g.hasError) && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ações 70-20-10
              {pdiData.actions.some(a => a.hasError) && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">!</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Resumo
            </TabsTrigger>
          </TabsList>

          {/* Tab: Informações Básicas */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#F39200]" />
                  Dados do Funcionário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(hasError('employeeName') && 'text-red-500')}>
                      Nome do Funcionário *
                    </Label>
                    <Input
                      value={pdiData.employeeName}
                      onChange={(e) => handleFieldChange('employeeName', e.target.value)}
                      className={cn(hasError('employeeName') && 'border-red-500 bg-red-50')}
                      placeholder="Nome completo"
                    />
                    {hasError('employeeName') && (
                      <p className="text-sm text-red-500">{getErrorMessage('employeeName')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Matrícula</Label>
                    <Input
                      value={pdiData.employeeCode}
                      onChange={(e) => handleFieldChange('employeeCode', e.target.value)}
                      placeholder="Código do funcionário"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cargo</Label>
                    <Input
                      value={pdiData.positionTitle}
                      onChange={(e) => handleFieldChange('positionTitle', e.target.value)}
                      placeholder="Cargo atual"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Departamento</Label>
                    <Input
                      value={pdiData.departmentName}
                      onChange={(e) => handleFieldChange('departmentName', e.target.value)}
                      placeholder="Departamento"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#F39200]" />
                  Período e Ciclo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className={cn(hasError('cycleId') && 'text-red-500')}>
                      Ciclo de Avaliação *
                    </Label>
                    <Select
                      value={pdiData.cycleId?.toString()}
                      onValueChange={(value) => handleFieldChange('cycleId', parseInt(value))}
                    >
                      <SelectTrigger className={cn(hasError('cycleId') && 'border-red-500 bg-red-50')}>
                        <SelectValue placeholder="Selecione o ciclo" />
                      </SelectTrigger>
                      <SelectContent>
                        {cycles?.map((cycle) => (
                          <SelectItem key={cycle.id} value={cycle.id.toString()}>
                            {cycle.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {hasError('cycleId') && (
                      <p className="text-sm text-red-500">{getErrorMessage('cycleId')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(hasError('startDate') && 'text-red-500')}>
                      Data de Início *
                    </Label>
                    <Input
                      type="date"
                      value={pdiData.startDate}
                      onChange={(e) => handleFieldChange('startDate', e.target.value)}
                      className={cn(hasError('startDate') && 'border-red-500 bg-red-50')}
                    />
                    {hasError('startDate') && (
                      <p className="text-sm text-red-500">{getErrorMessage('startDate')}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className={cn(hasError('endDate') && 'text-red-500')}>
                      Data de Término *
                    </Label>
                    <Input
                      type="date"
                      value={pdiData.endDate}
                      onChange={(e) => handleFieldChange('endDate', e.target.value)}
                      className={cn(hasError('endDate') && 'border-red-500 bg-red-50')}
                    />
                    {hasError('endDate') && (
                      <p className="text-sm text-red-500">{getErrorMessage('endDate')}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Contexto Estratégico</Label>
                  <Textarea
                    value={pdiData.strategicContext}
                    onChange={(e) => handleFieldChange('strategicContext', e.target.value)}
                    placeholder="Descreva o contexto estratégico e foco de desenvolvimento..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Gaps de Competências */}
          <TabsContent value="gaps" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#F39200]" />
                    Gaps de Competências
                  </CardTitle>
                  <CardDescription>
                    Identifique as competências que precisam ser desenvolvidas
                  </CardDescription>
                </div>
                <Button onClick={addGap} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Gap
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {pdiData.competencyGaps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Nenhum gap de competência cadastrado
                  </div>
                ) : (
                  pdiData.competencyGaps.map((gap, index) => (
                    <Card 
                      key={index} 
                      className={cn(
                        'border-l-4',
                        gap.hasError ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500'
                      )}
                    >
                      <CardContent className="pt-4">
                        {gap.hasError && (
                          <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{gap.errorMessage}</AlertDescription>
                          </Alert>
                        )}
                        <div className="grid grid-cols-5 gap-4 items-end">
                          <div className="col-span-2 space-y-2">
                            <Label className={cn(hasError(`gap_${index}_competencyName`) && 'text-red-500')}>
                              Competência *
                            </Label>
                            <Input
                              value={gap.competencyName}
                              onChange={(e) => handleGapChange(index, 'competencyName', e.target.value)}
                              className={cn(hasError(`gap_${index}_competencyName`) && 'border-red-500')}
                              placeholder="Nome da competência"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nível Atual (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={gap.currentLevel}
                              onChange={(e) => handleGapChange(index, 'currentLevel', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Nível Alvo (1-5)</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={gap.targetLevel}
                              onChange={(e) => handleGapChange(index, 'targetLevel', parseInt(e.target.value))}
                            />
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeGap(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Ações 70-20-10 */}
          <TabsContent value="actions" className="space-y-4">
            {/* 70% Prática */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-emerald-50">
                <div>
                  <CardTitle className="flex items-center gap-2 text-emerald-700">
                    <Briefcase className="w-5 h-5" />
                    70% - Aprendizado na Prática
                  </CardTitle>
                  <CardDescription>
                    Projetos, desafios e experiências práticas
                  </CardDescription>
                </div>
                <Button onClick={() => addAction('70_pratica')} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {actionsByCategory['70_pratica'].length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma ação de prática cadastrada
                  </div>
                ) : (
                  actionsByCategory['70_pratica'].map((action, idx) => {
                    const originalIndex = pdiData.actions.findIndex(a => a === action);
                    return (
                      <ActionCard
                        key={originalIndex}
                        action={action}
                        index={originalIndex}
                        onActionChange={handleActionChange}
                        onRemove={removeAction}
                        hasError={hasError}
                        getErrorMessage={getErrorMessage}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 20% Mentoria */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-blue-50">
                <div>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <User className="w-5 h-5" />
                    20% - Aprendizado Social
                  </CardTitle>
                  <CardDescription>
                    Mentoria, coaching e feedback
                  </CardDescription>
                </div>
                <Button onClick={() => addAction('20_mentoria')} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {actionsByCategory['20_mentoria'].length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma ação de mentoria cadastrada
                  </div>
                ) : (
                  actionsByCategory['20_mentoria'].map((action, idx) => {
                    const originalIndex = pdiData.actions.findIndex(a => a === action);
                    return (
                      <ActionCard
                        key={originalIndex}
                        action={action}
                        index={originalIndex}
                        onActionChange={handleActionChange}
                        onRemove={removeAction}
                        hasError={hasError}
                        getErrorMessage={getErrorMessage}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* 10% Educação Formal */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between bg-purple-50">
                <div>
                  <CardTitle className="flex items-center gap-2 text-purple-700">
                    <FileText className="w-5 h-5" />
                    10% - Educação Formal
                  </CardTitle>
                  <CardDescription>
                    Cursos, treinamentos e certificações
                  </CardDescription>
                </div>
                <Button onClick={() => addAction('10_curso')} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {actionsByCategory['10_curso'].length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    Nenhuma ação de educação formal cadastrada
                  </div>
                ) : (
                  actionsByCategory['10_curso'].map((action, idx) => {
                    const originalIndex = pdiData.actions.findIndex(a => a === action);
                    return (
                      <ActionCard
                        key={originalIndex}
                        action={action}
                        index={originalIndex}
                        onActionChange={handleActionChange}
                        onRemove={removeAction}
                        hasError={hasError}
                        getErrorMessage={getErrorMessage}
                      />
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Resumo */}
          <TabsContent value="summary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo do PDI</CardTitle>
                <CardDescription>
                  Visão geral do plano de desenvolvimento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Funcionário</h4>
                    <p className="text-gray-600">{pdiData.employeeName || '-'}</p>
                    <p className="text-sm text-gray-500">{pdiData.positionTitle} • {pdiData.departmentName}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Período</h4>
                    <p className="text-gray-600">
                      {pdiData.startDate && format(new Date(pdiData.startDate), 'dd/MM/yyyy', { locale: ptBR })} - {' '}
                      {pdiData.endDate && format(new Date(pdiData.endDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">{pdiData.durationMonths} meses</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-emerald-600">
                        {actionsByCategory['70_pratica'].length}
                      </div>
                      <p className="text-sm text-gray-500">Ações 70%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        {actionsByCategory['20_mentoria'].length}
                      </div>
                      <p className="text-sm text-gray-500">Ações 20%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {actionsByCategory['10_curso'].length}
                      </div>
                      <p className="text-sm text-gray-500">Ações 10%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {pdiData.competencyGaps.length}
                      </div>
                      <p className="text-sm text-gray-500">Gaps</p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Status de Validação</h4>
                  {totalErrors === 0 ? (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertTitle className="text-green-800">PDI Válido</AlertTitle>
                      <AlertDescription className="text-green-700">
                        Todos os campos obrigatórios foram preenchidos. O PDI está pronto para ser enviado para aprovação.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert variant="destructive">
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>PDI com Erros</AlertTitle>
                      <AlertDescription>
                        Existem {totalErrors} erro(s) que precisam ser corrigidos antes de enviar para aprovação.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving || !hasUnsavedChanges}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Rascunho
                </Button>
                <Button
                  onClick={() => setShowApprovalDialog(true)}
                  disabled={totalErrors > 0}
                  className="bg-[#F39200] hover:bg-[#d97f00]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar para Aprovação
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Confirmação de Envio para Aprovação */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar PDI para Aprovação</DialogTitle>
            <DialogDescription>
              O PDI será enviado para aprovação do Diretor de Gente, Administração e Inovação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Adicione observações para o aprovador..."
                rows={3}
              />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Após o envio, o PDI não poderá ser editado até que seja aprovado ou rejeitado.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitForApproval}
              disabled={submitForApprovalMutation.isPending}
              className="bg-[#F39200] hover:bg-[#d97f00]"
            >
              {submitForApprovalMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Action Card Component
function ActionCard({
  action,
  index,
  onActionChange,
  onRemove,
  hasError,
  getErrorMessage,
}: {
  action: PDIAction;
  index: number;
  onActionChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  hasError: (field: string) => boolean;
  getErrorMessage: (field: string) => string | undefined;
}) {
  return (
    <Card className={cn(
      'border-l-4',
      action.hasError ? 'border-l-red-500 bg-red-50' : 'border-l-gray-200'
    )}>
      <CardContent className="pt-4">
        {action.hasError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{action.errorMessage}</AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2 space-y-2">
            <Label className={cn(hasError(`action_${index}_title`) && 'text-red-500')}>
              Título *
            </Label>
            <Input
              value={action.title}
              onChange={(e) => onActionChange(index, 'title', e.target.value)}
              className={cn(hasError(`action_${index}_title`) && 'border-red-500')}
              placeholder="Título da ação"
            />
          </div>
          <div className="space-y-2">
            <Label>Data de Conclusão *</Label>
            <Input
              type="date"
              value={action.dueDate}
              onChange={(e) => onActionChange(index, 'dueDate', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Responsável</Label>
            <Input
              value={action.responsible}
              onChange={(e) => onActionChange(index, 'responsible', e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Label>Descrição</Label>
          <Textarea
            value={action.description}
            onChange={(e) => onActionChange(index, 'description', e.target.value)}
            placeholder="Descreva a ação em detalhes..."
            rows={2}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Remover
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
