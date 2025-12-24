/**
 * Face Registration Page
 * Página para cadastro de reconhecimento facial de funcionários
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FacialCapture } from "@/components/FacialCapture";
import { trpc } from "@/lib/trpc";
import { safeMap, safeFilter, safeFind, safeReduce, safeLength, ensureArray, isEmpty } from "@/lib/arrayHelpers";
import { storagePut } from "../../../server/storage";

export default function FaceRegistration() {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<"select" | "capture" | "upload" | "validate" | "complete">("select");
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Queries e mutations
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery({
    status: "ativo",
    limit: 1000,
  });

  const registerFaceMutation = trpc.faceRecognitionAdvanced.registerFace.useMutation();

  // Selecionar funcionário
  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    setStep("capture");
  };

  // Capturar foto
  const handlePhotoCapture = async (photoDataUrl: string) => {
    setCapturedPhoto(photoDataUrl);
    setStep("upload");
    
    try {
      setUploadProgress(10);
      
      // Converter data URL para blob
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      
      setUploadProgress(30);
      
      // Upload para S3
      const fileName = `face-${selectedEmployee.id}-${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      
      // Aqui você precisaria implementar o upload para S3
      // Por enquanto, vamos simular
      const photoUrl = photoDataUrl; // Temporário
      
      setUploadProgress(60);
      setStep("validate");
      
      // Registrar face no backend
      const result = await registerFaceMutation.mutateAsync({
        employeeId: selectedEmployee.id,
        photoUrl: photoUrl,
      });
      
      setUploadProgress(100);
      setValidationResult(result);
      setStep("complete");
      
    } catch (err: any) {
      console.error("Erro ao processar foto:", err);
      setError(err.message || "Erro ao processar foto facial");
      setStep("capture");
    }
  };

  // Cancelar processo
  const handleCancel = () => {
    setStep("select");
    setSelectedEmployee(null);
    setCapturedPhoto(null);
    setError(null);
    setValidationResult(null);
  };

  // Cadastrar outro funcionário
  const handleRegisterAnother = () => {
    handleCancel();
  };

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cadastro de Reconhecimento Facial</h1>
        <p className="text-muted-foreground mt-2">
          Registre a biometria facial dos funcionários para validação de identidade durante avaliações PIR
        </p>
      </div>

      {/* Seleção de Funcionário */}
      {step === "select" && (
        <Card>
          <CardHeader>
            <CardTitle>Selecione o Funcionário</CardTitle>
            <CardDescription>
              Escolha o funcionário para cadastrar o reconhecimento facial
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {employees?.map((employee: any) => (
                  <Button
                    key={employee.id}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleSelectEmployee(employee)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{employee.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.chapa} - {employee.cargo || "Sem cargo"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Captura Facial */}
      {step === "capture" && selectedEmployee && (
        <div className="space-y-4">
          <Alert>
            <AlertTitle>Funcionário Selecionado</AlertTitle>
            <AlertDescription>
              <strong>{selectedEmployee.name}</strong> - {selectedEmployee.chapa}
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <FacialCapture
            onCapture={handlePhotoCapture}
            onCancel={handleCancel}
            title="Captura Facial"
            description={`Capture a foto facial de ${selectedEmployee.name}`}
          />
        </div>
      )}

      {/* Upload e Validação */}
      {(step === "upload" || step === "validate") && (
        <Card>
          <CardHeader>
            <CardTitle>
              {step === "upload" ? "Enviando Foto..." : "Validando Qualidade..."}
            </CardTitle>
            <CardDescription>
              Processando reconhecimento facial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={uploadProgress} />
            
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>

            <p className="text-center text-sm text-muted-foreground">
              {step === "upload" && "Enviando foto para o servidor..."}
              {step === "validate" && "Validando qualidade da foto facial..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Conclusão */}
      {step === "complete" && validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
              Cadastro Concluído com Sucesso!
            </CardTitle>
            <CardDescription>
              O reconhecimento facial foi cadastrado para {selectedEmployee?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Resultado da Validação */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Qualidade da Foto</p>
                <div className="flex items-center gap-2">
                  <Progress value={validationResult.quality?.score || 0} className="flex-1" />
                  <span className="text-sm font-bold">{validationResult.quality?.score || 0}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">Status</p>
                <p className="text-lg font-bold text-green-600">
                  {validationResult.quality?.quality || "Boa"}
                </p>
              </div>
            </div>

            {/* Recomendações */}
            {validationResult.quality?.recommendations?.length > 0 && (
              <Alert>
                <AlertTitle>Recomendações</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {validationResult.quality.recommendations.map((rec: string, idx: number) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Ações */}
            <div className="flex gap-2">
              <Button onClick={handleRegisterAnother} className="flex-1">
                Cadastrar Outro Funcionário
              </Button>
              <Button onClick={() => navigate("/employees")} variant="outline">
                Voltar para Funcionários
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
