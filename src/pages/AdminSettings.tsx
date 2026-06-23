import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, KeyRound, ShieldCheck, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

interface AdminUser {
  id: string;
  login: string;
  nome: string;
  nivel: string;
  criado_em: string;
}

const NIVEIS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrador",
  operador: "Operador",
};

export default function AdminSettings() {
  const { token, nivel, userName } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const [usuarios, setUsuarios] = useState<AdminUser[]>([]);
  const [carregandoUsers, setCarregandoUsers] = useState(false);
  const [novoLogin, setNovoLogin] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoNivel, setNovoNivel] = useState("admin");
  const [novaSenhaUser, setNovaSenhaUser] = useState("");
  const [criandoUser, setCriandoUser] = useState(false);
  const [showNovoForm, setShowNovoForm] = useState(false);

  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  // Parseia JSON com segurança — evita quebrar se o servidor retornar HTML (ex: 404 do dev)
  const safeJson = async (res: Response): Promise<Record<string, string>> => {
    try { return await res.json(); } catch { return {}; }
  };

  const devMsg = "Disponível apenas no servidor de produção (funcional.semob.com.br).";

  const carregarUsuarios = async () => {
    if (nivel !== "super_admin") return;
    setCarregandoUsers(true);
    try {
      const res = await fetch(`${API_BASE}/auth/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await safeJson(res);
        if (Array.isArray(data)) setUsuarios(data as unknown as AdminUser[]);
      }
    } finally {
      setCarregandoUsers(false);
    }
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      toast({ title: "Erro", description: "As senhas não conferem.", variant: "destructive" });
      return;
    }
    if (novaSenha.length < 6) {
      toast({ title: "Erro", description: "Nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setSalvandoSenha(true);
    try {
      const res = await fetch(`${API_BASE}/auth/alterar-senha`, {
        method: "POST", headers: authHeader,
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });
      if (res.ok) {
        toast({ title: "Senha alterada!", description: "Sua senha foi atualizada com sucesso." });
        setSenhaAtual(""); setNovaSenha(""); setConfirmarSenha("");
      } else {
        const d = await safeJson(res);
        toast({ title: "Erro", description: d.error || devMsg, variant: "destructive" });
      }
    } finally {
      setSalvandoSenha(false);
    }
  };

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriandoUser(true);
    try {
      const res = await fetch(`${API_BASE}/auth/usuarios`, {
        method: "POST", headers: authHeader,
        body: JSON.stringify({ login: novoLogin, senha: novaSenhaUser, nome: novoNome, nivel: novoNivel }),
      });
      if (res.ok) {
        toast({ title: "Usuário criado!", description: `${novoLogin} criado com sucesso.` });
        setNovoLogin(""); setNovoNome(""); setNovaSenhaUser(""); setNovoNivel("admin");
        setShowNovoForm(false);
        carregarUsuarios();
      } else {
        const d = await safeJson(res);
        toast({ title: "Erro", description: d.error || devMsg, variant: "destructive" });
      }
    } finally {
      setCriandoUser(false);
    }
  };

  const handleExcluirUsuario = async (user: AdminUser) => {
    if (!confirm(`Deseja excluir o usuário "${user.login}"?`)) return;
    const res = await fetch(`${API_BASE}/auth/usuarios/${user.id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok || res.status === 204) {
      toast({ title: "Usuário excluído." });
      carregarUsuarios();
    } else {
      const d = await safeJson(res);
      toast({ title: "Erro", description: d.error || devMsg, variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setLocation("/")} className="gap-2 -ml-4 text-muted-foreground hover:text-primary">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-primary mb-1">Configurações de Acesso</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Usuário: <strong>{userName}</strong> · Nível:{" "}
          <strong>{NIVEIS[nivel] || nivel}</strong>
        </p>

        <Tabs defaultValue="senha">
          <TabsList className={`grid w-full mb-8 h-12 ${nivel === "super_admin" ? "grid-cols-2" : "grid-cols-1"}`}>
            <TabsTrigger value="senha" className="gap-2 text-sm">
              <KeyRound className="w-4 h-4" /> Alterar Senha
            </TabsTrigger>
            {nivel === "super_admin" && (
              <TabsTrigger value="usuarios" className="gap-2 text-sm">
                <Users className="w-4 h-4" /> Usuários
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="senha">
            <div className="bg-card border rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold mb-6 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" /> Alterar minha senha
              </h2>
              <form onSubmit={handleAlterarSenha} className="space-y-4">
                <div>
                  <Label>Senha atual</Label>
                  <Input type="password" value={senhaAtual} onChange={(e) => setSenhaAtual(e.target.value)} required className="mt-1" />
                </div>
                <div>
                  <Label>Nova senha</Label>
                  <Input type="password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required minLength={6} placeholder="Mínimo 6 caracteres" className="mt-1" />
                </div>
                <div>
                  <Label>Confirmar nova senha</Label>
                  <Input type="password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required className="mt-1" />
                </div>
                <Button type="submit" disabled={salvandoSenha} className="w-full mt-2">
                  {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
                </Button>
              </form>
            </div>
          </TabsContent>

          {nivel === "super_admin" && (
            <TabsContent value="usuarios">
              <div className="bg-card border rounded-lg p-6 shadow-sm">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Usuários do sistema
                  </h2>
                  <Button size="sm" variant="outline" onClick={() => setShowNovoForm((v) => !v)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Novo usuário
                  </Button>
                </div>

                {showNovoForm && (
                  <form onSubmit={handleCriarUsuario} className="bg-muted/50 rounded-lg p-4 mb-5 space-y-3 border">
                    <p className="font-semibold text-sm">Novo usuário</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Login</Label>
                        <Input value={novoLogin} onChange={(e) => setNovoLogin(e.target.value)} required placeholder="Ex: joao.silva" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Nome completo</Label>
                        <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="João Silva" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Senha inicial</Label>
                        <Input type="password" value={novaSenhaUser} onChange={(e) => setNovaSenhaUser(e.target.value)} required minLength={6} placeholder="Mín. 6 caracteres" className="mt-1 h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Nível de acesso</Label>
                        <select
                          value={novoNivel}
                          onChange={(e) => setNovoNivel(e.target.value)}
                          className="mt-1 h-8 text-sm w-full rounded-md border border-input bg-background px-2 py-1"
                        >
                          <option value="admin">Administrador</option>
                          <option value="operador">Operador (somente leitura)</option>
                          <option value="super_admin">Super Admin</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button type="submit" size="sm" disabled={criandoUser}>
                        {criandoUser ? "Criando..." : "Criar usuário"}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setShowNovoForm(false)}>
                        Cancelar
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1 border-t">
                      <strong>Administrador:</strong> cadastra, edita e aprova fotos. &nbsp;
                      <strong>Operador:</strong> visualiza e exporta. &nbsp;
                      <strong>Super Admin:</strong> acesso total incluindo gerenciar usuários.
                    </p>
                  </form>
                )}

                {carregandoUsers ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Carregando usuários...</p>
                ) : usuarios.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nenhum usuário cadastrado.</p>
                ) : (
                  <div className="divide-y">
                    {usuarios.map((u) => (
                      <div key={u.id} className="flex items-center justify-between py-3">
                        <div>
                          <p className="font-semibold text-sm">
                            {u.login}
                            {u.nome && <span className="text-muted-foreground font-normal"> — {u.nome}</span>}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                              ${u.nivel === "super_admin" ? "bg-purple-100 text-purple-700" : u.nivel === "admin" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                              <ShieldCheck className="w-3 h-3" />
                              {NIVEIS[u.nivel] || u.nivel}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Criado {new Date(u.criado_em).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm" variant="ghost"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                          onClick={() => handleExcluirUsuario(u)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}
