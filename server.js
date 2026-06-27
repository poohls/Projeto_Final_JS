/* Importa o Express e o better-sqlite3 (o banco de dados). */
const express = require("express");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const porta = 3001;

/* Entrega para o navegador os arquivos de public/ (index.html, style.css, script.js). */
app.use(express.static(path.join(__dirname, "public")));
/* Permite ler corpos de requisição em JSON (necessário para o POST). */
app.use(express.json());

/*
  Banco de dados salvo em arquivo -- diferente do array, sobrevive a reiniciar o servidor.
  Usamos __dirname (a pasta deste arquivo) em vez de um caminho relativo solto,
  pra o banco sempre ficar no mesmo lugar, não importa de onde "npm start" foi chamado.
*/
const db = new Database(path.join(__dirname, "tarefas.db"));

/* Cria a tabela de tarefas, se ainda não existir. */
db.exec(`
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    concluida INTEGER NOT NULL DEFAULT 0
  )
`);

/* Quando o navegador pedir /tarefas, busca tudo no banco e responde em JSON. */
app.get("/tarefas", function (req, res) {
  const tarefas = db.prepare("SELECT id, texto, concluida FROM tarefas ORDER BY id").all();

  /* O SQLite guarda 0/1; convertemos para true/false antes de enviar. */
  const tarefasConvertidas = tarefas.map(function (tarefa) {
    return { id: tarefa.id, texto: tarefa.texto, concluida: Boolean(tarefa.concluida) };
  });

  res.json(tarefasConvertidas);
});

/* Quando o navegador enviar uma nova tarefa, grava no banco. */
app.post("/tarefas", function (req, res) {
  const texto = req.body.texto;

  db.prepare("INSERT INTO tarefas (texto) VALUES (?)").run(texto);

  res.json({ mensagem: "Tarefa cadastrada!" });
});

/* Quando o navegador marcar/desmarcar uma tarefa como concluída. */
app.patch("/tarefas/:id", function (req, res) {
  const id = req.params.id;

  db.prepare("UPDATE tarefas SET concluida = NOT concluida WHERE id = ?").run(id);

  res.json({ mensagem: "Tarefa atualizada!" });
});

/* Quando o navegador remover uma tarefa. */
app.delete("/tarefas/:id", function (req, res) {
  const id = req.params.id;

  db.prepare("DELETE FROM tarefas WHERE id = ?").run(id);

  res.json({ mensagem: "Tarefa removida!" });
});

app.listen(porta, function () {
  console.log("Servidor rodando em http://localhost:" + porta);
});
