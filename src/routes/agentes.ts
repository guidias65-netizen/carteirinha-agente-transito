import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, agentesTable, insertAgenteSchema } from "@workspace/db";

const router = Router();

// GET /api/agentes
router.get("/agentes", async (req, res) => {
  const agentes = await db
    .select()
    .from(agentesTable)
    .orderBy(agentesTable.criadoEm);
  res.json(agentes.map(toApi));
});

// GET /api/agentes/:id
router.get("/agentes/:id", async (req, res) => {
  const [agente] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!agente) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  res.json(toApi(agente));
});

// POST /api/agentes
router.post("/agentes", async (req, res) => {
  const parsed = insertAgenteSchema.safeParse(fromApi(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [agente] = await db
    .insert(agentesTable)
    .values(parsed.data)
    .returning();
  res.status(201).json(toApi(agente));
});

// PUT /api/agentes/:id
router.put("/agentes/:id", async (req, res) => {
  const [existing] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  const parsed = insertAgenteSchema.partial().safeParse(fromApi(req.body));
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(agentesTable)
    .set(parsed.data)
    .where(eq(agentesTable.id, req.params.id))
    .returning();
  res.json(toApi(updated));
});

// DELETE /api/agentes/:id
router.delete("/agentes/:id", async (req, res) => {
  const [existing] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  await db.delete(agentesTable).where(eq(agentesTable.id, req.params.id));
  res.status(204).send();
});

// POST /api/agentes/buscar — agent login
router.post("/agentes/buscar", async (req, res) => {
  const { matricula, cpf4 } = req.body as { matricula?: string; cpf4?: string };
  if (!matricula || !cpf4) {
    res.status(400).json({ error: "Matrícula e CPF são obrigatórios" });
    return;
  }
  const agentes = await db.select().from(agentesTable);
  const found = agentes.find(
    (a) =>
      a.matricula.trim() === matricula.trim() &&
      a.cpf.replace(/\D/g, "").startsWith(cpf4.trim()),
  );
  if (!found) {
    res.status(401).json({ error: "Não encontrado" });
    return;
  }
  res.json({ id: found.id, foto: found.foto, fotoPendente: found.fotoPendente });
});

// POST /api/agentes/:id/foto-upload — agent submits a pending photo
router.post("/agentes/:id/foto-upload", async (req, res) => {
  const { foto } = req.body as { foto?: string };
  if (!foto) {
    res.status(400).json({ error: "Foto é obrigatória" });
    return;
  }
  const [existing] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  const [updated] = await db
    .update(agentesTable)
    .set({ fotoPendente: foto })
    .where(eq(agentesTable.id, req.params.id))
    .returning();
  res.json(toApi(updated));
});

// POST /api/agentes/:id/foto-aprovar — admin approves pending photo
router.post("/agentes/:id/foto-aprovar", async (req, res) => {
  const [existing] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  if (!existing.fotoPendente) {
    res.status(400).json({ error: "Nenhuma foto pendente" });
    return;
  }
  const [updated] = await db
    .update(agentesTable)
    .set({ foto: existing.fotoPendente, fotoPendente: "" })
    .where(eq(agentesTable.id, req.params.id))
    .returning();
  res.json(toApi(updated));
});

// POST /api/agentes/:id/foto-rejeitar — admin rejects pending photo
router.post("/agentes/:id/foto-rejeitar", async (req, res) => {
  const [existing] = await db
    .select()
    .from(agentesTable)
    .where(eq(agentesTable.id, req.params.id));
  if (!existing) {
    res.status(404).json({ error: "Agente não encontrado" });
    return;
  }
  const [updated] = await db
    .update(agentesTable)
    .set({ fotoPendente: "" })
    .where(eq(agentesTable.id, req.params.id))
    .returning();
  res.json(toApi(updated));
});

// Map DB row → API response (camelCase)
function toApi(a: typeof agentesTable.$inferSelect) {
  return {
    id: a.id,
    nome: a.nome,
    matricula: a.matricula,
    funcional: a.funcional,
    cpf: a.cpf,
    dataNascimento: a.dataNascimento,
    tipoSanguineo: a.tipoSanguineo,
    nacionalidade: a.nacionalidade,
    naturalidadeUf: a.naturalidadeUf,
    dataExpedicao: a.dataExpedicao,
    validade: a.validade,
    foto: a.foto,
    fotoPendente: a.fotoPendente,
    equipamentoTipo: a.equipamentoTipo,
    equipamentoMarca: a.equipamentoMarca,
    equipamentoNrSerie: a.equipamentoNrSerie,
    criadoEm: a.criadoEm.toISOString(),
  };
}

// Map API body → DB columns
function fromApi(body: Record<string, unknown>) {
  return {
    nome: body.nome,
    matricula: body.matricula ?? "",
    funcional: body.funcional ?? "",
    cpf: body.cpf ?? "",
    dataNascimento: body.dataNascimento ?? "",
    tipoSanguineo: body.tipoSanguineo ?? "",
    nacionalidade: body.nacionalidade ?? "",
    naturalidadeUf: body.naturalidadeUf ?? "",
    dataExpedicao: body.dataExpedicao ?? "",
    validade: body.validade ?? "",
    foto: body.foto ?? "",
    fotoPendente: body.fotoPendente ?? "",
    equipamentoTipo: body.equipamentoTipo ?? "",
    equipamentoMarca: body.equipamentoMarca ?? "",
    equipamentoNrSerie: body.equipamentoNrSerie ?? "",
  };
}

export default router;
