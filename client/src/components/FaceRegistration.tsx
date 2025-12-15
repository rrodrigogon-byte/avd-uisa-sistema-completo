import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import * as faceapi from "face-api.js";
import { Camera, CheckCircle2, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface FaceRegistrationProps {
  onComplete?: (descriptors: Float32Array[]) => void;
  onCancel?: () => void;
}

export default function FaceRegistration({ onComplete, onCancel }: FaceRegistrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedFaces, setCapturedFaces] = useState<Float32Array[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  const REQUIRED_PHOTOS = 5;
  const progressPercentage = (capturedFaces.length / REQUIRED_PHOTOS) * 100;

  useEffect(() => {
    loadModels();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      const MODEL_URL = "/models"; // Models should be in public/models folder
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);

      setModelsLoaded(true);
      await startCamera();
      setIsLoading(false);
      toast.success("Câmera iniciada com sucesso!");
    } catch (error) {
      console.error("Error loading models:", error);
      toast.error("Erro ao carregar modelos de reconhecimento facial");
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
      toast.error("Erro ao acessar câmera. Verifique as permissões.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const captureFace = async () => {
    if (!videoRef.current || !canvasRef.current || !modelsLoaded) {
      toast.error("Sistema não está pronto");
      return;
    }

    setIsCapturing(true);

    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("Nenhum rosto detectado. Posicione seu rosto na câmera.");
        setIsCapturing(false);
        return;
      }

      // Draw detection on canvas
      const canvas = canvasRef.current;
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetection);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
      }

      // Save descriptor
      setCapturedFaces((prev) => [...prev, detection.descriptor]);
      toast.success(`Foto ${capturedFaces.length + 1}/${REQUIRED_PHOTOS} capturada!`);

      // Check if we have enough photos
      if (capturedFaces.length + 1 >= REQUIRED_PHOTOS) {
        toast.success("Cadastro facial completo!");
        setTimeout(() => {
          onComplete?.([...capturedFaces, detection.descriptor]);
          stopCamera();
        }, 1000);
      }
    } catch (error) {
      console.error("Error capturing face:", error);
      toast.error("Erro ao capturar rosto");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Cadastro de Reconhecimento Facial
        </CardTitle>
        <CardDescription>
          Capture {REQUIRED_PHOTOS} fotos do seu rosto em diferentes ângulos para melhor precisão
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progresso</span>
            <span className="text-muted-foreground">
              {capturedFaces.length}/{REQUIRED_PHOTOS} fotos
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

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
                <p>Carregando modelos...</p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
          <p className="text-sm font-medium">📸 Instruções:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>Posicione seu rosto centralizado na câmera</li>
            <li>Mantenha boa iluminação no ambiente</li>
            <li>Tire fotos em diferentes ângulos (frente, esquerda, direita)</li>
            <li>Mantenha expressão neutra</li>
            <li>Evite usar óculos escuros ou chapéus</li>
          </ul>
        </div>

        {/* Captured Photos */}
        {capturedFaces.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Fotos Capturadas:</p>
            <div className="flex gap-2">
              {Array.from({ length: REQUIRED_PHOTOS }).map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    index < capturedFaces.length
                      ? "bg-green-100 border-green-500 dark:bg-green-950"
                      : "bg-muted border-muted-foreground/20"
                  }`}
                >
                  {index < capturedFaces.length ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <span className="text-sm text-muted-foreground">{index + 1}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={captureFace}
            disabled={isLoading || isCapturing || capturedFaces.length >= REQUIRED_PHOTOS}
            className="flex-1"
          >
            {isCapturing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Capturando...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Capturar Foto
              </>
            )}
          </Button>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-muted-foreground">
            ⚠️ <strong>Privacidade:</strong> Seus dados faciais são criptografados e armazenados com segurança. 
            Você pode removê-los a qualquer momento nas configurações da conta.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
