import { useAgents } from "@/hooks/use-agents";
import { Layout } from "@/components/Layout";
import { AgentForm } from "@/components/AgentForm";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function NewAgent() {
  const { addAgent } = useAgents();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <AgentForm 
          onSubmit={(data) => {
            const newAgent = addAgent(data);
            toast({
              title: "Agente Cadastrado",
              description: "O registro foi salvo com sucesso.",
            });
            setLocation(`/agente/${newAgent.id}`);
          }}
          onCancel={() => setLocation("/")}
        />
      </div>
    </Layout>
  );
}
