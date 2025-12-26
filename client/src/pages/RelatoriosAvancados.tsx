import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Download,
  Calendar as CalendarIcon,
  Filter,
  FileBarChart,
  FileSpreadsheet,
  FileDown,
  Clock,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Award,
  DollarSign,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  requiredFilters: string[];
}

const reportTemplates: ReportTemplate[] = [
  {
    id: "performance-geral",
    name: "Performance Geral",
    description: "Relatório consolidado de performance de todos os funcionários",
    icon: TrendingUp,
    category: "performance",
    requiredFilters: ["periodo"],
  },
  {
    id: "metas-status",
    name: "Status de Metas",
    description: "Acompanhamento de metas por departamento e funcionário",
    icon: Target,
    category: "metas",
    requiredFilters: ["periodo", "departamento"],
  },
  {
    id: "avaliacoes-360",
    name: "Avaliações 360°",
    description: "Resultados consolidados de avaliações 360°",
    icon: Award,
    category: "avaliacoes",
    requiredFilters: ["periodo", "ciclo"],
  },
  {
    id: "pdi-progresso",
    name: "Progresso de PDI",
    description: "Acompanhamento de Planos de Desenvolvimento Individual",
    icon: Sparkles,
    category: "desenvolvimento",
    requiredFilters: ["periodo"],
  },
  {
    id: "bonus-pagamentos",
    name: "Bônus e Pagamentos",
    description: "Relatório de bônus calculados e pagos",
    icon: DollarSign,
    category: "bonus",
    requiredFilters: ["periodo", "departamento"],
  },
  {
    id: "funcionarios-ativos",
    name: "Funcionários Ativos",
    description: "Lista detalhada de funcionários ativos com informações completas",
    icon: Users,
    category: "pessoas",
    requiredFilters: ["departamento"],
  },
  {
    id: "nine-box-distribuicao",
    name: "Distribuição Nine Box",
    description: "Análise da distribuição de talentos na matriz Nine Box",
    icon: FileBarChart,
    category: "sucessao",
    requiredFilters: ["periodo"],
  },
  {
    id: "compliance-avd",
    name: "Compliance AVD",
    description: "Relatório de conformidade do processo de avaliação",
    icon: CheckCircle,
    category: "compliance",
    requiredFilters: ["periodo", "ciclo"],
  },
];

export default function RelatoriosAvancados() {
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel" | "csv">("pdf");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");

  // Queries
  const { data: departments } = trpc.departments.list.useQuery(undefined);
  const { data: cycles } = trpc.evaluationCycles.list.useQuery(undefined);

  const handleGenerateReport = async () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template de relatório");
      return;
    }

    // Validar filtros obrigatórios
    if (selectedTemplate.requiredFilters.includes("periodo") && (!startDate || !endDate)) {
      toast.error("Selecione o período do relatório");
      return;
    }

    if (selectedTemplate.requiredFilters.includes("departamento") && !selectedDepartment) {
      toast.error("Selecione um departamento");
      return;
    }

    if (selectedTemplate.requiredFilters.includes("ciclo") && !selectedCycle) {
      toast.error("Selecione um ciclo de avaliação");
      return;
    }

    setIsGenerating(true);

    try {
      // Simular geração de relatório
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast.success(`Relatório "${selectedTemplate.name}" gerado com sucesso!`, {
        description: `Formato: ${exportFormat.toUpperCase()}`,
      });

      // Aqui você implementaria a lógica real de geração
      // const result = await generateReport({
      //   templateId: selectedTemplate.id,
      //   format: exportFormat,
      //   filters: {
      //     startDate,
      //     endDate,
      //     departmentId: selectedDepartment,
      //     cycleId: selectedCycle,
      //   },
      // });
    } catch (error) {
      toast.error("Erro ao gerar relatório");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScheduleReport = () => {
    if (!selectedTemplate) {
      toast.error("Selecione um template de relatório");
      return;
    }

    toast.success("Relatório agendado com sucesso!", {
      description: "Você receberá o relatório por e-mail conforme a programação",
    });
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      performance: "bg-blue-500",
      metas: "bg-green-500",
      avaliacoes: "bg-purple-500",
      desenvolvimento: "bg-yellow-500",
      bonus: "bg-orange-500",
      pessoas: "bg-cyan-500",
      sucessao: "bg-pink-500",
      compliance: "bg-indigo-500",
    };
    return colors[category] || "bg-gray-500";
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Avançados</h1>
          <p className="text-muted-foreground">
            Gere relatórios customizados com filtros avançados e agende envios automáticos
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="agendados">
            <Clock className="h-4 w-4 mr-2" />
            Agendados
          </TabsTrigger>
          <TabsTrigger value="historico">
            <FileBarChart className="h-4 w-4 mr-2" />
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Templates de Relatórios */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Templates de Relatórios</CardTitle>
                  <CardDescription>
                    Selecione um template e configure os filtros para gerar seu relatório
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportTemplates.map((template: any) => {
                        const Icon = template.icon;
                        const isSelected = selectedTemplate?.id === template.id;

                        return (
                          <Card
                            key={template.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected ? "ring-2 ring-primary" : ""
                            }`}
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg ${getCategoryBadgeColor(
                                      template.category
                                    )} bg-opacity-10`}
                                  >
                                    <Icon className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base">{template.name}</CardTitle>
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckCircle className="h-5 w-5 text-primary" />
                                )}
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-muted-foreground">
                                {template.description}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-1">
                                {template.requiredFilters.map((filter: any) => (
                                  <Badge key={filter} variant="secondary" className="text-xs">
                                    {filter}
                                  </Badge>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Painel de Configuração */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros
                  </CardTitle>
                  <CardDescription>
                    {selectedTemplate
                      ? `Configure os filtros para "${selectedTemplate.name}"`
                      : "Selecione um template para configurar"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedTemplate ? (
                    <>
                      {/* Período */}
                      {selectedTemplate.requiredFilters.includes("periodo") && (
                        <div className="space-y-2">
                          <Label>Período</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {startDate ? format(startDate, "dd/MM/yyyy") : "Início"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={startDate}
                                  onSelect={setStartDate}
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>

                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="justify-start text-left">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {endDate ? format(endDate, "dd/MM/yyyy") : "Fim"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={endDate}
                                  onSelect={setEndDate}
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      )}

                      {/* Departamento */}
                      {selectedTemplate.requiredFilters.includes("departamento") && (
                        <div className="space-y-2">
                          <Label>Departamento</Label>
                          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um departamento" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todos os departamentos</SelectItem>
                              {departments?.map((dept: any) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Ciclo */}
                      {selectedTemplate.requiredFilters.includes("ciclo") && (
                        <div className="space-y-2">
                          <Label>Ciclo de Avaliação</Label>
                          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ciclo" />
                            </SelectTrigger>
                            <SelectContent>
                              {cycles?.map((cycle: any) => (
                                <SelectItem key={cycle.id} value={cycle.id.toString()}>
                                  {cycle.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Separator />

                      {/* Formato de Exportação */}
                      <div className="space-y-2">
                        <Label>Formato de Exportação</Label>
                        <Select
                          value={exportFormat}
                          onValueChange={(value: any) => setExportFormat(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                PDF
                              </div>
                            </SelectItem>
                            <SelectItem value="excel">
                              <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Excel
                              </div>
                            </SelectItem>
                            <SelectItem value="csv">
                              <div className="flex items-center gap-2">
                                <FileDown className="h-4 w-4" />
                                CSV
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator />

                      {/* Ações */}
                      <div className="space-y-2">
                        <Button
                          className="w-full"
                          onClick={handleGenerateReport}
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Gerando...
                            </>
                          ) : (
                            <>
                              <Download className="mr-2 h-4 w-4" />
                              Gerar Relatório
                            </>
                          )}
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={handleScheduleReport}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Agendar Envio
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Selecione um template para configurar os filtros</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agendados">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Agendados</CardTitle>
              <CardDescription>
                Gerencie os relatórios programados para envio automático
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum relatório agendado</p>
                <p className="text-sm">
                  Agende relatórios para receber automaticamente por e-mail
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Relatórios</CardTitle>
              <CardDescription>
                Visualize e baixe relatórios gerados anteriormente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhum relatório gerado</p>
                <p className="text-sm">
                  Os relatórios gerados aparecerão aqui para download futuro
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
