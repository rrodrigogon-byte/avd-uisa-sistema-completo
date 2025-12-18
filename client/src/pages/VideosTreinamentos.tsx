import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlayCircle, Search, Clock, GraduationCap, Users, Target, Brain } from "lucide-react";

interface VideoTreinamento {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: "gestao" | "lideranca" | "tecnico" | "comportamental";
  level: "iniciante" | "intermediario" | "avancado";
  videoUrl: string;
}

const treinamentosVideos: VideoTreinamento[] = [
  {
    id: 1,
    title: "Fundamentos de Gestão de Pessoas",
    description: "Aprenda os conceitos básicos de gestão de equipes e desenvolvimento de talentos",
    duration: "25:00",
    category: "gestao",
    level: "iniciante",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 2,
    title: "Liderança Situacional",
    description: "Como adaptar seu estilo de liderança a diferentes situações e pessoas",
    duration: "30:15",
    category: "lideranca",
    level: "intermediario",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 3,
    title: "Feedback Eficaz",
    description: "Técnicas para dar e receber feedback de forma construtiva",
    duration: "18:30",
    category: "comportamental",
    level: "iniciante",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 4,
    title: "Gestão por Competências",
    description: "Como implementar e gerenciar um sistema de competências na organização",
    duration: "35:45",
    category: "gestao",
    level: "avancado",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 5,
    title: "Desenvolvimento de Equipes de Alto Desempenho",
    description: "Estratégias para construir e manter equipes de alta performance",
    duration: "28:20",
    category: "lideranca",
    level: "avancado",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  {
    id: 6,
    title: "Inteligência Emocional no Trabalho",
    description: "Como desenvolver e aplicar inteligência emocional no ambiente profissional",
    duration: "22:00",
    category: "comportamental",
    level: "intermediario",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
];

const categoryIcons = {
  gestao: Users,
  lideranca: Target,
  tecnico: GraduationCap,
  comportamental: Brain,
};

const categoryLabels = {
  gestao: "Gestão",
  lideranca: "Liderança",
  tecnico: "Técnico",
  comportamental: "Comportamental",
};

const levelLabels = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

const levelColors = {
  iniciante: "bg-green-500/10 text-green-700 dark:text-green-400",
  intermediario: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  avancado: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default function VideosTreinamentos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoTreinamento | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("todos");

  const filteredVideos = treinamentosVideos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "todos" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8" />
              Treinamentos
            </h1>
            <p className="text-muted-foreground mt-2">
              Desenvolva suas habilidades de gestão e liderança
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinamentos..."
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
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{categoryLabels[selectedVideo.category]}</Badge>
                    <Badge className={levelColors[selectedVideo.level]}>
                      {levelLabels[selectedVideo.level]}
                    </Badge>
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

        {/* Categories Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="gestao">Gestão</TabsTrigger>
            <TabsTrigger value="lideranca">Liderança</TabsTrigger>
            <TabsTrigger value="comportamental">Comportamental</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVideos.map((video) => {
                const Icon = categoryIcons[video.category];
                return (
                  <Card
                    key={video.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="text-xs">
                              {categoryLabels[video.category]}
                            </Badge>
                          </div>
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
                        <Badge className={levelColors[video.level]}>
                          {levelLabels[video.level]}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {video.duration}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredVideos.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhum treinamento encontrado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tente buscar com outros termos ou altere a categoria
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
