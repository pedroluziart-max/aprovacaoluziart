import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Eye, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

interface Batch {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
  clients: {
    name: string;
  };
  images: Array<{
    status: string;
  }>;
}

const Batches = () => {
  const navigate = useNavigate();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadBatches();
  }, []);

  const loadBatches = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select(`
        *,
        clients(name),
        images(status)
      `)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBatches(data);
    }
  };

  const getImageStats = (images: Array<{ status: string }>) => {
    const total = images.length;
    const approved = images.filter(img => img.status === "approved").length;
    const rejected = images.filter(img => img.status === "rejected").length;
    const pending = images.filter(img => img.status === "pending").length;

    return { total, approved, rejected, pending };
  };

  const filteredBatches = batches.filter((batch) => {
    const matchesSearch = 
      batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.clients.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      filterStatus === "all" || batch.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center gap-4 px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-primary">Todos os Lotes</h1>
              <p className="text-sm text-muted-foreground">
                Visualize e acompanhe todas as aprovações
              </p>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por lote ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                Todos
              </Button>
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Em Andamento
              </Button>
              <Button
                variant={filterStatus === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus("completed")}
              >
                Concluídos
              </Button>
            </div>
          </div>

          <div className="grid gap-6">
            {filteredBatches.map((batch) => {
              const stats = getImageStats(batch.images);
              const approvalRate = stats.total > 0 
                ? Math.round((stats.approved / stats.total) * 100)
                : 0;

              return (
                <Card key={batch.id} className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{batch.name}</CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Cliente: {batch.clients.name}
                        </p>
                        {batch.description && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {batch.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={batch.status === "completed" ? "default" : "secondary"}>
                        {batch.status === "completed" ? "Concluído" : "Em Andamento"}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <span className="font-semibold">{stats.total}</span>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-sm font-medium">Imagens</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--success)/0.1)]">
                            <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Aprovadas</p>
                            <p className="text-sm font-medium">{stats.approved}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                            <XCircle className="h-5 w-5 text-destructive" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Reprovadas</p>
                            <p className="text-sm font-medium">{stats.rejected}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Pendentes</p>
                            <p className="text-sm font-medium">{stats.pending}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Taxa de Aprovação:</span>
                          <Badge variant="outline" className="font-mono">
                            {approvalRate}%
                          </Badge>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/batches/${batch.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {filteredBatches.length === 0 && (
              <Card className="py-12 text-center">
                <CardContent>
                  <p className="text-muted-foreground">
                    {searchTerm || filterStatus !== "all" 
                      ? "Nenhum lote encontrado com os filtros aplicados."
                      : "Nenhum lote criado ainda."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Batches;
