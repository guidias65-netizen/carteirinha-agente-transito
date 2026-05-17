import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const agentesTable = pgTable("agentes", {
  id: uuid("id").primaryKey().defaultRandom(),
  nome: text("nome").notNull(),
  matricula: text("matricula").notNull().default(""),
  funcional: text("funcional").notNull().default(""),
  cpf: text("cpf").notNull().default(""),
  dataNascimento: text("data_nascimento").notNull().default(""),
  tipoSanguineo: text("tipo_sanguineo").notNull().default(""),
  nacionalidade: text("nacionalidade").notNull().default(""),
  naturalidadeUf: text("naturalidade_uf").notNull().default(""),
  dataExpedicao: text("data_expedicao").notNull().default(""),
  validade: text("validade").notNull().default(""),
  foto: text("foto").notNull().default(""),
  equipamentoTipo: text("equipamento_tipo").notNull().default(""),
  equipamentoMarca: text("equipamento_marca").notNull().default(""),
  equipamentoNrSerie: text("equipamento_nr_serie").notNull().default(""),
  criadoEm: timestamp("criado_em").notNull().defaultNow(),
});

export const insertAgenteSchema = createInsertSchema(agentesTable).omit({
  id: true,
  criadoEm: true,
});

export const selectAgenteSchema = createSelectSchema(agentesTable);

export type InsertAgente = z.infer<typeof insertAgenteSchema>;
export type Agente = typeof agentesTable.$inferSelect;
