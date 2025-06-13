const db = firebase.firestore();

const tabela = document.getElementById("tabelaPlanos");
const planoForm = document.getElementById("planoForm");
const msgSucesso = document.getElementById("msgSucesso");
const selectOficina = document.getElementById("oficina");
const filtroOficina = document.getElementById("filtroOficina");
const filtroData = document.getElementById("filtroData");
const tabelaContainer = document.getElementById("tabelaContainer");

async function carregarTurmas() {
  const snap = await db.collection("turmas").get();
  snap.forEach(doc => {
    const nome = doc.data().oficina;
    if (!nome) return;
    selectOficina.appendChild(new Option(nome, nome));
    filtroOficina.appendChild(new Option(nome, nome));
  });
}

planoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const plano = {
    data: document.getElementById("data").value,
    oficina: selectOficina.value,
    conteudo: document.getElementById("conteudo").value,
    observacoes: document.getElementById("observacoes").value
  };
  await db.collection("planos_aula").add(plano);
  planoForm.reset();
  msgSucesso.classList.remove("d-none");
  setTimeout(() => msgSucesso.classList.add("d-none"), 3000);
});

document.getElementById("btnFiltrar").addEventListener("click", async () => {
  const oficina = filtroOficina.value;
  const data = filtroData.value;

  if (!oficina || !data) {
    alert("Selecione a oficina e a data.");
    return;
  }

  const snap = await db.collection("planos_aula")
    .where("oficina", "==", oficina)
    .where("data", "==", data)
    .get();

  tabela.innerHTML = "";
  tabelaContainer.classList.remove("d-none");

  if (snap.empty) {
    tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum plano encontrado.</td></tr>`;
    return;
  }

  snap.forEach(doc => {
    const plano = doc.data();
    const id = doc.id;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td contenteditable="false">${plano.data}</td>
      <td contenteditable="false">${plano.oficina}</td>
      <td contenteditable="false">${plano.conteudo}</td>
      <td contenteditable="false">${plano.observacoes || '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="editarLinha(this)">Editar</button>
        <button class="btn btn-sm btn-outline-success me-1 d-none" onclick="concluirEdicao(this, '${id}')">Concluir</button>
        <button class="btn btn-sm btn-outline-danger me-1" onclick="excluirPlano('${id}')">Excluir</button>
        <button class="btn btn-sm btn-outline-dark" onclick="imprimirPlano(this)">Imprimir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
});

window.editarLinha = function (btn) {
  const linha = btn.closest("tr");
  linha.querySelectorAll("td[contenteditable]").forEach(td => td.setAttribute("contenteditable", "true"));
  btn.classList.add("d-none");
  linha.querySelector(".btn-outline-success").classList.remove("d-none");
};

window.concluirEdicao = async function (btn, id) {
  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");
  const atualizado = {
    data: tds[0].innerText.trim(),
    oficina: tds[1].innerText.trim(),
    conteudo: tds[2].innerText.trim(),
    observacoes: tds[3].innerText.trim()
  };
  await db.collection("planos_aula").doc(id).update(atualizado);
  linha.querySelectorAll("td").forEach(td => td.setAttribute("contenteditable", "false"));
  btn.classList.add("d-none");
  linha.querySelector(".btn-outline-primary").classList.remove("d-none");
};

window.excluirPlano = async function (id) {
  if (confirm("Deseja excluir este plano?")) {
    await db.collection("planos_aula").doc(id).delete();
    tabela.innerHTML = "";
    tabelaContainer.classList.add("d-none");
  }
};

window.imprimirPlano = function (btn) {
  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");
  const conteudo = `
    <html>
      <head>
        <title>Plano de Aula</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h2 { color: #3f2723; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 12px; border: 1px solid #ccc; }
          th { background: #eee; padding: 8px 12px; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Plano de Aula</h2>
        <table>
          <tr><th>Data</th><td>${tds[0].innerText}</td></tr>
          <tr><th>Oficina</th><td>${tds[1].innerText}</td></tr>
          <tr><th>Conteúdo</th><td>${tds[2].innerText}</td></tr>
          <tr><th>Observações</th><td>${tds[3].innerText}</td></tr>
        </table>
        <script>window.print()</script>
      </body>
    </html>
  `;

  const win = window.open('', '', 'width=800,height=600');
  win.document.write(conteudo);
  win.document.close();
};

document.addEventListener("DOMContentLoaded", carregarTurmas);
