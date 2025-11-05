import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/AuthGuard";

interface Client {
  id: string;
  name: string;
  email: string;
}

const NewBatch = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [batchName, setBatchName] = useState("");
  const [batchDescription, setBatchDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    setClients(data || []);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const generateUniqueLink = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClient || !batchName || images.length === 0) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      // Create batch
      const uniqueLink = generateUniqueLink();
      const { data: batch, error: batchError } = await supabase
        .from("batches")
        .insert([{
          client_id: selectedClient,
          name: batchName,
          description: batchDescription,
          unique_link: uniqueLink,
          status: "pending",
        }])
        .select()
        .single();

      if (batchError) throw batchError;

      // Upload images
      for (const image of images) {
        const fileExt = image.name.split(".").pop();
        const fileName = `${batch.id}/${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("batch-images")
          .upload(fileName, image);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("batch-images")
          .getPublicUrl(fileName);

        await supabase.from("images").insert([{
          batch_id: batch.id,
          image_url: publicUrl,
          status: "pending",
        }]);
      }

      toast.success("Lote criado com sucesso!");
      navigate(`/batches/${batch.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar lote");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto flex items-center gap-4 px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Criar Novo Lote</h1>
          </div>
        </header>

        <main className="container mx-auto max-w-3xl px-4 py-8">
          <form onSubmit={handleSubmit}>
            <Card className="shadow-[var(--shadow-elegant)]">
              <CardHeader>
                <CardTitle>Informações do Lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente *</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Lote *</Label>
                  <Input
                    id="name"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Ex: Campanha Verão 2024"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={batchDescription}
                    onChange={(e) => setBatchDescription(e.target.value)}
                    placeholder="Adicione detalhes sobre este lote..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="images">Imagens *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("images")?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Imagens
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {images.length} {images.length === 1 ? "imagem" : "imagens"} selecionada(s)
                    </span>
                  </div>

                  {images.length > 0 && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      {images.map((image, index) => (
                        <div
                          key={index}
                          className="relative overflow-hidden rounded-lg border bg-card"
                        >
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="h-48 w-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute right-2 top-2"
                            onClick={() => removeImage(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard")}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Criando..." : "Criar Lote"}
              </Button>
            </div>
          </form>
        </main>
      </div>
    </AuthGuard>
  );
};

export default NewBatch;
