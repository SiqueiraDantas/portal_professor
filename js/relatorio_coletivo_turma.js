const db = firebase.firestore();
const tabela = document.getElementById("tabelaRelatorios");

async function listarRelatorios() {
  const snap = await db.collection("relatorios").orderBy("dataEnvio", "desc").get();
  tabela.innerHTML = "";

  if (snap.empty) {
    tabela.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Nenhum relatório encontrado.</td></tr>`;
    return;
  }

  snap.forEach(doc => {
    const rel = doc.data();
    const id = doc.id;

    const tr = document.createElement("tr");

    // Botões de anexo, se houver
    let anexosHTML = "";
    if (rel.anexos && rel.anexos.length > 0) {
      anexosHTML = rel.anexos.map((url, i) =>
        `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-secondary btn-acao">Anexo ${i + 1}</a>`
      ).join("");
    }

    tr.innerHTML = `
      <td>${rel.turmaNome}</td>
      <td contenteditable="false">${rel.data}</td>
      <td contenteditable="false">${rel.atividades}</td>
      <td contenteditable="false">${rel.observacoes || '-'}</td>
      <td>
        ${anexosHTML}
        <button class="btn btn-sm btn-outline-primary btn-acao" onclick="editarLinha(this)">Editar</button>
        <button class="btn btn-sm btn-outline-success btn-acao d-none" onclick="concluirEdicao(this, '${id}')">Concluir</button>
        <button class="btn btn-sm btn-outline-danger btn-acao" onclick="excluirRelatorio('${id}')">Excluir</button>
        <button class="btn btn-sm btn-outline-dark btn-acao" onclick="imprimirRelatorio(this)">Imprimir</button>
        <button class="btn btn-sm btn-outline-success btn-acao" onclick="assinarRelatorio(this)">Assinar</button>
      </td>
    `;
    tabela.appendChild(tr);
  });
}

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
    data: tds[1].innerText.trim(),
    atividades: tds[2].innerText.trim(),
    observacoes: tds[3].innerText.trim()
  };

  await db.collection("relatorios").doc(id).update(atualizado);

  linha.querySelectorAll("td").forEach(td => td.setAttribute("contenteditable", "false"));
  btn.classList.add("d-none");
  linha.querySelector(".btn-outline-primary").classList.remove("d-none");
};

window.excluirRelatorio = async function (id) {
  if (confirm("Deseja excluir este relatório?")) {
    await db.collection("relatorios").doc(id).delete();
    listarRelatorios();
  }
};

window.imprimirRelatorio = function (btn) {
  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");

  const html = `
    <html>
      <head>
        <title>Relatório</title>
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
          <tr><th>Data</th><td>${tds[1].innerText}</td></tr>
          <tr><th>Atividades</th><td>${tds[2].innerText}</td></tr>
          <tr><th>Observações</th><td>${tds[3].innerText}</td></tr>
        </table>
        <script>window.print()</script>
      </body>
    </html>
  `;

  const win = window.open('', '', 'width=800,height=600');
  win.document.write(html);
  win.document.close();
};

window.assinarRelatorio = function (btn) {
  const linha = btn.closest("tr");
  const tds = linha.querySelectorAll("td");

  const html = `
    <html>
      <head>
        <title>Relatório Assinado</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; }
          h2 { color: #3f2723; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 8px 12px; border: 1px solid #ccc; }
          th { background: #eee; padding: 8px 12px; text-align: left; }
          .assinatura {
            margin-top: 60px;
            text-align: center;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <h2>Relatório Mensal da Turma</h2>
        <table>
          <tr><th>Turma</th><td>${tds[0].innerText}</td></tr>
          <tr><th>Data</th><td>${tds[1].innerText}</td></tr>
          <tr><th>Atividades</th><td>${tds[2].innerText}</td></tr>
          <tr><th>Observações</th><td>${tds[3].innerText}</td></tr>
        </table>
        <div class="assinatura">
          <p>______________________________</p>
          <p>Francisco Siqueira Dantas Júnior<br>Diretor da Escola de Música de Madalena</p>
        </div>
        <script>window.print()</script>
      </body>
    </html>
  `;

  const win = window.open('', '', 'width=800,height=600');
  win.document.write(html);
  win.document.close();
};

document.addEventListener("DOMContentLoaded", listarRelatorios);
