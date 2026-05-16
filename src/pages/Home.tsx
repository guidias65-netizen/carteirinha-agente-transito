import { useState } from "react";
import { useAgents } from "@/hooks/use-agents";
import { Layout } from "@/components/Layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { agents, deleteAgent } = useAgents();
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filteredAgents = agents.filter(a => 
    a.nome.toLowerCase().includes(search.toLowerCase()) || 
    a.matricula.includes(search) ||
    a.funcional.includes(search)
  );

  const handleDelete = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o agente ${nome}?`)) {
      deleteAgent(id);
      toast({
        title: "Agente removido",
        description: `${nome} foi removido do sistema.`,
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Agentes Cadastrados</h1>
          <p className="text-muted-foreground mt-1">Gerencie os agentes de trânsito e emita suas carteirinhas funcionais.</p>
        </div>
        <Link href="/novo">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agente
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm border mb-6 p-4 flex items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, matrícula ou funcional..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Funcional</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  Nenhum agente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map(agent => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium text-primary uppercase">{agent.nome}</TableCell>
                  <TableCell>{agent.matricula}</TableCell>
                  <TableCell>{agent.funcional}</TableCell>
                  <TableCell>{agent.cpf}</TableCell>
                  <TableCell>{agent.validade}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/agente/${agent.id}`}>
                        <Button variant="outline" size="sm" className="h-8 border-primary/20 hover:border-primary/50">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Editar & Emitir
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(agent.id, agent.nome)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}
