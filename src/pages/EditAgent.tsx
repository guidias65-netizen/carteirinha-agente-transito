import { useAgents } from "@/hooks/use-agents";
import { Layout } from "@/components/Layout";
import { AgentForm } from "@/components/AgentForm";
import { CarteirinhaPreview } from "@/components/CarteirinhaPreview";
import { useLocation, useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function EditAgent() {
  const { id } = useParams<{ id: string }>();
  const { getAgent, updateAgent } = useAgents();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const agent = getAgent(id || "");

  if (!agent) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-destructive">Agente não encontrado</h2>
          <Button variant="link" onClick={() => setLocation("/")} className="mt-4">
            Voltar para a lista
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 -ml-4 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
        </div>

        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
            <TabsTrigger value="preview" className="text-sm font-medium">Pré-visualização e Emissão</TabsTrigger>
            <TabsTrigger value="edit" className="text-sm font-medium">Editar Dados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="py-4">
            <div className="bg-card border rounded-lg p-8 shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-primary mb-2">Emissão de Credencial</h2>
                <p className="text-muted-foreground">Verifique os dados antes de gerar o documento em PDF.</p>
              </div>
              
              <CarteirinhaPreview agent={agent} />
            </div>
          </TabsContent>
          
          <TabsContent value="edit">
            <AgentForm 
              initialData={agent}
              onSubmit={(data) => {
                updateAgent(agent.id, data);
                toast({
                  title: "Dados Atualizados",
                  description: "As informações do agente foram atualizadas.",
                });
                setLocation("/");
              }}
              onCancel={() => setLocation("/")}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
