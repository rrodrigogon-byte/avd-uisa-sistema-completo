import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PlayCircle, Search, Clock, Video, BookOpen } from "lucide-react";

interface VideoTutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: string;
  videoUrl: string;
  thumbnail?: string;
}

const tutoriaisVideos: VideoTutorial[] = [
  {
    id: 1,
    title: "Introdução ao Sistema AVD UISA",
    description: "Conheça as principais funcionalidades do sistema de avaliação de desempenho",
    duration: "5:30",
    category: "Introdução",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 2,
    title: "Como Criar uma Avaliação",
    description: "Passo a passo para criar e configurar uma nova avaliação de desempenho",
    duration: "8:15",
    category: "Avaliações",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 3,
    title: "Gestão de Metas",
    description: "Aprenda a criar, acompanhar e avaliar metas individuais e corporativas",
    duration: "10:20",
    category: "Metas",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 4,
    title: "Criando um PDI",
    description: "Como elaborar um Plano de Desenvolvimento Individual eficaz",
    duration: "12:45",
    category: "PDI",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 5,
    title: "Análise de Competências",
    description: "Entenda como avaliar e desenvolver competências da equipe",
    duration: "9:30",
    category: "Competências",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 6,
    title: "Relatórios e Analytics",
    description: "Extraia insights valiosos dos dados de desempenho",
    duration: "11:00",
    category: "Relatórios",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

export default function VideosTutoriais() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);

  const filteredVideos = tutoriaisVideos.filter(
    (video) =>
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <PlayCircle className="h-8 w-8" />
              Tutoriais do Sistema
            </h1>
            <p className="text-muted-foreground mt-2">
              Aprenda a usar todas as funcionalidades do sistema AVD UISA
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tutoriais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
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

        {/* Videos Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVideos.map((video) => (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedVideo(video)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{video.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {video.description}
                    </CardDescription>
                  </div>
                  <PlayCircle className="h-8 w-8 text-primary flex-shrink-0 ml-2" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{video.category}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {video.duration}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum tutorial encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
