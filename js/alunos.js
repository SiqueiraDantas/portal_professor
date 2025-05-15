const db = firebase.firestore();
const tabela = document.getElementById("tabelaAlunos");
const btnEditar = document.getElementById("btnEditar");
const btnExcluir = document.getElementById("btnExcluir");

let idsSelecionados = [];
let linhasSelecionadas = [];
let tipoUsuario = ""; // será definido após login

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }

    const email = user.email;

    if (email.includes("@diretor")) {
      tipoUsuario = "diretor";
    } else if (email.includes("@professor")) {
      tipoUsuario = "professor";
      btnEditar.style.display = "none";
      btnExcluir.style.display = "none";
    } else {
      alert("Tipo de usuário não reconhecido.");
      firebase.auth().signOut();
      return;
    }

    listarAlunos();
  });

  const selectAllBox = document.getElementById("selectAll");
  selectAllBox.addEventListener("change", () => {
    const caixas = document.querySelectorAll(".checkbox-aluno");
    caixas.forEach(caixa => {
      caixa.checked = selectAllBox.checked;
      caixa.dispatchEvent(new Event("change"));
    });
  });

  btnEditar.addEventListener("click", async () => {
    if (tipoUsuario !== "diretor") return;

    if (linhasSelecionadas.length === 0) {
      alert("Selecione uma ou mais caixas para editar.");
      return;
    }

    linhasSelecionadas.forEach(linha => {
      linha.classList.add("table-active");
      linha.querySelectorAll("td").forEach((td, index) => {
        if (index > 1) td.setAttribute("contenteditable", "true");
      });
    });

    btnEditar.textContent = "Salvar Edição";
    btnEditar.classList.remove("btn-primary");
    btnEditar.classList.add("btn-success");

    btnEditar.onclick = async () => {
      for (let i = 0; i < linhasSelecionadas.length; i++) {
        const linha = linhasSelecionadas[i];
        const id = idsSelecionados[i];
        const tds = linha.querySelectorAll("td");

        const dados = {
          nome: tds[2].innerText.trim(),
          turma: tds[3].innerText.trim(),
          nascimento: tds[4].innerText.trim(),
          responsavel: {
            nome: tds[5].innerText.trim(),
            telefone: tds[6].innerText.trim(),
            email: tds[7].innerText.trim()
          }
        };

        await db.collection("alunos").doc(id).update(dados);

        linha.querySelectorAll("td").forEach((td, index) => {
          if (index > 1) td.setAttribute("contenteditable", "false");
        });
        linha.classList.remove("table-active");
      }

      btnEditar.textContent = "Editar";
      btnEditar.classList.remove("btn-success");
      btnEditar.classList.add("btn-primary");
      btnEditar.onclick = null;
      btnEditar.addEventListener("click", () => location.reload());
    };
  });

  btnExcluir.addEventListener("click", async () => {
    if (tipoUsuario !== "diretor") return;

    if (idsSelecionados.length === 0) return;

    const confirmar = confirm(`Deseja excluir ${idsSelecionados.length} aluno(s)?`);
    if (!confirmar) return;

    for (let id of idsSelecionados) {
      await db.collection("alunos").doc(id).delete();
    }

    location.reload();
  });
});

function listarAlunos() {
  db.collection("alunos").orderBy("nome").get().then(snapshot => {
    snapshot.forEach(doc => {
      const aluno = doc.data();
      const tr = document.createElement("tr");
      tr.setAttribute("data-id", doc.id);

      tr.innerHTML = `
        <td><input type="checkbox" class="checkbox-aluno" /></td>
        <td>${aluno.matricula || "-"}</td>
        <td>${aluno.nome || "-"}</td>
        <td>${aluno.turma || "-"}</td>
        <td>${aluno.nascimento || "-"}</td>
        <td>${aluno.responsavel?.nome || "-"}</td>
        <td>${aluno.responsavel?.telefone || "-"}</td>
        <td>${aluno.responsavel?.email || "-"}</td>
      `;

      tabela.appendChild(tr);

      const checkbox = tr.querySelector(".checkbox-aluno");
      checkbox.addEventListener("change", () => {
        const id = tr.getAttribute("data-id");

        if (checkbox.checked) {
          idsSelecionados.push(id);
          linhasSelecionadas.push(tr);
          if (tipoUsuario === "diretor") {
            btnExcluir.disabled = false;
            btnEditar.disabled = false;
          }
        } else {
          idsSelecionados = idsSelecionados.filter(item => item !== id);
          linhasSelecionadas = linhasSelecionadas.filter(item => item !== tr);

          if (idsSelecionados.length === 0 && tipoUsuario === "diretor") {
            btnExcluir.disabled = true;
            btnEditar.disabled = true;
          }
        }
      });
    });
  });
}
