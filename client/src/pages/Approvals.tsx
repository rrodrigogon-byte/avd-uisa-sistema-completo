import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckSquare, Check, X } from "lucide-react";

export default function Approvals() {
  const { data: pending, isLoading: loadingPending } = trpc.approval.listPending.useQuery();
  const { data: requested, isLoading: loadingRequested } = trpc.approval.listRequested.useQuery();

  return (
    <DashboardLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <CheckSquare className="h-8 w-8" />
              Aprovações
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie aprovações pendentes e solicitadas
            </p>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pending">Pendentes</TabsTrigger>
            <TabsTrigger value="requested">Solicitadas</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {loadingPending ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : pending && pending.length > 0 ? (
              <div className="grid gap-4">
                {pending.map((approval) => (
                  <Card key={approval.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold">{approval.title}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge>{approval.itemType}</Badge>
                            <Badge variant={approval.priority === "urgente" ? "destructive" : "default"}>
                              {approval.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Check className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button size="sm" variant="destructive">
                            <X className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma aprovação pendente</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requested" className="mt-6">
            {loadingRequested ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : requested && requested.length > 0 ? (
              <div className="grid gap-4">
                {requested.map((approval) => (
                  <Card key={approval.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">{approval.title}</h3>
                          <Badge className="mt-2">{approval.itemType}</Badge>
                        </div>
                        <Badge variant={
                          approval.status === "aprovado" ? "outline" :
                          approval.status === "rejeitado" ? "destructive" : "default"
                        }>
                          {approval.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">Nenhuma solicitação</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
