import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Batch {
  id: string;
  name: string;
  description: string;
  status: string;
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

const Approval = () => {
  const { uniqueLink } = useParams();
  const [mounted, setMounted] = useState(false);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Garantir que o componente está montado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        if (!uniqueLink) {
          console.warn('No uniqueLink parameter found');
          setLoading(false);
          return;
        }

        // Garantir que o Supabase está inicializado
        if (!supabase) {
          console.error('Supabase client not initialized');
          setLoading(false);
          return;
        }

        // Tentar carregar os dados
        await loadBatch();
      } catch (error) {
        console.error('Error in component initialization:', error);
        setLoading(false);
      }
    };

    // Iniciar carregamento imediatamente
    initializeComponent();
  }, [uniqueLink]);

  const loadBatch = async () => {
    try {
      console.log('Iniciando loadBatch');
      
      const { data: batchData, error: batchError } = await supabase
        .from("batches")
        .select("*, clients(name)")
        .eq("unique_link", uniqueLink)
        .single();

      console.log('Dados do batch:', batchData);
      console.log('Erro do batch:', batchError);

      if (batchError || !batchData) {
        toast.error("Lote não encontrado");
        setLoading(false);
        return;
      }

      setBatch(batchData);
      setIsCompleted(batchData.status === "completed");

      console.log('Buscando imagens para o batch:', batchData.id);
      
      const { data: imagesData, error: imagesError } = await supabase
        .from("images")
        .select("*")
        .eq("batch_id", batchData.id)
        .order("created_at");

      console.log('Dados das imagens:', imagesData);
      console.log('Erro das imagens:', imagesError);

      if (imagesError) {
        console.error('Erro ao carregar imagens:', imagesError);
        toast.error("Erro ao carregar imagens");
        setLoading(false);
        return;
      }

      console.log('Definindo estados finais');
      setImages(imagesData || []);
      setLoading(false);
    } catch (error) {
      console.error("Error loading batch:", error);
      toast.error("Erro ao carregar dados");
      setLoading(false);
    }
  };

  const updateImage = (id: string, field: string, value: string) => {
    setImages(images.map(img => 
      img.id === id ? { ...img, [field]: value } : img
    ));
  };

  const handleApprove = async (id: string) => {
    await updateImageStatus(id, "approved");
  };

  const handleReject = async (id: string) => {
    await updateImageStatus(id, "rejected");
  };

  const updateImageStatus = async (id: string, status: string) => {
    const image = images.find(img => img.id === id);
    
    const { error } = await supabase
      .from("images")
      .update({
        status,
        reference: image?.reference || null,
        observation: image?.observation || null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar imagem");
      return;
    }

    setImages(images.map(img => 
      img.id === id ? { ...img, status } : img
    ));

    toast.success(
      status === "approved" ? "Imagem aprovada!" : "Imagem reprovada"
    );
  };

  const handleFinalize = async () => {
    if (!batch) return;
    
    setLoading(true);

    try {
      // Update all images with their current data
      for (const image of images) {
        await supabase
          .from("images")
          .update({
            reference: image.reference || null,
            observation: image.observation || null,
          })
          .eq("id", image.id);
      }

      // Mark batch as completed
      const { error } = await supabase
        .from("batches")
        .update({ status: "completed" })
        .eq("id", batch.id);

      if (error) throw error;

      setIsCompleted(true);
      toast.success("Aprovação finalizada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao finalizar aprovação");
    } finally {
      setLoading(false);
    }
  };

  // Mostrar estado de loading
  if (!mounted || loading || !batch) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <p className="text-muted-foreground">
          Carregando...
        </p>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background">
        <Card className="mx-4 w-full max-w-md text-center shadow-md">
          <CardContent className="py-12">
            <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-[hsl(var(--success))]" />
            <h2 className="mb-2 text-2xl font-bold">Obrigado!</h2>
            <p className="text-muted-foreground">
              Seu feedback foi enviado com sucesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Renderizando componente', { batch, images, loading });

  return (
    <div className="min-h-[100dvh] w-full bg-background">
      <div className="min-h-full w-full">
        <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container px-4 py-6">
            <h1 className="text-2xl font-bold text-primary break-words">{batch?.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cliente: {batch?.clients?.name}
            </p>
            <p className="mt-4 text-sm">
              Aprove ou reprove as imagens abaixo e adicione observações se desejar.
            </p>
          </div>
        </header>

        <main className="relative w-full pb-24">
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <div className="space-y-8">
              {images.map((image, index) => (
              <Card
                key={image.id}
                className={`shadow-[var(--shadow-card)] transition-all ${
                  image.status === "approved"
                    ? "ring-2 ring-[hsl(var(--success))]"
                    : image.status === "rejected"
                    ? "ring-2 ring-destructive"
                    : ""
                }`}
              >
                <CardContent className="p-6">
                  <div className="mb-4 overflow-hidden rounded-lg">
                    <AspectRatio ratio={1}>
                      <img
                        src={image.image_url}
                        alt={`Imagem ${index + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </AspectRatio>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`reference-${image.id}`}>
                        Referência (opcional)
                      </Label>
                      <Input
                        id={`reference-${image.id}`}
                        value={image.reference || ""}
                        onChange={(e) => updateImage(image.id, "reference", e.target.value)}
                        placeholder="Ex: Imagem 01"
                        disabled={isCompleted}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`observation-${image.id}`}>
                        Observação (opcional)
                      </Label>
                      <Textarea
                        id={`observation-${image.id}`}
                        value={image.observation || ""}
                        onChange={(e) => updateImage(image.id, "observation", e.target.value)}
                        placeholder="Deixe seus comentários aqui..."
                        rows={3}
                        disabled={isCompleted}
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button
                        variant="success"
                        className="flex-1"
                        onClick={() => handleApprove(image.id)}
                        disabled={image.status === "approved" || isCompleted}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {image.status === "approved" ? "Aprovada" : "Aprovar"}
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(image.id)}
                        disabled={image.status === "rejected" || isCompleted}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {image.status === "rejected" ? "Reprovada" : "Reprovar"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

            </div>
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto max-w-3xl p-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleFinalize}
              disabled={loading || isCompleted}
            >
              {loading ? "Finalizando..." : "Finalizar Aprovação"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Approval;

