const db = firebase.firestore();

function atualizarContadores() {
  db.collection("alunos").get().then(snapshot => {
    document.getElementById("alunosTotal").textContent = snapshot.size;
  });

  db.collection("turmas").get().then(snapshot => {
    document.getElementById("turmasTotal").textContent = snapshot.size;
  });
}

function mostrarTabela(tipo) {
  const painel = document.getElementById("painelDinamico");
  const titulo = document.getElementById("tituloPainel");
  const conteudo = document.getElementById("conteudoPainel");

  painel.classList.remove("hidden");
  conteudo.innerHTML = "<p>Carregando...</p>";

  if (tipo === "alunos") {
    titulo.textContent = "Lista de Alunos Matriculados";
    db.collection("alunos").orderBy("nome").get().then(snapshot => {
      let html = `
        <button id="btnImprimir" class="btn btn-outline-secondary mb-3">🖨️ Imprimir</button>
        <div id="areaImpressao">
          <div style="text-align:center; margin-bottom: 1rem;">
            <img src="img/logo_branca.png" style="height:60px" />
            <h3 style="margin: 0; color: #333;">Alunos Matriculados</h3>
          </div>
          <div style="overflow-x:auto;">
            <table>
              <thead>
                <tr>
                  <th>Foto</th>
                  <th>Matrícula</th>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Nascimento</th>
                  <th>Escola</th>
                  <th>Turma</th>
                  <th>Resp. Nome</th>
                  <th>Resp. Nascimento</th>
                  <th>Resp. Telefone</th>
                  <th>Resp. Email</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
      `;

      snapshot.forEach(doc => {
        const aluno = doc.data();
        const id = doc.id;
        const r = aluno.responsavel || {};

        html += `
          <tr data-id="${id}">
            <td>${aluno.fotoURL ? `<img src="${aluno.fotoURL}" alt="Foto" style="width:45px;height:45px;border-radius:50%;">` : `<span class="text-muted fst-italic">Sem foto</span>`}</td>
            <td contenteditable="false">${aluno.matricula || "-"}</td>
            <td contenteditable="false">${aluno.nome || "-"}</td>
            <td contenteditable="false">${aluno.cpf || "-"}</td>
            <td contenteditable="false">${aluno.nascimento || "-"}</td>
            <td contenteditable="false">${aluno.escola || "-"}</td>
            <td contenteditable="false">${aluno.turma || "-"}</td>
            <td contenteditable="false">${r.nome || "-"}</td>
            <td contenteditable="false">${r.nascimento || "-"}</td>
            <td contenteditable="false">${r.telefone || "-"}</td>
            <td contenteditable="false">${r.email || "-"}</td>
            <td>
              <button class="btn btn-sm btn-warning btn-editar">Editar</button>
              <button class="btn btn-sm btn-success btn-concluir" disabled>Concluir</button>
              <button class="btn btn-sm btn-danger btn-excluir" disabled>Excluir</button>
            </td>
          </tr>
        `;
      });

      html += `
              </tbody>
            </table>
          </div>
        </div>
      `;
      conteudo.innerHTML = html;

      document.getElementById("btnImprimir").addEventListener("click", () => {
        const printContent = document.getElementById("areaImpressao").innerHTML;
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = printContent;
        window.print();
        document.body.innerHTML = originalContent;
        location.reload();
      });

      // Botões
      document.querySelectorAll(".btn-editar").forEach(btn => {
        btn.addEventListener("click", function () {
          const row = this.closest("tr");
          row.querySelectorAll("td[contenteditable]").forEach(cell => {
            cell.setAttribute("contenteditable", "true");
            cell.style.backgroundColor = "#fff8dc";
          });
          row.querySelector(".btn-concluir").disabled = false;
          row.querySelector(".btn-excluir").disabled = false;
          this.disabled = true;
        });
      });

      document.querySelectorAll(".btn-concluir").forEach(btn => {
        btn.addEventListener("click", async function () {
          const row = this.closest("tr");
          const id = row.getAttribute("data-id");
          const tds = row.querySelectorAll("td");
          const dados = {
            matricula: tds[1].textContent.trim(),
            nome: tds[2].textContent.trim(),
            cpf: tds[3].textContent.trim(),
            nascimento: tds[4].textContent.trim(),
            escola: tds[5].textContent.trim(),
            turma: tds[6].textContent.trim(),
            responsavel: {
              nome: tds[7].textContent.trim(),
              nascimento: tds[8].textContent.trim(),
              telefone: tds[9].textContent.trim(),
              email: tds[10].textContent.trim()
            }
          };

          await db.collection("alunos").doc(id).update(dados);
          alert("Aluno atualizado com sucesso!");

          row.querySelectorAll("td[contenteditable]").forEach(cell => {
            cell.setAttribute("contenteditable", "false");
            cell.style.backgroundColor = "";
          });
          row.querySelector(".btn-editar").disabled = false;
          row.querySelector(".btn-concluir").disabled = true;
          row.querySelector(".btn-excluir").disabled = true;
        });
      });

      document.querySelectorAll(".btn-excluir").forEach(btn => {
        btn.addEventListener("click", async function () {
          const row = this.closest("tr");
          const id = row.getAttribute("data-id");
          if (confirm("Tem certeza que deseja excluir este aluno?")) {
            await db.collection("alunos").doc(id).delete();
            row.remove();
          }
        });
      });
    });
  }

  else if (tipo === "turmas") {
    titulo.textContent = "Turmas Ativas";
    db.collection("turmas").get().then(snapshot => {
      let html = `<table><tr><th>Oficina</th><th>Dia(s) e Horário(s)</th></tr>`;
      snapshot.forEach(doc => {
        const turma = doc.data();
        const horarios = (turma.horarios || []).join("<br>");
        html += `<tr><td>${turma.oficina || "-"}</td><td>${horarios || "-"}</td></tr>`;
      });
      html += "</table>";
      conteudo.innerHTML = html;
    });
  }

  else if (tipo === "frequencia") {
    titulo.textContent = "Resumo da Frequência do Mês";
    db.collection("frequencias").get().then(snapshot => {
      const totalPorTurma = {};
      const presencas = {};

      snapshot.forEach(doc => {
        const freq = doc.data();
        const turma = freq.turma;
        if (!turma) return;

        if (!totalPorTurma[turma]) {
          totalPorTurma[turma] = 0;
          presencas[turma] = 0;
        }

        totalPorTurma[turma]++;
        if (freq.presente) presencas[turma]++;
      });

      let html = `<table><tr><th>Turma</th><th>Presenças</th><th>Registros</th><th>Presença %</th></tr>`;
      for (const turma in totalPorTurma) {
        const total = totalPorTurma[turma];
        const pres = presencas[turma];
        const perc = ((pres / total) * 100).toFixed(1);
        html += `<tr><td>${turma}</td><td>${pres}</td><td>${total}</td><td>${perc}%</td></tr>`;
      }
      html += "</table>";
      conteudo.innerHTML = html;
    });
  }

  else if (tipo === "faltas") {
    titulo.textContent = "Alunos com Mais Faltas";
    db.collection("frequencias").get().then(snapshot => {
      const faltas = {};

      snapshot.forEach(doc => {
        const freq = doc.data();
        if (!freq.presente && freq.nome) {
          faltas[freq.nome] = (faltas[freq.nome] || 0) + 1;
        }
      });

      const ordenado = Object.entries(faltas).sort((a, b) => b[1] - a[1]);
      let html = `<table><tr><th>Nome</th><th>Faltas</th></tr>`;
      ordenado.forEach(([nome, qtde]) => {
        html += `<tr><td>${nome}</td><td>${qtde}</td></tr>`;
      });
      html += "</table>";
      conteudo.innerHTML = html;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarContadores();
});
