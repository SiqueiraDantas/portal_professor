const db = firebase.firestore();

const turmaForm = document.getElementById("turmaForm");
const tabela = document.getElementById("tabelaTurmas");
const oficinaInput = document.getElementById("oficina");
const resumoHorarios = document.getElementById("resumoHorarios");
const turmaSucesso = document.getElementById("turmaSucesso");

let horariosSelecionados = [];
let tipoUsuario = "";

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged(async user => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const email = user.email;
    if (email.includes("@diretor")) {
      tipoUsuario = "diretor";
    } else if (email.includes("@professor")) {
      tipoUsuario = "professor";
    } else {
      alert("Tipo de usuário não reconhecido.");
      firebase.auth().signOut();
      return;
    }

    if (tipoUsuario === "professor") {
      document.getElementById("turmaForm").style.display = "none";
    }

    montarModalHorarios();
    carregarTurmas();
  });
});

function montarModalHorarios() {
  const dias = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const container = document.getElementById('diasContainer');
  container.innerHTML = "";

  dias.forEach(dia => {
    const id = 'dia' + dia.replace(/\s/g, '');
    const div = document.createElement('div');
    div.classList.add("mb-2");
    div.innerHTML = `
      <div class="form-check">
        <input class="form-check-input dia-check" type="checkbox" value="${dia}" id="${id}">
        <label class="form-check-label" for="${id}">${dia}</label>
      </div>
      <select class="form-select horario-select d-none mt-1">
        <option value="">Selecione o horário</option>
        <option value="18:00 às 19:30">18:00 às 19:30</option>
        <option value="19:30 às 21:00">19:30 às 21:00</option>
      </select>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll('.dia-check').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const select = checkbox.parentElement.parentElement.querySelector('.horario-select');
      if (checkbox.checked) {
        select.classList.remove("d-none");
      } else {
        select.classList.add("d-none");
        select.value = "";
      }
    });
  });
}

document.getElementById("btnSalvarHorarios").addEventListener("click", () => {
  horariosSelecionados = [];
  document.querySelectorAll(".dia-check").forEach(checkbox => {
    if (checkbox.checked) {
      const horario = checkbox.parentElement.parentElement.querySelector(".horario-select").value;
      if (horario !== "") {
        horariosSelecionados.push(`${checkbox.value} – ${horario}`);
      }
    }
  });
  resumoHorarios.innerHTML = horariosSelecionados.length > 0
    ? horariosSelecionados.join("<br>")
    : "<i>Nenhum horário selecionado</i>";
});

turmaForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (tipoUsuario !== "diretor") return;

  const oficina = oficinaInput.value.trim();
  if (!oficina || horariosSelecionados.length === 0) {
    alert("Preencha o nome da oficina e os horários.");
    return;
  }

  await db.collection("turmas").add({ oficina, horarios: horariosSelecionados });

  turmaForm.reset();
  resumoHorarios.innerHTML = "";
  horariosSelecionados = [];
  turmaSucesso.classList.remove("d-none");
  setTimeout(() => turmaSucesso.classList.add("d-none"), 3000);
  carregarTurmas();
});

async function carregarTurmas() {
  const snap = await db.collection("turmas").orderBy("oficina").get();
  tabela.innerHTML = "";

  if (snap.empty) {
    tabela.innerHTML = `<tr><td colspan="3" class="text-center text-muted">Nenhuma turma cadastrada.</td></tr>`;
  } else {
    snap.forEach(doc => {
      const turma = doc.data();
      const id = doc.id;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td contenteditable="false">${turma.oficina}</td>
        <td contenteditable="false">${(turma.horarios || []).join("<br>")}</td>
        <td>
          ${tipoUsuario === "diretor" ? `
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editarTurma(this)">Editar</button>
            <button class="btn btn-sm btn-outline-success me-1 d-none" onclick="salvarEdicaoTurma(this, '${id}')">Concluir</button>
            <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma('${id}')">Excluir</button>
          ` : `<span class="text-muted">Sem permissão</span>`}
        </td>
      `;
      tabela.appendChild(tr);
    });
  }

  tabela.style.display = "table-row-group";
}

window.editarTurma = function (btn) {
  if (tipoUsuario !== "diretor") return;

  const linha = btn.closest("tr");
  linha.querySelectorAll("td").forEach((td, index) => {
    if (index < 2) td.setAttribute("contenteditable", "true");
  });
  btn.classList.add("d-none");
  linha.querySelector(".btn-outline-success").classList.remove("d-none");
};

window.salvarEdicaoTurma = async function (btn, id) {
  if (tipoUsuario !== "diretor") return;

  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");
  const oficina = tds[0].innerText.trim();
  const horarios = tds[1].innerHTML.split("<br>").map(h => h.trim());

  await db.collection("turmas").doc(id).update({ oficina, horarios });

  tds.forEach(td => td.setAttribute("contenteditable", "false"));
  btn.classList.add("d-none");
  linha.querySelector(".btn-outline-primary").classList.remove("d-none");
};

window.excluirTurma = async function (id) {
  if (tipoUsuario !== "diretor") return;

  if (confirm("Deseja realmente excluir esta turma?")) {
    await db.collection("turmas").doc(id).delete();
    carregarTurmas();
  }
};
