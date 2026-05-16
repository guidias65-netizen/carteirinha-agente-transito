import { useState, useEffect } from 'react';

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
}

const STORAGE_KEY = 'agentes_transito_sorocaba';

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setAgents(JSON.parse(stored));
    }
  }, []);

  const saveAgents = (newAgents: Agent[]) => {
    setAgents(newAgents);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAgents));
  };

  const addAgent = (agent: Omit<Agent, 'id'>) => {
    const id = crypto.randomUUID();
    const newAgent = { ...agent, id };
    saveAgents([...agents, newAgent]);
    return newAgent;
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    saveAgents(agents.map(a => a.id === id ? { ...a, ...updates } : a));
  };

  const deleteAgent = (id: string) => {
    saveAgents(agents.filter(a => a.id !== id));
  };

  const getAgent = (id: string) => {
    return agents.find(a => a.id === id);
  };

  return {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    getAgent,
  };
}
