import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayCircle, Search, Clock, BookOpen, Filter, Star } from "lucide-react";

interface VideoBiblioteca {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: string;
  tags: string[];
  rating: number;
  views: number;
  videoUrl: string;
  addedDate: string;
}

const bibliotecaVideos: VideoBiblioteca[] = [
  {
    id: 1,
    title: "Gestão de Conflitos em Equipes",
    description: "Técnicas práticas para identificar e resolver conflitos no ambiente de trabalho",
    duration: "20:30",
    category: "Gestão de Pessoas",
    tags: ["conflitos", "equipes", "comunicação"],
    rating: 4.8,
    views: 1250,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2025-01-15",
  },
  {
    id: 2,
    title: "Metodologias Ágeis para RH",
    description: "Como aplicar conceitos ágeis na gestão de recursos humanos",
    duration: "32:15",
    category: "Inovação",
    tags: ["agile", "metodologia", "inovação"],
    rating: 4.6,
    views: 980,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2025-01-10",
  },
  {
    id: 3,
    title: "Onboarding Digital Eficaz",
    description: "Melhores práticas para integração remota de novos colaboradores",
    duration: "18:45",
    category: "Recrutamento",
    tags: ["onboarding", "digital", "integração"],
    rating: 4.9,
    views: 1580,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2025-01-08",
  },
  {
    id: 4,
    title: "People Analytics na Prática",
    description: "Como usar dados para tomar decisões estratégicas em RH",
    duration: "28:00",
    category: "Analytics",
    tags: ["analytics", "dados", "estratégia"],
    rating: 4.7,
    views: 1120,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2025-01-05",
  },
  {
    id: 5,
    title: "Cultura Organizacional e Engajamento",
    description: "Construindo uma cultura forte e engajadora",
    duration: "25:30",
    category: "Cultura",
    tags: ["cultura", "engajamento", "valores"],
    rating: 4.8,
    views: 1340,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2025-01-03",
  },
  {
    id: 6,
    title: "Gestão de Mudanças Organizacionais",
    description: "Liderando processos de transformação com sucesso",
    duration: "30:20",
    category: "Gestão de Mudanças",
    tags: ["mudança", "transformação", "liderança"],
    rating: 4.5,
    views: 890,
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    addedDate: "2024-12-28",
  },
];

export default function VideosBiblioteca() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<VideoBiblioteca | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [sortBy, setSortBy] = useState<string>("recentes");

  const categories = ["todas", ...Array.from(new Set(bibliotecaVideos.map((v) => v.category)))];

  let filteredVideos = bibliotecaVideos.filter((video) => {
    const matchesSearch =
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      selectedCategory === "todas" || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Sort videos
  if (sortBy === "recentes") {
    filteredVideos = [...filteredVideos].sort(
      (a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
    );
  } else if (sortBy === "populares") {
    filteredVideos = [...filteredVideos].sort((a, b) => b.views - a.views);
  } else if (sortBy === "avaliacao") {
    filteredVideos = [...filteredVideos].sort((a, b) => b.rating - a.rating);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              Biblioteca de Vídeos
            </h1>
            <p className="text-muted-foreground mt-2">
              Acervo completo de conteúdos sobre gestão de pessoas e RH
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título, descrição ou tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat === "todas" ? "Todas as Categorias" : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recentes">Mais Recentes</SelectItem>
              <SelectItem value="populares">Mais Populares</SelectItem>
              <SelectItem value="avaliacao">Melhor Avaliados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Video Player */}
        {selectedVideo && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{selectedVideo.category}</Badge>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{selectedVideo.rating}</span>
                    </div>
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
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedVideo.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
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
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {video.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{video.rating}</span>
                      </div>
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
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {video.duration}
                  </div>
                  <span className="text-xs text-muted-foreground">{video.views} visualizações</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {video.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredVideos.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Nenhum vídeo encontrado</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente buscar com outros termos ou altere os filtros
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
