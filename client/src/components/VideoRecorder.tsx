import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, StopCircle, Play, Upload, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VideoRecorderProps {
  onVideoRecorded: (videoBlob: Blob) => void;
  maxDuration?: number; // em segundos
  disabled?: boolean;
}

export default function VideoRecorder({ 
  onVideoRecorded, 
  maxDuration = 300, // 5 minutos padrão
  disabled = false 
}: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      stopStream();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startRecording = async () => {
    try {
      // Solicitar permissão para câmera e microfone
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });

      setStream(mediaStream);

      // Configurar preview
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.muted = true; // Evitar feedback
        await videoRef.current.play();
      }

      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        
        // Mostrar preview do vídeo gravado
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(blob);
          videoRef.current.muted = false;
        }
        
        stopStream();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Capturar dados a cada 1 segundo
      setIsRecording(true);
      setRecordingTime(0);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Parar automaticamente ao atingir duração máxima
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

      toast.success("Gravação iniciada");
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      toast.error("Erro ao acessar câmera/microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      toast.success("Gravação finalizada");
    }
  };

  const handleUpload = () => {
    if (recordedBlob) {
      setIsUploading(true);
      onVideoRecorded(recordedBlob);
      // O componente pai deve chamar setIsUploading(false) após o upload
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
    if (videoRef.current) {
      videoRef.current.src = "";
      videoRef.current.srcObject = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="border-2 border-[#F39200]">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Preview/Playback do vídeo */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              controls={!!recordedBlob}
              playsInline
            />
            
            {/* Overlay de gravação */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="font-mono font-bold">{formatTime(recordingTime)}</span>
              </div>
            )}

            {/* Mensagem quando não há vídeo */}
            {!stream && !recordedBlob && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center text-gray-400">
                  <Video className="w-16 h-16 mx-auto mb-2" />
                  <p>Clique em "Iniciar Gravação" para começar</p>
                </div>
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Duração máxima: {formatTime(maxDuration)}</span>
            {recordedBlob && (
              <span className="text-green-600 font-medium">
                ✓ Vídeo gravado ({formatTime(recordingTime)})
              </span>
            )}
          </div>

          {/* Controles */}
          <div className="flex gap-3">
            {!isRecording && !recordedBlob && (
              <Button
                onClick={startRecording}
                disabled={disabled}
                className="flex-1 bg-[#F39200] hover:bg-[#d97f00]"
              >
                <Video className="w-4 h-4 mr-2" />
                Iniciar Gravação
              </Button>
            )}

            {isRecording && (
              <Button
                onClick={stopRecording}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Parar Gravação
              </Button>
            )}

            {recordedBlob && !isUploading && (
              <>
                <Button
                  onClick={resetRecording}
                  variant="outline"
                  className="flex-1"
                  disabled={disabled}
                >
                  Gravar Novamente
                </Button>
                <Button
                  onClick={handleUpload}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={disabled}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Confirmar Vídeo
                </Button>
              </>
            )}

            {isUploading && (
              <Button disabled className="flex-1">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando vídeo...
              </Button>
            )}
          </div>

          {/* Avisos */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Instruções para gravação:</p>
                <ul className="space-y-1 text-blue-800">
                  <li>• Posicione-se em um local bem iluminado</li>
                  <li>• Mantenha o rosto visível durante toda a gravação</li>
                  <li>• Fale claramente e responda às perguntas com calma</li>
                  <li>• Evite interrupções ou múltiplas pessoas na gravação</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
