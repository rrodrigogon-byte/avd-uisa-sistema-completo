import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';

interface VideoPlayerProps {
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number; // duração em segundos
  requiresFullWatch?: boolean;
  onWatchComplete?: () => void;
  minWatchPercentage?: number; // % mínimo que precisa assistir (padrão 90%)
}

export function VideoPlayer({
  videoUrl,
  thumbnailUrl,
  duration,
  requiresFullWatch = false,
  onWatchComplete,
  minWatchPercentage = 90
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [hasCompletedWatch, setHasCompletedWatch] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Converter URL do YouTube para embed
  const getEmbedUrl = (url: string) => {
    // Extrair ID do vídeo do YouTube
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(youtubeRegex);
    
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?enablejsapi=1&rel=0`;
    }
    
    return url; // Retornar URL original se não for YouTube
  };

  const embedUrl = getEmbedUrl(videoUrl);
  const isYouTube = embedUrl.includes('youtube.com/embed');

  // Atualizar progresso do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const total = video.duration || duration;
      const percentage = (current / total) * 100;

      setCurrentTime(current);
      
      // Atualizar máximo assistido
      if (percentage > watchedPercentage) {
        setWatchedPercentage(percentage);
      }

      // Verificar se completou o mínimo necessário
      if (percentage >= minWatchPercentage && !hasCompletedWatch) {
        setHasCompletedWatch(true);
        onWatchComplete?.();
      }
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [duration, minWatchPercentage, watchedPercentage, hasCompletedWatch, onWatchComplete, isYouTube]);

  // Para vídeos do YouTube, usar postMessage API
  useEffect(() => {
    if (!isYouTube) return;

    let checkInterval: NodeJS.Timeout;
    let simulatedProgress = 0;

    // Simular progresso para YouTube (não temos acesso direto ao player)
    checkInterval = setInterval(() => {
      if (isPlaying && simulatedProgress < 100) {
        simulatedProgress += (100 / duration) * 0.5; // Atualizar a cada 0.5s
        setWatchedPercentage(Math.min(simulatedProgress, 100));
        setCurrentTime((simulatedProgress / 100) * duration);

        if (simulatedProgress >= minWatchPercentage && !hasCompletedWatch) {
          setHasCompletedWatch(true);
          onWatchComplete?.();
        }
      }
    }, 500);

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [isYouTube, isPlaying, duration, minWatchPercentage, hasCompletedWatch, onWatchComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video || isYouTube) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video bg-black">
        {isYouTube ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full"
            poster={thumbnailUrl}
            preload="metadata"
          >
            <source src={videoUrl} type="video/mp4" />
            Seu navegador não suporta a reprodução de vídeos.
          </video>
        )}

        {/* Controles customizados (apenas para vídeos não-YouTube) */}
        {!isYouTube && !isLoading && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-white text-sm font-mono">
                  {formatTime(currentTime)}
                </span>
                <div className="flex-1">
                  <Progress value={watchedPercentage} className="h-2" />
                </div>
                <span className="text-white text-sm font-mono">
                  {formatTime(duration)}
                </span>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleFullscreen}
              >
                <Maximize className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Indicador de progresso */}
      {requiresFullWatch && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progresso do vídeo
            </span>
            <span className={`text-sm font-bold ${hasCompletedWatch ? 'text-green-600' : 'text-muted-foreground'}`}>
              {Math.round(watchedPercentage)}%
            </span>
          </div>
          <Progress value={watchedPercentage} className="h-2" />
          
          {!hasCompletedWatch && (
            <p className="text-sm text-muted-foreground mt-2">
              Assista pelo menos {minWatchPercentage}% do vídeo para poder responder a questão
            </p>
          )}
          
          {hasCompletedWatch && (
            <p className="text-sm text-green-600 font-medium mt-2">
              ✓ Vídeo assistido! Você já pode responder a questão
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
