import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Clock, Video, CheckCircle } from "lucide-react";

interface VideoAVD {
  id: number;
  step: number;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
}

const videosAVD: VideoAVD[] = [
  {
    id: 1,
    step: 1,
    title: "Passo 1: Dados Pessoais",
    description: "Como preencher corretamente os dados pessoais do colaborador",
    duration: "4:30",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 2,
    step: 2,
    title: "Passo 2: Teste PIR",
    description: "Entenda o Perfil Individual de Relacionamento e como aplicá-lo",
    duration: "12:00",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 3,
    step: 3,
    title: "Passo 3: Avaliação de Competências",
    description: "Como avaliar as competências técnicas e comportamentais",
    duration: "10:45",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 4,
    step: 4,
    title: "Passo 4: Avaliação de Desempenho",
    description: "Consolidação e análise dos resultados de desempenho",
    duration: "8:20",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 5,
    step: 5,
    title: "Passo 5: Plano de Desenvolvimento Individual (PDI)",
    description: "Criando um PDI eficaz baseado nos resultados da avaliação",
    duration: "15:30",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

export default function VideosProcessoAVD() {
  const [selectedVideo, setSelectedVideo] = useState<VideoAVD | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Video className="h-8 w-8" />
              Processo AVD - Vídeos Instrucionais
            </h1>
            <p className="text-muted-foreground mt-2">
              Guia completo dos 5 passos do processo de Avaliação de Desempenho
            </p>
          </div>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>Passo {selectedVideo.step}</Badge>
                  </div>
                  <CardTitle>{selectedVideo.title}</CardTitle>
                  <CardDescription>{selectedVideo.description}</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedVideo(null)}>
                  Fechar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  width="100%"
                  height="100%"
                  src={selectedVideo.videoUrl}
                  title={selectedVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps List */}
        <div className="space-y-4">
          {videosAVD.map((video, index) => (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedVideo(video)}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  {/* Step Number */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">{video.step}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{video.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {video.description}
                        </CardDescription>
                      </div>
                      <PlayCircle className="h-8 w-8 text-primary flex-shrink-0 ml-4" />
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {video.duration}
                      </div>
                      {index < 3 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Recomendado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Sobre o Processo AVD</CardTitle>
            <CardDescription>
              O processo de Avaliação de Desempenho é dividido em 5 passos sequenciais,
              cada um com objetivos específicos para garantir uma avaliação completa e justa
              do colaborador. Assista aos vídeos na ordem para melhor compreensão.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
