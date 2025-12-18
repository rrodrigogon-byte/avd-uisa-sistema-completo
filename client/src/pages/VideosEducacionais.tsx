import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Video,
  Play,
  CheckCircle2,
  Clock,
  TrendingUp,
  Star,
  BookOpen,
  Target,
  Loader2,
  X,
  Award
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

/**
 * Página de vídeos educacionais para colaboradores
 * Permite assistir vídeos, marcar como concluídos e ver recomendações baseadas em PIR
 */
export default function VideosEducacionais() {
  const [selectedVideo, setSelectedVideo] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Queries
  const { data: categories } = trpc.educationalVideos.listCategories.useQuery();
  const { data: videosData, refetch: refetchVideos } = trpc.educationalVideos.listVideos.useQuery({
    categoryId: selectedCategory || undefined,
    limit: 100
  });
  const { data: recommendations } = trpc.educationalVideos.getRecommendations.useQuery({
    limit: 6
  });
  const { data: userStats } = trpc.educationalVideos.getUserStats.useQuery();

  // Mutations
  const startWatchingMutation = trpc.educationalVideos.startWatchSession.useMutation();
  const completeVideoMutation = trpc.educationalVideos.completeVideo.useMutation({
    onSuccess: () => {
      toast.success("Vídeo marcado como concluído!");
      refetchVideos();
      setSelectedVideo(null);
    },
    onError: (error) => {
      toast.error(`Erro ao marcar vídeo: ${error.message}`);
    },
  });

  const videos = videosData || [];

  const handleWatchVideo = async (video: any) => {
    setSelectedVideo(video);
    try {
      await startWatchingMutation.mutateAsync({
        videoId: video.id,
        startPosition: video.userProgress?.lastWatchPosition || 0
      });
    } catch (error) {
      console.error("Erro ao iniciar visualização:", error);
    }
  };

  const handleCompleteVideo = async () => {
    if (!selectedVideo) return;
    
    try {
      await completeVideoMutation.mutateAsync({
        videoId: selectedVideo.id,
        sessionId: 0 // Será atualizado pelo backend
      });
    } catch (error) {
      console.error("Erro ao completar vídeo:", error);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop();
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Vídeos Educacionais</h1>
        <p className="text-muted-foreground">
          Desenvolva suas competências com nossa biblioteca de vídeos sobre ética, compliance e desenvolvimento profissional
        </p>
      </div>

      {/* Estatísticas do usuário */}
      {userStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vídeos Assistidos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.watchedVideos}</div>
              <p className="text-xs text-muted-foreground">
                de {userStats.totalVideos} disponíveis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.completedVideos}</div>
              <p className="text-xs text-muted-foreground">
                {userStats.completionRate}% de conclusão
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.totalWatchTimeMinutes}</div>
              <p className="text-xs text-muted-foreground">
                minutos assistidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.completionRate}%</div>
              <Progress value={userStats.completionRate} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recomendações baseadas em PIR */}
      {recommendations && recommendations.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <CardTitle>Recomendados para Você</CardTitle>
            </div>
            <CardDescription>
              Vídeos selecionados com base no seu perfil PIR para fortalecer suas competências
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendations.map((video: any) => (
                <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleWatchVideo(video)}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                        <CardDescription className="text-xs mt-1 line-clamp-2">
                          {video.description}
                        </CardDescription>
                      </div>
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span>{Math.floor((video.duration || 0) / 60)} min</span>
                        <Badge variant="outline" className="text-xs ml-auto">
                          {video.difficultyLevel}
                        </Badge>
                      </div>
                      {video.reason && (
                        <div className="text-xs text-primary font-medium">
                          {video.reason}
                        </div>
                      )}
                      <Button size="sm" className="w-full gap-2">
                        <Play className="h-3 w-3" />
                        Assistir
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de categorias */}
      <Tabs value={selectedCategory?.toString() || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? null : parseInt(value))}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Todos</TabsTrigger>
          {categories?.map((category) => (
            <TabsTrigger key={category.id} value={category.id.toString()}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory?.toString() || "all"} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video: any) => (
              <Card key={video.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleWatchVideo(video)}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <CardTitle className="text-base line-clamp-2">{video.title}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {video.categoryName}
                      </CardDescription>
                    </div>
                    {video.userProgress?.completed && (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {video.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm mb-3">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{Math.floor((video.duration || 0) / 60)} min</span>
                    <Badge variant="outline" className="text-xs ml-auto">
                      {video.difficultyLevel}
                    </Badge>
                  </div>
                  {video.relatedPIRDimensions && (video.relatedPIRDimensions as string[]).length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {(video.relatedPIRDimensions as string[]).map((dim) => (
                        <Badge key={dim} variant="secondary" className="text-xs">
                          {dim}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <Button size="sm" className="w-full gap-2">
                    <Play className="h-3 w-3" />
                    {video.userProgress?.completed ? "Assistir novamente" : "Assistir"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {videos.length === 0 && (
            <div className="text-center py-12">
              <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum vídeo encontrado nesta categoria</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog do player de vídeo */}
      <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-xl">{selectedVideo?.title}</DialogTitle>
                <DialogDescription className="mt-1">
                  {selectedVideo?.categoryName} • {Math.floor((selectedVideo?.duration || 0) / 60)} minutos
                </DialogDescription>
              </div>
              {selectedVideo?.userProgress?.completed && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Concluído
                </Badge>
              )}
            </div>
          </DialogHeader>

          {selectedVideo && (
            <div className="space-y-4">
              {/* Player de vídeo */}
              <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(selectedVideo.videoUrl)}
                  title={selectedVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>

              {/* Descrição */}
              <div>
                <h3 className="font-semibold mb-2">Sobre este vídeo</h3>
                <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
              </div>

              {/* Dimensões PIR */}
              {selectedVideo.relatedPIRDimensions && (selectedVideo.relatedPIRDimensions as string[]).length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Dimensões PIR relacionadas</h3>
                  <div className="flex gap-2 flex-wrap">
                    {(selectedVideo.relatedPIRDimensions as string[]).map((dim) => (
                      <Badge key={dim} variant="secondary">
                        {dim}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Botão de marcar como concluído */}
              {!selectedVideo.userProgress?.completed && (
                <Button
                  onClick={handleCompleteVideo}
                  disabled={completeVideoMutation.isPending}
                  className="w-full gap-2"
                  size="lg"
                >
                  {completeVideoMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Marcar como Concluído
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
