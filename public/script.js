/* Principais alterações feitas em JavaScript: 
  - Filtros por "Todas", "Pendentes", "Concluídas"
  - Validação para evitar tarefas duplicadas
  - Contador detalhado: "Total: X | Concluídas: Y | Pendentes: Z"
  - Dark Mode com toggle (salva preferência)
*/
const formulario = document.querySelector("#formulario");
const input = document.querySelector("#tarefa");
const lista = document.querySelector("#lista");
const mensagem = document.querySelector("#mensagem");
const botaoTema = document.querySelector("#botao-tema");

/* Botões de filtro */
const botaoTodas = document.querySelector("#filtro-todas");
const botaoPendentes = document.querySelector("#filtro-pendentes");
const botaoConcluidas = document.querySelector("#filtro-concluidas");

/* Contadores detalhados */
const contadorTotal = document.querySelector("#contador-total");
const contadorConcluidas = document.querySelector("#contador-concluidas");
const contadorPendentes = document.querySelector("#contador-pendentes");

/* Variável para controlar qual filtro está ativo */
let filtroAtual = "todas";

/* Variável para armazenar todas as tarefas (para filtragem) */
let todasAsTarefas = [];

/* Verifica se o dark mode está ativado no localStorage e aplica */
if (localStorage.getItem("dark-mode") === "ativo") {
  document.body.classList.add("dark-mode");
  botaoTema.textContent = "☀️ Light Mode";
}

/* Toggle do Dark Mode */
botaoTema.addEventListener("click", function () {
  document.body.classList.toggle("dark-mode");
  
  if (document.body.classList.contains("dark-mode")) {
    localStorage.setItem("dark-mode", "ativo");
    botaoTema.textContent = "☀️ Light Mode";
  } else {
    localStorage.setItem("dark-mode", "inativo");
    botaoTema.textContent = "🌙 Dark Mode";
  }
});

/* Atualiza os contadores de forma detalhada */
function atualizarContadores(tarefas) {
  const total = tarefas.length;
  const concluidas = tarefas.filter(t => t.concluida).length;
  const pendentes = total - concluidas;
  
  contadorTotal.textContent = total;
  contadorConcluidas.textContent = concluidas;
  contadorPendentes.textContent = pendentes;
}

/* Filtra tarefas conforme o filtro selecionado */
function aplicarFiltro(tarefas) {
  switch (filtroAtual) {
    case "pendentes":
      return tarefas.filter(t => !t.concluida);
    case "concluidas":
      return tarefas.filter(t => t.concluida);
    default:
      return tarefas;
  }
}

/* Pede ao servidor a lista de tarefas e desenha na tela. */
async function carregarTarefas() {
  /* Espera a resposta do servidor e converte o corpo para JSON. */
  const resposta = await fetch("/tarefas");
  todasAsTarefas = await resposta.json();

  /* Aplica o filtro atual */
  const tarefasFiltradas = aplicarFiltro(todasAsTarefas);

  /* Limpa a lista antes de desenhar tudo de novo. */
  lista.innerHTML = "";

  /* Cria um <li> para cada tarefa recebida do servidor. */
  tarefasFiltradas.forEach(function (tarefa) {
    const item = document.createElement("li");
    item.textContent = tarefa.texto;
    item.classList.add("tarefa-item");

    /* Mostra como concluída se já estiver assim no banco. */
    if (tarefa.concluida) {
      item.classList.add("concluida");
    }

    /* Alterna a tarefa entre normal e concluída, salvando no servidor. */
    item.addEventListener("click", async function () {
      await fetch("/tarefas/" + tarefa.id, { method: "PATCH" });
      carregarTarefas();
    });

    /* Cria o botão de remoção. */
    const botaoRemover = document.createElement("button");
    botaoRemover.textContent = "Remover";
    botaoRemover.classList.add("botao-remover");

    /* Remove a tarefa no servidor e atualiza a tela. */
    botaoRemover.addEventListener("click", async function (evento) {
      evento.stopPropagation();
      item.classList.add("remover");
      await fetch("/tarefas/" + tarefa.id, { method: "DELETE" });
      setTimeout(() => carregarTarefas(), 300);
    });

    /* Coloca o botão no item e o item na lista. */
    item.appendChild(botaoRemover);
    lista.appendChild(item);
  });

  /* Atualiza os contadores com todas as tarefas (não só as filtradas) */
  atualizarContadores(todasAsTarefas);
}

/* Configurar os botões de filtro */
botaoTodas.addEventListener("click", function () {
  filtroAtual = "todas";
  atualizarBotoesAtivos();
  carregarTarefas();
});

botaoPendentes.addEventListener("click", function () {
  filtroAtual = "pendentes";
  atualizarBotoesAtivos();
  carregarTarefas();
});

botaoConcluidas.addEventListener("click", function () {
  filtroAtual = "concluidas";
  atualizarBotoesAtivos();
  carregarTarefas();
});

/* Atualiza qual botão de filtro está destacado */
function atualizarBotoesAtivos() {
  botaoTodas.classList.remove("ativo");
  botaoPendentes.classList.remove("ativo");
  botaoConcluidas.classList.remove("ativo");
  
  if (filtroAtual === "todas") botaoTodas.classList.add("ativo");
  if (filtroAtual === "pendentes") botaoPendentes.classList.add("ativo");
  if (filtroAtual === "concluidas") botaoConcluidas.classList.add("ativo");
}

/* Executa quando o usuário envia o formulário de cadastro. */
formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  /* Lê o texto digitado e remove espaços das extremidades. */
  const texto = input.value.trim();

  /* Não deixa cadastrar tarefa vazia. */
  if (texto === "") {
    mensagem.textContent = "Digite uma tarefa.";
    return;
  }

  /* Validação: verifica se a tarefa já existe (case-insensitive) */
  const tarefaJaExiste = todasAsTarefas.some(
    t => t.texto.toLowerCase() === texto.toLowerCase()
  );

  if (tarefaJaExiste) {
    mensagem.textContent = "❌ Essa tarefa já existe!";
    input.value = "";
    return;
  }

  /* Envia a nova tarefa para o servidor via POST, em JSON. */
  await fetch("/tarefas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto: texto })
  });

  /* Limpa o campo e busca a lista atualizada do servidor. */
  input.value = "";
  mensagem.textContent = "✅ Tarefa adicionada!";
  carregarTarefas();
});

/* Busca a lista assim que a página abre. */
carregarTarefas();
