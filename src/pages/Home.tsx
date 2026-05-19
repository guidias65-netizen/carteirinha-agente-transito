import { useState } from "react";
import { useAgents, type Agent } from "@/hooks/use-agents";
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
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Edit, Trash2, RefreshCw, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

export default function Home() {
  const { agents, deleteAgent, loading, error, refetch } = useAgents();
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const [fotoModal, setFotoModal] = useState<Agent | null>(null);
  const [processando, setProcessando] = useState(false);

  const filteredAgents = agents.filter(
    (a) =>
      a.nome.toLowerCase().includes(search.toLowerCase()) ||
      a.matricula.includes(search) ||
      a.funcional.includes(search),
  );

  const handleDelete = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja remover o agente ${nome}?`)) {
      try {
        await deleteAgent(id);
        toast({ title: "Agente removido", description: `${nome} foi removido do sistema.` });
      } catch {
        toast({ title: "Erro ao remover", description: "Não foi possível remover o agente. Tente novamente.", variant: "destructive" });
      }
    }
  };

  const handleAprovar = async () => {
    if (!fotoModal) return;
    setProcessando(true);
    try {
      await fetch(`${API_BASE}/agentes/${fotoModal.id}/foto-aprovar`, { method: "POST" });
      toast({ title: "Foto aprovada!", description: `Foto de ${fotoModal.nome} aprovada com sucesso.` });
      setFotoModal(null);
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível aprovar a foto.", variant: "destructive" });
    } finally {
      setProcessando(false);
    }
  };

  const handleRejeitar = async () => {
    if (!fotoModal) return;
    setProcessando(true);
    try {
      await fetch(`${API_BASE}/agentes/${fotoModal.id}/foto-rejeitar`, { method: "POST" });
      toast({ title: "Foto recusada", description: `Foto de ${fotoModal.nome} foi recusada.` });
      setFotoModal(null);
      refetch();
    } catch {
      toast({ title: "Erro", description: "Não foi possível recusar a foto.", variant: "destructive" });
    } finally {
      setProcessando(false);
    }
  };

  function FotoIndicador({ agent }: { agent: Agent }) {
    if (agent.fotoPendente) {
      return (
        <Button
          variant="ghost"
          size="sm"
          title="Foto aguardando aprovação — clique para revisar"
          className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50 relative"
          onClick={() => setFotoModal(agent)}
        >
          <Camera className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
        </Button>
      );
    }
    if (agent.foto) {
      return (
        <Button
          variant="ghost"
          size="sm"
          title="Foto aprovada"
          className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
          onClick={() => setFotoModal(agent)}
        >
          <Camera className="w-4 h-4" />
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        title="Sem foto"
        className="h-8 w-8 p-0 text-gray-300 cursor-default"
        disabled
      >
        <Camera className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Agentes Cadastrados
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os agentes de trânsito e emita suas funcionais.
          </p>
        </div>
        <Link href="/novo">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-medium">
            <Plus className="w-4 h-4 mr-2" />
            Novo Agente
          </Button>
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-sm border mb-6 p-4 flex items-center gap-3">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, matrícula ou funcional..."
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="ghost" size="icon" onClick={refetch} title="Atualizar lista">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          Erro ao carregar agentes: {error}
        </div>
      )}

      <div className="border rounded-md bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Funcional</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Carregando agentes...
                </TableCell>
              </TableRow>
            ) : filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Nenhum agente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium text-primary uppercase">
                    {agent.nome}
                  </TableCell>
                  <TableCell>{agent.matricula}</TableCell>
                  <TableCell>{agent.funcional}</TableCell>
                  <TableCell>{agent.cpf}</TableCell>
                  <TableCell>{agent.validade}</TableCell>
                  <TableCell>
                    <FotoIndicador agent={agent} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/agente/${agent.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 border-primary/20 hover:border-primary/50"
                        >
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

      {/* Modal de revisão de foto */}
      {fotoModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setFotoModal(null); }}
        >
          <div style={{
            background: "#ffffff", borderRadius: 12,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            width: "100%", maxWidth: 420, overflow: "hidden",
          }}>
            {/* Cabeçalho do modal */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 15, color: "#111827", margin: 0 }}>
                    Foto do Agente
                  </p>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: "2px 0 0" }}>
                    {fotoModal.nome}
                  </p>
                </div>
                <button
                  onClick={() => setFotoModal(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 20, lineHeight: 1, padding: 4 }}
                >
                  ×
                </button>
              </div>
              {fotoModal.fotoPendente && (
                <div style={{ marginTop: 10, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#92400e", fontWeight: 600 }}>
                  ⏳ Foto pendente — aguardando aprovação
                </div>
              )}
              {!fotoModal.fotoPendente && fotoModal.foto && (
                <div style={{ marginTop: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: "#166534", fontWeight: 600 }}>
                  ✓ Foto aprovada e em uso na funcional
                </div>
              )}
            </div>

            {/* Foto */}
            <div style={{ padding: "20px 24px" }}>
              {(fotoModal.fotoPendente || fotoModal.foto) ? (
                <img
                  src={fotoModal.fotoPendente || fotoModal.foto}
                  alt={`Foto de ${fotoModal.nome}`}
                  style={{
                    width: "100%", maxHeight: 320, objectFit: "contain",
                    borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb",
                  }}
                />
              ) : (
                <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: 14 }}>
                  Nenhuma foto disponível
                </div>
              )}
            </div>

            {/* Botões */}
            {fotoModal.fotoPendente && (
              <div style={{ padding: "0 24px 24px", display: "flex", gap: 10 }}>
                <button
                  onClick={handleRejeitar}
                  disabled={processando}
                  style={{
                    flex: 1, height: 44, borderRadius: 8, border: "1.5px solid #fecaca",
                    background: "#ffffff", color: "#b91c1c",
                    fontWeight: 700, fontSize: 14, cursor: processando ? "wait" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  Recusar
                </button>
                <button
                  onClick={handleAprovar}
                  disabled={processando}
                  style={{
                    flex: 1, height: 44, borderRadius: 8, border: "none",
                    background: processando ? "#d1fae5" : "#16a34a",
                    color: processando ? "#6b7280" : "#ffffff",
                    fontWeight: 700, fontSize: 14, cursor: processando ? "wait" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {processando ? "Processando..." : "Aprovar"}
                </button>
              </div>
            )}
            {!fotoModal.fotoPendente && (
              <div style={{ padding: "0 24px 24px" }}>
                <button
                  onClick={() => setFotoModal(null)}
                  style={{
                    width: "100%", height: 44, borderRadius: 8, border: "1.5px solid #e5e7eb",
                    background: "#ffffff", color: "#374151",
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
