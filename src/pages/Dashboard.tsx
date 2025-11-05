import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, TrendingUp, Plus, LogOut } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    totalBatches: 0,
    completedBatches: 0,
    approvalRate: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const { data: clients } = await supabase.from("clients").select("id");
    const { data: batches } = await supabase.from("batches").select("id, status");
    const { data: images } = await supabase.from("images").select("status");

    const completedBatches = batches?.filter((b) => b.status === "completed").length || 0;
    const approvedImages = images?.filter((i) => i.status === "approved").length || 0;
    const totalImages = images?.length || 0;

    setStats({
      totalClients: clients?.length || 0,
      totalBatches: batches?.length || 0,
      completedBatches,
      approvalRate: totalImages > 0 ? Math.round((approvedImages / totalImages) * 100) : 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <h1 className="text-2xl font-bold text-primary">Aprovação de Imagens</h1>
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="mt-1 text-muted-foreground">
                Visão geral do sistema de aprovação
              </p>
            </div>
            <Button onClick={() => navigate("/batches/new")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Criar Novo Lote
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Clientes
                </CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalClients}</div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lotes Ativos
                </CardTitle>
                <FolderKanban className="h-5 w-5 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.totalBatches - stats.completedBatches}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Lotes Concluídos
                </CardTitle>
                <FolderKanban className="h-5 w-5 text-[hsl(var(--success))]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.completedBatches}</div>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Taxa de Aprovação
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-[hsl(var(--success))]" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.approvalRate}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/clients")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Clientes
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate("/batches/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Novo Lote
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle>Últimas Atualizações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sistema de aprovação de imagens operando normalmente.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default Dashboard;
