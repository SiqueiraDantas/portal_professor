const db = firebase.firestore();

const filtroOficina = document.getElementById("filtroOficina");
const btnCarregar = document.getElementById("btnCarregar");
const areaFrequencia = document.getElementById("areaFrequencia");
const listaAlunos = document.getElementById("listaAlunos");

const nomeAluno = document.getElementById("nomeAluno");
const matriculaAluno = document.getElementById("matriculaAluno");
const oficinaAluno = document.getElementById("oficinaAluno");
const frequenciaAluno = document.getElementById("frequenciaAluno");

const btnDetalhar = document.getElementById("btnDetalhar");
const tabelaDetalhes = document.getElementById("tabelaDetalhes");
const tabelaFrequencia = document.getElementById("tabelaFrequencia");
const btnVoltar = document.getElementById("btnVoltar");

let alunoSelecionado = null;
let chamadasOficina = [];
let alunosOficina = [];

// Botão de voltar ao dashboard
btnVoltar?.addEventListener("click", () => {
  const user = firebase.auth().currentUser;
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const email = user.email;
  if (email === "diretor@madeinsertao.org") {
    window.location.href = "diretor.html";
  } else {
    window.location.href = "dashboard.html";
  }
});

// Carregar oficinas no select
document.addEventListener("DOMContentLoaded", async () => {
  const snap = await db.collection("turmas").orderBy("oficina").get();
  snap.forEach(doc => {
    const turma = doc.data();
    if (turma.oficina) {
      const option = new Option(turma.oficina, turma.oficina);
      filtroOficina.appendChild(option);
    }
  });
});

// Quando clicar no botão "Carregar Frequências"
btnCarregar.addEventListener("click", async () => {
  const oficina = filtroOficina.value;
  if (!oficina) {
    alert("Selecione uma oficina.");
    return;
  }

  // Pegar alunos com campo 'turma' igual ao nome da oficina
  const alunosSnap = await db.collection("alunos")
    .where("turma", "==", oficina)
    .orderBy("nome")
    .get();

  alunosOficina = alunosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Pegar registros de frequência da mesma oficina
  const chamadasSnap = await db.collection("frequencias")
    .where("oficina", "==", oficina)
    .orderBy("data")
    .get();

  chamadasOficina = chamadasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  renderizarListaAlunos();
  areaFrequencia.style.display = "flex";
});

// Renderizar lista lateral de alunos com total de presenças
function renderizarListaAlunos() {
  listaAlunos.innerHTML = "";

  alunosOficina.forEach(aluno => {
    const totalAulas = chamadasOficina.length;
    const presencas = chamadasOficina.filter(c => c.presencas?.includes(aluno.id)).length;

    const item = document.createElement("button");
    item.className = "list-group-item list-group-item-action d-flex justify-content-between align-items-center";
    item.innerHTML = `
      <span>${aluno.nome}</span>
      <span class="badge bg-primary rounded-pill">${presencas}/${totalAulas}</span>
    `;
    item.onclick = () => mostrarAluno(aluno);
    listaAlunos.appendChild(item);
  });
}

// Mostrar os dados do aluno selecionado no painel
function mostrarAluno(aluno) {
  alunoSelecionado = aluno;

  nomeAluno.textContent = aluno.nome || "-";
  matriculaAluno.textContent = aluno.matricula || "-";
  oficinaAluno.textContent = aluno.turma || "-";

  const total = chamadasOficina.length;
  const presentes = chamadasOficina.filter(c => c.presencas?.includes(aluno.id)).length;
  frequenciaAluno.textContent = `${presentes}/${total}`;

  tabelaDetalhes.style.display = "none";
}

// Ao clicar no botão "🛈", exibir detalhes por data
btnDetalhar.addEventListener("click", () => {
  if (!alunoSelecionado) return;
  tabelaFrequencia.innerHTML = "";

  chamadasOficina.forEach(chamada => {
    let status = "Falta";
    let anexo = "-";

    if (chamada.presencas?.includes(alunoSelecionado.id)) {
      status = "Presente";
    }

    if (chamada.justificadas?.some(j => j.id === alunoSelecionado.id)) {
      status = "Justificada";
      const justificativa = chamada.justificadas.find(j => j.id === alunoSelecionado.id);
      if (justificativa?.anexo) {
        anexo = `<a href="${justificativa.anexo}" target="_blank">Baixar</a>`;
      }
    }

    const linha = `
      <tr>
        <td>${formatarData(chamada.data)}</td>
        <td>${status}</td>
        <td>${anexo}</td>
      </tr>
    `;

    tabelaFrequencia.innerHTML += linha;
  });

  tabelaDetalhes.style.display = "block";
});

// Formatador de data
function formatarData(dataISO) {
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR");
}
