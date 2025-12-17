import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import * as faceapi from "face-api.js";
import { Camera, Loader2, LogIn, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FaceLoginProps {
  onSuccess?: (userId: number) => void;
  onCancel?: () => void;
}

export default function FaceLogin({ onSuccess, onCancel }: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const MODEL_URL = "/models";
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      await startCamera();
      setIsLoading(false);
      toast.success("Câmera iniciada. Posicione seu rosto.");
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("Erro ao carregar modelos");
      setIsLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
      }
    } catch (error) {
      console.error("Error starting camera:", error);
      toast.error("Erro ao acessar câmera");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const verifyFace = async () => {
    if (!videoRef.current || !modelsLoaded) {
      toast.error("Sistema não está pronto");
      return;
    }

    setIsVerifying(true);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("Nenhum rosto detectado");
        setIsVerifying(false);
        return;
      }

      // TODO: Call API to verify face descriptor against stored descriptors
      // For now, simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock: Simulate successful match
      const mockUserId = 1;
      const mockConfidence = 0.92; // 92% confidence

      if (mockConfidence >= 0.75) {
        toast.success("Reconhecimento facial bem-sucedido!");
        stopCamera();
        onSuccess?.(mockUserId);
      } else {
        toast.error("Rosto não reconhecido. Tente novamente.");
        setIsVerifying(false);
      }
    } catch (error) {
      console.error("Error verifying face:", error);
      toast.error("Erro ao verificar rosto");
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Login com Reconhecimento Facial
        </CardTitle>
        <CardDescription>
          Posicione seu rosto na câmera para fazer login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Camera Feed */}
        <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full"
          />

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Carregando...</p>
              </div>
            </div>
          )}

          {isVerifying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center text-white">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Verificando...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Posicione seu rosto centralizado e com boa iluminação
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
            disabled={isVerifying}
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={verifyFace}
            disabled={isLoading || isVerifying}
            className="flex-1"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Fazer Login
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
