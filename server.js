import express from 'express';
  import pg from 'pg';
  import cors from 'cors';
  import { join, dirname } from 'path';
  import { fileURLToPath } from 'url';

  const { Pool } = pg;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const app = express();
  const port = process.env.PORT || 3000;

  // Database
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

  // Create table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agentes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      nome TEXT NOT NULL,
      matricula TEXT NOT NULL DEFAULT '',
      funcional TEXT NOT NULL DEFAULT '',
      cpf TEXT NOT NULL DEFAULT '',
      data_nascimento TEXT NOT NULL DEFAULT '',
      tipo_sanguineo TEXT NOT NULL DEFAULT '',
      nacionalidade TEXT NOT NULL DEFAULT '',
      naturalidade_uf TEXT NOT NULL DEFAULT '',
      data_expedicao TEXT NOT NULL DEFAULT '',
      validade TEXT NOT NULL DEFAULT '',
      foto TEXT NOT NULL DEFAULT '',
      equipamento_tipo TEXT NOT NULL DEFAULT '',
      equipamento_marca TEXT NOT NULL DEFAULT '',
      equipamento_nr_serie TEXT NOT NULL DEFAULT '',
      criado_em TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  const toApi = (r) => ({
    id: r.id, nome: r.nome, matricula: r.matricula, funcional: r.funcional,
    cpf: r.cpf, dataNascimento: r.data_nascimento, tipoSanguineo: r.tipo_sanguineo,
    nacionalidade: r.nacionalidade, naturalidadeUf: r.naturalidade_uf,
    dataExpedicao: r.data_expedicao, validade: r.validade, foto: r.foto,
    equipamentoTipo: r.equipamento_tipo, equipamentoMarca: r.equipamento_marca,
    equipamentoNrSerie: r.equipamento_nr_serie, criadoEm: r.criado_em,
  });
  const vals = (b) => [
    b.nome, b.matricula||'', b.funcional||'', b.cpf||'', b.dataNascimento||'',
    b.tipoSanguineo||'', b.nacionalidade||'', b.naturalidadeUf||'',
    b.dataExpedicao||'', b.validade||'', b.foto||'',
    b.equipamentoTipo||'', b.equipamentoMarca||'', b.equipamentoNrSerie||'',
  ];

  // API
  app.get('/api/healthz', (_, res) => res.json({ status: 'ok' }));

  app.get('/api/agentes', async (_, res) => {
    const { rows } = await pool.query('SELECT * FROM agentes ORDER BY criado_em');
    res.json(rows.map(toApi));
  });

  app.get('/api/agentes/:id', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM agentes WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado' });
    res.json(toApi(rows[0]));
  });

  app.post('/api/agentes', async (req, res) => {
    const { rows } = await pool.query(
      `INSERT INTO agentes (nome,matricula,funcional,cpf,data_nascimento,tipo_sanguineo,
        nacionalidade,naturalidade_uf,data_expedicao,validade,foto,
        equipamento_tipo,equipamento_marca,equipamento_nr_serie)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      vals(req.body)
    );
    res.status(201).json(toApi(rows[0]));
  });

  app.put('/api/agentes/:id', async (req, res) => {
    const { rows } = await pool.query(
      `UPDATE agentes SET nome=$1,matricula=$2,funcional=$3,cpf=$4,data_nascimento=$5,
        tipo_sanguineo=$6,nacionalidade=$7,naturalidade_uf=$8,data_expedicao=$9,
        validade=$10,foto=$11,equipamento_tipo=$12,equipamento_marca=$13,
        equipamento_nr_serie=$14 WHERE id=$15 RETURNING *`,
      [...vals(req.body), req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado' });
    res.json(toApi(rows[0]));
  });

  app.delete('/api/agentes/:id', async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM agentes WHERE id=$1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Agente não encontrado' });
    res.status(204).send();
  });

  // Serve frontend
  app.use(express.static(join(__dirname, 'dist')));
  app.get('*', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

  app.listen(port, () => console.log('Servidor rodando na porta ' + port));
  