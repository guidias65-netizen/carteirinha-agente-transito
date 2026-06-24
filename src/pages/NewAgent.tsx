import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { Layout } from "@/components/Layout";
import { AgentForm } from "@/components/AgentForm";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewAgent() {
  const { addAgent, agents, loading } = useAgents();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Calcula o próximo funcional só após os agentes carregarem do servidor
  const nextFuncional = (() => {
    if (loading) return "";
    const nums = agents
      .map((a) => parseInt(a.funcional.replace(/\D/g, ""), 10))
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    return String(max + 1).padStart(3, "0");
  })();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Carregando...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <AgentForm
          suggestedFuncional={nextFuncional}
          onSubmit={async (data) => {
            setSaving(true);
            try {
              const newAgent = await addAgent(data);
              toast({
                title: "Agente Cadastrado",
                description: "O registro foi salvo com sucesso.",
              });
              setLocation(`/agente/${newAgent.id}`);
            } catch (e) {
              toast({
                title: "Erro ao cadastrar",
                description: (e as Error).message ?? "Tente novamente.",
                variant: "destructive",
              });
            } finally {
              setSaving(false);
            }
          }}
          onCancel={() => setLocation("/")}
          saving={saving}
        />
      </div>
    </Layout>
  );
}
