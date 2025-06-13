const db = firebase.firestore();
const tabela = document.getElementById("tabelaAlunos");

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    listarAlunos();
  });
});

function listarAlunos() {
  db.collection("alunos").orderBy("nome").get().then(snapshot => {
    if (snapshot.empty) {
      tabela.innerHTML = `<tr><td colspan="7" class="text-center">Nenhum aluno encontrado.</td></tr>`;
      return;
    }

    snapshot.forEach(doc => {
      const aluno = doc.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${aluno.matricula || "-"}</td>
        <td>${aluno.nome || "-"}</td>
        <td>${aluno.turma || aluno.turmaId || "-"}</td>
        <td>${aluno.nascimento || "-"}</td>
        <td>${aluno.responsavel?.nome || "-"}</td>
        <td>${aluno.responsavel?.telefone || "-"}</td>
        <td>${aluno.responsavel?.email || "-"}</td>
      `;

      tabela.appendChild(tr);
    });
  }).catch(error => {
    console.error("Erro ao buscar alunos:", error);
    tabela.innerHTML = `<tr><td colspan="7" class="text-danger text-center">Erro ao carregar alunos.</td></tr>`;
  });
}
