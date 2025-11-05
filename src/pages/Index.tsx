import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Users, FolderKanban, Sparkles } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle2 className="h-16 w-16 text-primary" />
            </div>
          </div>
          
          <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
            Sistema de Aprovação de Imagens
          </h1>
          
          <p className="mb-8 text-xl text-muted-foreground">
            Gerencie aprovações de conteúdo visual de forma elegante e profissional
          </p>

          <div className="mb-12 flex flex-wrap justify-center gap-4">
            <Button size="lg" onClick={() => navigate("/login")}>
              Acessar Painel Admin
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")}>
              Saiba Mais
            </Button>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg bg-card p-6 shadow-[var(--shadow-card)]">
              <Users className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Gestão de Clientes</h3>
              <p className="text-sm text-muted-foreground">
                Organize e gerencie seus clientes de forma eficiente
              </p>
            </div>

            <div className="rounded-lg bg-card p-6 shadow-[var(--shadow-card)]">
              <FolderKanban className="mx-auto mb-4 h-12 w-12 text-accent" />
              <h3 className="mb-2 text-lg font-semibold">Lotes Inteligentes</h3>
              <p className="text-sm text-muted-foreground">
                Crie lotes de aprovação com links únicos e seguros
              </p>
            </div>

            <div className="rounded-lg bg-card p-6 shadow-[var(--shadow-card)]">
              <Sparkles className="mx-auto mb-4 h-12 w-12 text-[hsl(var(--success))]" />
              <h3 className="mb-2 text-lg font-semibold">Interface Elegante</h3>
              <p className="text-sm text-muted-foreground">
                Experiência otimizada para mobile e desktop
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
