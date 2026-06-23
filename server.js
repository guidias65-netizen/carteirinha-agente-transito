import express from 'express';
    import pg from 'pg';
    import cors from 'cors';
    import { join, dirname } from 'path';
    import { fileURLToPath } from 'url';

    const { Pool } = pg;
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const app = express();
    const port = process.env.PORT || 3000;

    if (!process.env.DATABASE_URL) {
      console.error('ERRO: DATABASE_URL não está definida!');
      process.exit(1);
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    async function initDb() {
      try {
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
            foto_pendente TEXT NOT NULL DEFAULT '',
            equipamento_tipo TEXT NOT NULL DEFAULT '',
            equipamento_marca TEXT NOT NULL DEFAULT '',
            equipamento_nr_serie TEXT NOT NULL DEFAULT '',
            criado_em TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        // Adiciona coluna caso a tabela já exista sem ela
        await pool.query(`
          ALTER TABLE agentes ADD COLUMN IF NOT EXISTS foto_pendente TEXT NOT NULL DEFAULT ''
        `);
        console.log('Banco de dados conectado e tabela pronta.');
      } catch (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
        process.exit(1);
      }
    }

    await initDb();

    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    const toApi = (r) => ({
      id: r.id, nome: r.nome, matricula: r.matricula, funcional: r.funcional,
      cpf: r.cpf, dataNascimento: r.data_nascimento, tipoSanguineo: r.tipo_sanguineo,
      nacionalidade: r.nacionalidade, naturalidadeUf: r.naturalidade_uf,
      dataExpedicao: r.data_expedicao, validade: r.validade, foto: r.foto,
      fotoPendente: r.foto_pendente || '',
      equipamentoTipo: r.equipamento_tipo, equipamentoMarca: r.equipamento_marca,
      equipamentoNrSerie: r.equipamento_nr_serie, criadoEm: r.criado_em,
    });

    app.get('/api/healthz', (_, res) => res.json({ status: 'ok' }));

    app.get('/api/agentes', async (_, res) => {
      try {
        const { rows } = await pool.query('SELECT * FROM agentes ORDER BY criado_em');
        res.json(rows.map(toApi));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar agentes: ' + err.message });
      }
    });

    app.get('/api/agentes/:id', async (req, res) => {
      try {
        const { rows } = await pool.query('SELECT * FROM agentes WHERE id=$1', [req.params.id]);
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado' });
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    // Busca por matrícula + 4 primeiros dígitos do CPF (para acesso próprio do agente)
    app.post('/api/agentes/buscar', async (req, res) => {
      try {
        const { matricula, cpf4 } = req.body;
        if (!matricula || !cpf4 || cpf4.length !== 4) {
          return res.status(400).json({ error: 'Matrícula e 4 dígitos do CPF são obrigatórios.' });
        }
        const { rows } = await pool.query(
          'SELECT * FROM agentes WHERE LOWER(matricula) = LOWER($1)',
          [matricula.trim()]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado.' });

        const cpfDigits = rows[0].cpf.replace(/\D/g, '');
        if (cpfDigits.slice(0, 4) !== cpf4.trim()) {
          return res.status(401).json({ error: 'CPF incorreto.' });
        }

        res.json({ id: rows[0].id, foto: rows[0].foto || '', fotoPendente: rows[0].foto_pendente || '' });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    // Upload de foto pendente pelo agente
    app.post('/api/agentes/:id/foto-upload', async (req, res) => {
      try {
        const { foto } = req.body;
        if (!foto) return res.status(400).json({ error: 'Foto é obrigatória.' });
        const { rows } = await pool.query(
          'UPDATE agentes SET foto_pendente=$1 WHERE id=$2 RETURNING *',
          [foto, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado.' });
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    // Aprovar foto pendente (admin)
    app.post('/api/agentes/:id/foto-aprovar', async (req, res) => {
      try {
        const { rows: cur } = await pool.query('SELECT * FROM agentes WHERE id=$1', [req.params.id]);
        if (!cur[0]) return res.status(404).json({ error: 'Agente não encontrado.' });
        if (!cur[0].foto_pendente) return res.status(400).json({ error: 'Nenhuma foto pendente.' });
        const { rows } = await pool.query(
          "UPDATE agentes SET foto=$1, foto_pendente='' WHERE id=$2 RETURNING *",
          [cur[0].foto_pendente, req.params.id]
        );
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    // Rejeitar foto pendente (admin)
    app.post('/api/agentes/:id/foto-rejeitar', async (req, res) => {
      try {
        const { rows } = await pool.query(
          "UPDATE agentes SET foto_pendente='' WHERE id=$1 RETURNING *",
          [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado.' });
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

  
    // Apagar foto aprovada (admin)
    app.post('/api/agentes/:id/foto-apagar', async (req, res) => {
      try {
        const { rows } = await pool.query(
          "UPDATE agentes SET foto='', foto_pendente='' WHERE id=$1 RETURNING *",
          [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado.' });
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/agentes', async (req, res) => {
      try {
        const b = req.body;
        let funcional;
        if (b.funcional && b.funcional.trim()) {
          funcional = b.funcional.trim();
        } else {
          const { rows: maxRows } = await pool.query(
            "SELECT MAX(CAST(NULLIF(REGEXP_REPLACE(funcional, '[^0-9]', '', 'g'), '') AS INTEGER)) AS max FROM agentes"
          );
          const nextNum = parseInt(maxRows[0].max || '0', 10) + 1;
          funcional = String(nextNum).padStart(3, '0');
        }

        const { rows } = await pool.query(
          `INSERT INTO agentes (nome,matricula,funcional,cpf,data_nascimento,tipo_sanguineo,
            nacionalidade,naturalidade_uf,data_expedicao,validade,foto,foto_pendente,
            equipamento_tipo,equipamento_marca,equipamento_nr_serie)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
          [b.nome, b.matricula||'', funcional, b.cpf||'', b.dataNascimento||'',
           b.tipoSanguineo||'', b.nacionalidade||'', b.naturalidadeUf||'',
           b.dataExpedicao||'', b.validade||'', b.foto||'', '',
           b.equipamentoTipo||'', b.equipamentoMarca||'', b.equipamentoNrSerie||'']
        );
        res.status(201).json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/api/agentes/:id', async (req, res) => {
      try {
        const b = req.body;
        const { rows } = await pool.query(
          `UPDATE agentes SET nome=$1,matricula=$2,funcional=$3,cpf=$4,data_nascimento=$5,
            tipo_sanguineo=$6,nacionalidade=$7,naturalidade_uf=$8,data_expedicao=$9,
            validade=$10,foto=$11,equipamento_tipo=$12,equipamento_marca=$13,
            equipamento_nr_serie=$14 WHERE id=$15 RETURNING *`,
          [b.nome, b.matricula||'', b.funcional||'', b.cpf||'', b.dataNascimento||'',
           b.tipoSanguineo||'', b.nacionalidade||'', b.naturalidadeUf||'',
           b.dataExpedicao||'', b.validade||'', b.foto||'',
           b.equipamentoTipo||'', b.equipamentoMarca||'', b.equipamentoNrSerie||'',
           req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Agente não encontrado' });
        res.json(toApi(rows[0]));
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/api/agentes/:id', async (req, res) => {
      try {
        const { rowCount } = await pool.query('DELETE FROM agentes WHERE id=$1', [req.params.id]);
        if (!rowCount) return res.status(404).json({ error: 'Agente não encontrado' });
        res.status(204).send();
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });

    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (_, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

    app.listen(port, () => console.log('Servidor rodando na porta ' + port));
    