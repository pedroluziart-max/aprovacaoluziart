import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, CheckCircle2, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";

interface Batch {
  id: string;
  name: string;
  description: string;
  unique_link: string;
  status: string;
  client_id: string;
  clients: {
    name: string;
  };
}

interface Image {
  id: string;
  image_url: string;
  reference: string;
  observation: string;
  status: string;
}

const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    if (id) {
      loadBatch();
      loadImages();
    }
  }, [id]);

  const loadBatch = async () => {
    const { data, error } = await supabase
      .from("batches")
      .select("*, clients(name)")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Erro ao carregar lote");
      return;
    }

    setBatch(data);
  };

  const loadImages = async () => {
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("batch_id", id)
      .order("created_at");

    if (error) {
      toast.error("Erro ao carregar imagens");
      return;
    }

    setImages(data || []);
  };

  const copyLink = () => {
    const link = `${window.location.origin}/approval/${batch?.unique_link}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="h-5 w-5 text-[hsl(var(--success))]" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-[hsl(var(--success))]">Aprovada</Badge>;
      case "rejected":
        return <Badge variant="destructive">Reprovada</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  if (!batch) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center gap-4 px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-primary">{batch.name}</h1>
              <p className="text-sm text-muted-foreground">
                Cliente: {batch.clients.name}
              </p>
            </div>
            <Badge variant={batch.status === "completed" ? "default" : "secondary"}>
              {batch.status === "completed" ? "Concluído" : "Em Andamento"}
            </Badge>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="mb-6 shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Link de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/approval/${batch.unique_link}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mb-4">
            <h2 className="text-xl font-semibold">
              Imagens ({images.length})
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <Card key={image.id} className="shadow-[var(--shadow-card)]">
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={image.image_url}
                      alt="Imagem do lote"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute right-2 top-2">
                      {getStatusIcon(image.status)}
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      {getStatusBadge(image.status)}
                    </div>
                    {image.reference && (
                      <div>
                        <span className="text-sm font-medium">Referência:</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {image.reference}
                        </p>
                      </div>
                    )}
                    {image.observation && (
                      <div>
                        <span className="text-sm font-medium">Observação:</span>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {image.observation}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
};

export default BatchDetail;
