import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface CycleData {
  name: string;
  description: string;
  year: number;
  type: "anual" | "semestral" | "trimestral";
  startDate: Date | undefined;
  endDate: Date | undefined;
  evaluationDeadline: Date | undefined;
}

interface CycleDataFormProps {
  data: CycleData;
  onChange: (data: CycleData) => void;
  onNext: () => void;
}

export default function CycleDataForm({ data, onChange, onNext }: CycleDataFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!data.name.trim()) {
      alert("O nome do ciclo é obrigatório");
      return;
    }
    
    if (!data.description.trim()) {
      alert("A descrição do ciclo é obrigatória");
      return;
    }
    
    if (!data.startDate) {
      alert("A data de início é obrigatória");
      return;
    }
    
    if (!data.endDate) {
      alert("A data de término é obrigatória");
      return;
    }
    
    if (data.endDate <= data.startDate) {
      alert("A data de término deve ser posterior à data de início");
      return;
    }
    
    // Validação opcional: se evaluationDeadline foi preenchido, deve ser posterior à data de término
    if (data.evaluationDeadline && data.evaluationDeadline <= data.endDate) {
      alert("A data limite de avaliação deve ser posterior à data de término");
      return;
    }
    
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nome do Ciclo *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Ex: Avaliação 360° - 1º Semestre 2025"
            className="mt-1.5"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="year">Ano *</Label>
            <Input
              id="year"
              type="number"
              value={data.year}
              onChange={(e) => onChange({ ...data, year: parseInt(e.target.value) || new Date().getFullYear() })}
              min={2020}
              max={2100}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              value={data.type}
              onChange={(e) => onChange({ ...data, type: e.target.value as "anual" | "semestral" | "trimestral" })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
            >
              <option value="anual">Anual</option>
              <option value="semestral">Semestral</option>
              <option value="trimestral">Trimestral</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Descrição *</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onChange({ ...data, description: e.target.value })}
            placeholder="Descreva os objetivos e escopo desta avaliação 360°"
            className="mt-1.5 min-h-[100px]"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Data de Início *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-1.5 justify-start text-left font-normal",
                    !data.startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.startDate ? (
                    format(data.startDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.startDate}
                  onSelect={(date) => onChange({ ...data, startDate: date })}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Data de Término *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-1.5 justify-start text-left font-normal",
                    !data.endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.endDate ? (
                    format(data.endDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.endDate}
                  onSelect={(date) => onChange({ ...data, endDate: date })}
                  locale={ptBR}
                  disabled={(date) => data.startDate ? date <= data.startDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Prazo para Avaliações (Opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-1.5 justify-start text-left font-normal",
                    !data.evaluationDeadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {data.evaluationDeadline ? (
                    format(data.evaluationDeadline, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione a data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={data.evaluationDeadline}
                  onSelect={(date) => onChange({ ...data, evaluationDeadline: date })}
                  locale={ptBR}
                  disabled={(date) => data.endDate ? date <= data.endDate : false}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="submit">
          Próximo: Configurar Pesos
        </Button>
      </div>
    </form>
  );
}
