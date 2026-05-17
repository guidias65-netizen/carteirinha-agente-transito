import { useState, useEffect, useCallback } from 'react';

export interface Agent {
  id: string;
  nome: string;
  matricula: string;
  funcional: string;
  cpf: string;
  dataNascimento: string;
  tipoSanguineo: string;
  nacionalidade: string;
  naturalidadeUf: string;
  dataExpedicao: string;
  validade: string;
  equipamentoTipo: string;
  equipamentoMarca: string;
  equipamentoNrSerie: string;
  foto: string;
  criadoEm?: string;
}

const API_BASE = (import.meta.env.VITE_API_URL ?? "/api") as string;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<Agent[]>("/agentes");
      setAgents(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const addAgent = useCallback(async (agent: Omit<Agent, 'id' | 'criadoEm'>): Promise<Agent> => {
    const created = await apiFetch<Agent>("/agentes", {
      method: "POST",
      body: JSON.stringify(agent),
    });
    setAgents(prev => [...prev, created]);
    return created;
  }, []);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>): Promise<void> => {
    const updated = await apiFetch<Agent>(`/agentes/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    setAgents(prev => prev.map(a => a.id === id ? updated : a));
  }, []);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    await apiFetch<void>(`/agentes/${id}`, { method: "DELETE" });
    setAgents(prev => prev.filter(a => a.id !== id));
  }, []);

  const getAgent = useCallback((id: string): Agent | undefined => {
    return agents.find(a => a.id === id);
  }, [agents]);

  return {
    agents,
    loading,
    error,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent,
    refetch: fetchAgents,
  };
}
