/**
 * Facial Capture Component
 * Componente para captura de foto facial usando webcam
 */

import { useRef, useState, useCallback } from "react";
import { Camera, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface FacialCaptureProps {
  onCapture: (photoDataUrl: string) => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function FacialCapture({ 
  onCapture, 
  onCancel,
  title = "Captura Facial",
  description = "Posicione seu rosto no centro da câmera"
}: FacialCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Iniciar câmera
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Erro ao acessar câmera:", err);
      setError("Não foi possível acessar a câmera. Verifique as permissões.");
    }
  }, []);

  // Parar câmera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraActive(false);
    }
  }, [stream]);

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) return;

    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para data URL
    const photoDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedPhoto(photoDataUrl);
    stopCamera();
  }, [stopCamera]);

  // Refazer captura
  const retakePhoto = useCallback(() => {
    setCapturedPhoto(null);
    startCamera();
  }, [startCamera]);

  // Confirmar e enviar foto
  const confirmPhoto = useCallback(() => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  }, [capturedPhoto, onCapture]);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instruções */}
        {!isCameraActive && !capturedPhoto && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Posicione seu rosto de frente para a câmera</li>
                  <li>Certifique-se de que há boa iluminação</li>
                  <li>Remova óculos escuros, chapéus ou máscaras</li>
                  <li>Mantenha uma expressão neutra</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Iniciar Câmera
            </Button>
          </div>
        )}

        {/* Visualização da câmera */}
        {isCameraActive && !capturedPhoto && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Guia de posicionamento facial */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-80 border-4 border-white/50 rounded-full" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1" size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Capturar Foto
              </Button>
              <Button onClick={stopCamera} variant="outline" size="lg">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Foto capturada */}
        {capturedPhoto && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <img
                src={capturedPhoto}
                alt="Foto capturada"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={confirmPhoto} className="flex-1" size="lg">
                <CheckCircle className="mr-2 h-5 w-5" />
                Confirmar Foto
              </Button>
              <Button onClick={retakePhoto} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-5 w-5" />
                Tirar Novamente
              </Button>
            </div>
          </div>
        )}

        {/* Canvas oculto para captura */}
        <canvas ref={canvasRef} className="hidden" />

        {onCancel && (
          <Button onClick={onCancel} variant="ghost" className="w-full">
            Cancelar Processo
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
