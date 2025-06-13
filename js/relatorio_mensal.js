const db = firebase.firestore();
const storage = firebase.storage();

const relatorioForm = document.getElementById("relatorioForm");
const turmaSelect = document.getElementById("turmaSelect");
const dataRelatorio = document.getElementById("dataRelatorio");
const atividades = document.getElementById("atividades");
const observacoes = document.getElementById("observacoes");
const anexos = document.getElementById("anexos");
const tabela = document.getElementById("tabelaRelatorios");
const tabelaContainer = document.getElementById("tabelaContainer");
const msgSucesso = document.getElementById("msgSucesso");

const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

async function carregarTurmas() {
  const snap = await db.collection("turmas").get();
  snap.forEach(doc => {
    const nome = doc.data().oficina || "(sem nome)";
    turmaSelect.appendChild(new Option(nome, doc.id));
  });
}

relatorioForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const turmaId = turmaSelect.value;
  const turmaNome = turmaSelect.options[turmaSelect.selectedIndex].text;
  const rawDate = dataRelatorio.value; // formato YYYY-MM

  if (!rawDate || !turmaId) {
    alert("Preencha todos os campos obrigatórios.");
    return;
  }

  const [ano, mes] = rawDate.split("-");
  const dataFormatada = `${meses[parseInt(mes) - 1]} de ${ano}`;

  if (anexos.files.length > 5) {
    alert("Você só pode enviar até 5 arquivos.");
    return;
  }

  const urlsAnexos = [];

  for (let i = 0; i < anexos.files.length; i++) {
    const file = anexos.files[i];
    const nomeArquivo = `${turmaId}_${rawDate}_${Date.now()}_${file.name}`;
    const ref = storage.ref().child(`anexos_relatorios/${nomeArquivo}`);
    const snapshot = await ref.put(file);
    const url = await snapshot.ref.getDownloadURL();
    urlsAnexos.push(url);
  }

  const relatorio = {
    turmaId,
    turmaNome,
    data: dataFormatada,
    atividades: atividades.value.trim(),
    observacoes: observacoes.value.trim(),
    anexos: urlsAnexos,
    dataEnvio: new Date().toISOString()
  };

  const docId = `${turmaId}_${rawDate}`;
  await db.collection("relatorios").doc(docId).set(relatorio);

  relatorioForm.reset();
  msgSucesso.classList.remove("d-none");
  setTimeout(() => msgSucesso.classList.add("d-none"), 3000);
  listarRelatorios();
});

async function listarRelatorios() {
  tabela.innerHTML = "";
  tabelaContainer.classList.remove("d-none");

  const snap = await db.collection("relatorios").orderBy("dataEnvio", "desc").get();
  if (snap.empty) {
    tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum relatório encontrado.</td></tr>`;
    return;
  }

  snap.forEach(doc => {
    const rel = doc.data();
    const id = doc.id;
    const tr = document.createElement("tr");

    let anexosHTML = "";
    if (rel.anexos && rel.anexos.length > 0) {
      anexosHTML = rel.anexos.map((url, i) =>
        `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-secondary me-1 mb-1">Anexo ${i + 1}</a>`
      ).join("<br>");
    }

    tr.innerHTML = `
      <td>${rel.turmaNome}</td>
      <td>${rel.data}</td>
      <td>${rel.atividades}</td>
      <td>${rel.observacoes || '-'}</td>
      <td>
        ${anexosHTML}
        <button class="btn btn-sm btn-outline-danger mt-1" onclick="excluirRelatorio('${id}')">Excluir</button>
        <button class="btn btn-sm btn-outline-dark mt-1" onclick="imprimirRelatorio(this)">Imprimir</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

window.excluirRelatorio = async function (id) {
  if (confirm("Deseja excluir este relatório?")) {
    await db.collection("relatorios").doc(id).delete();
    listarRelatorios();
  }
};

window.imprimirRelatorio = function (btn) {
  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");

  const conteudo = `
    <html>
      <head>
        <title>Relatório Mensal</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h2 { color: #3f2723; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 12px; border: 1px solid #ccc; }
          th { background: #eee; padding: 8px 12px; text-align: left; }
        </style>
      </head>
      <body>
        <h2>Relatório Mensal da Turma</h2>
        <table>
          <tr><th>Turma</th><td>${tds[0].innerText}</td></tr>
          <tr><th>Mês</th><td>${tds[1].innerText}</td></tr>
          <tr><th>Atividades</th><td>${tds[2].innerText}</td></tr>
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

document.addEventListener("DOMContentLoaded", () => {
  carregarTurmas();
  listarRelatorios();
});
