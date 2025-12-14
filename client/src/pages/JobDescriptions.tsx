import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, FileText, Building } from "lucide-react";
import { toast } from "sonner";

export default function JobDescriptions() {
  const { user } = useAuth();
  const { data: jobDescriptions, isLoading } = trpc.jobDescription.list.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container max-w-7xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-64 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Descrições de Cargo UISA</h1>
            <p className="text-muted-foreground mt-2">Consulte e gerencie descrições de cargos da organização</p>
          </div>
          {user?.role === 'admin' && (
            <Button onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Descrição
            </Button>
          )}
        </div>

        {jobDescriptions && jobDescriptions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma descrição de cargo cadastrada</p>
              {user?.role === 'admin' && (
                <Button variant="outline" className="mt-4" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                  Criar primeira descrição
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobDescriptions?.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/job-descriptions/${job.id}`)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{job.title}</CardTitle>
                      <CardDescription className="mt-1">
                        <span className="font-mono text-xs">{job.code}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="default">v{job.version}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {job.department && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="w-4 h-4" />
                        <span>{job.department}</span>
                      </div>
                    )}
                    {job.level && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="w-4 h-4" />
                        <span>Nível: {job.level}</span>
                      </div>
                    )}
                    {job.summary && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{job.summary}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
