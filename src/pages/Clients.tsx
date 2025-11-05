import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Mail, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";

interface Client {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar clientes");
      return;
    }

    setClients(data || []);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("clients")
        .insert([newClient]);

      if (error) throw error;

      toast.success("Cliente criado com sucesso!");
      setIsDialogOpen(false);
      setNewClient({ name: "", email: "" });
      loadClients();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir cliente");
      return;
    }

    toast.success("Cliente excluído com sucesso");
    loadClients();
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-primary">Clientes</h1>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleCreateClient}>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Cliente</DialogTitle>
                    <DialogDescription>
                      Adicione um novo cliente ao sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome</Label>
                      <Input
                        id="name"
                        value={newClient.name}
                        onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newClient.email}
                        onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? "Criando..." : "Criar Cliente"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Card key={client.id} className="shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate">{client.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClient(client.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(client.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {clients.length === 0 && (
            <Card className="shadow-[var(--shadow-card)]">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Nenhum cliente cadastrado ainda.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </AuthGuard>
  );
};

export default Clients;
