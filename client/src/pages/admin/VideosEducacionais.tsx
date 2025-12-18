import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Video,
  Play,
  Database,
  CheckCircle2,
  Eye,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Página de gerenciamento de vídeos educacionais (Admin)
 * Permite popular banco com seed de 36 vídeos e visualizar estatísticas
 */
export default function VideosEducacionais() {
  const [seedDialogOpen, setSeedDialogOpen] = useState(false);

  // Queries
  const { data: categories, isLoading: loadingCategories } = trpc.educationalVideos.listCategories.useQuery();
  const { data: videosData, isLoading: loadingVideos, refetch } = trpc.educationalVideos.listVideos.useQuery({
    limit: 100
  });
  const { data: analytics } = trpc.educationalVideos.getVideoAnalytics.useQuery();

  // Mutation para seed
  const seedMutation = trpc.educationalVideos.seedVideos.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      setSeedDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao popular vídeos: ${error.message}`);
    },
  });

  const handleSeed = () => {
    seedMutation.mutate();
  };

  const videos = videosData?.videos || [];
  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
  const totalCompletions = videos.reduce((sum, v) => sum + (v.completionCount || 0), 0);
  const avgCompletionRate = totalViews > 0 ? Math.round((totalCompletions / totalViews) * 100) : 0;

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vídeos Educacionais</h1>
          <p className="text-muted-foreground">
            Gerencie a biblioteca de vídeos educacionais sobre ética, compliance e desenvolvimento profissional
          </p>
        </div>
        <Button
          onClick={() => setSeedDialogOpen(true)}
          size="lg"
          className="gap-2"
        >
          <Database className="h-5 w-5" />
          Popular Vídeos (Seed)
        </Button>
      </div>

      {/* Alert de informação */}
      {totalVideos === 0 && (
        <Alert>
          <Database className="h-4 w-4" />
          <AlertTitle>Banco de vídeos vazio</AlertTitle>
          <AlertDescription>
            Clique no botão "Popular Vídeos (Seed)" para adicionar 36 vídeos educacionais ao banco de dados.
            Os vídeos são organizados em categorias e relacionados às dimensões PIR para recomendações inteligentes.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vídeos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
            <p className="text-xs text-muted-foreground">
              {categories?.length || 0} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
            <p className="text-xs text-muted-foreground">
              Total de views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conclusões</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Vídeos concluídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categorias */}
      {categories && categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Categorias de Vídeos</CardTitle>
            <CardDescription>
              Organização dos vídeos por tema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const categoryVideos = videos.filter(v => v.categoryId === category.id);
                const categoryViews = categoryVideos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
                
                return (
                  <Card key={category.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{category.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {category.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span>{categoryVideos.length} vídeos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span>{categoryViews} views</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de vídeos */}
      {videos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca de Vídeos</CardTitle>
            <CardDescription>
              Todos os vídeos educacionais disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className="w-32 h-20 bg-muted rounded flex items-center justify-center">
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold">{video.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description}
                        </p>
                      </div>
                      {video.featured && (
                        <Badge variant="secondary" className="flex-shrink-0">
                          Destaque
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{Math.floor((video.duration || 0) / 60)} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{video.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{video.completionCount || 0} conclusões</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {video.difficultyLevel}
                      </Badge>
                    </div>

                    {/* Dimensões PIR relacionadas */}
                    {video.relatedPIRDimensions && (video.relatedPIRDimensions as string[]).length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Dimensões PIR:</span>
                        <div className="flex gap-1">
                          {(video.relatedPIRDimensions as string[]).map((dim) => (
                            <Badge key={dim} variant="secondary" className="text-xs">
                              {dim}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog de confirmação de seed */}
      <Dialog open={seedDialogOpen} onOpenChange={setSeedDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Popular Banco de Vídeos</DialogTitle>
            <DialogDescription>
              Esta ação irá adicionar 36 vídeos educacionais ao banco de dados, organizados em 6 categorias:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Ética Profissional (6 vídeos)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Compliance (6 vídeos)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Integridade (6 vídeos)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Prevenção à Corrupção (6 vídeos)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">LGPD e Privacidade (6 vídeos)</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm">Diversidade e Inclusão (6 vídeos)</span>
            </div>
          </div>

          <Alert>
            <Database className="h-4 w-4" />
            <AlertDescription>
              Vídeos duplicados serão automaticamente ignorados. Todos os vídeos são relacionados às dimensões PIR
              para permitir recomendações inteligentes baseadas no perfil de cada colaborador.
            </AlertDescription>
          </Alert>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSeedDialogOpen(false)}
              disabled={seedMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSeed}
              disabled={seedMutation.isPending}
              className="gap-2"
            >
              {seedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar e Popular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Loading states */}
      {(loadingCategories || loadingVideos) && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
