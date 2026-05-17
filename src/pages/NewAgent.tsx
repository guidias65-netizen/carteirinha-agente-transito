import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { Layout } from "@/components/Layout";
import { AgentForm } from "@/components/AgentForm";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewAgent() {
  const { addAgent } = useAgents();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <AgentForm
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
