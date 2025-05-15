const db = firebase.firestore();

let dadosEscolas = {};
let dadosFaixaEtaria = { "08 a 10 anos": 0, "11 a 13 anos": 0, "14 a 18 anos": 0 };
let dadosPresenca = {};
let dadosFaltas = {};
let totalAlunos = 0;
let totalFaltas = 0;

const filtroMes = document.getElementById("filtroMes");
const filtroOficina = document.getElementById("filtroOficina");

function limparDados() {
  dadosEscolas = {};
  dadosFaixaEtaria = { "08 a 10 anos": 0, "11 a 13 anos": 0, "14 a 18 anos": 0 };
  dadosPresenca = {};
  dadosFaltas = {};
  totalAlunos = 0;
  totalFaltas = 0;
}

async function carregarKPIs(aplicarFiltro = true) {
  limparDados();

  const mesSelecionado = filtroMes.value;
  const turmaSelecionada = filtroOficina.value;

  const alunosSnap = await db.collection("alunos").get();
  const alunosMap = {};
  let ativos = 0;

  alunosSnap.forEach(doc => {
    const aluno = doc.data();
    alunosMap[doc.id] = aluno;

    if (aplicarFiltro && turmaSelecionada && aluno.turma !== turmaSelecionada) return;

    totalAlunos++;

    if (aluno.escola) {
      dadosEscolas[aluno.escola] = (dadosEscolas[aluno.escola] || 0) + 1;
    }

    if (aluno.nascimento && typeof aluno.nascimento === "string") {
      const faixa = aluno.nascimento.trim();
      if (dadosFaixaEtaria.hasOwnProperty(faixa)) {
        dadosFaixaEtaria[faixa]++;
      }
    }

    if (aluno.status !== "inativo") ativos++;
  });

  const chamadasSnap = await db.collection("chamadas").get();
  chamadasSnap.forEach(doc => {
    const chamada = doc.data();

    if (aplicarFiltro && turmaSelecionada && chamada.turma !== turmaSelecionada) return;

    if (aplicarFiltro && chamada.data) {
      let mes = "";
      if (typeof chamada.data === "string") {
        mes = chamada.data.split("-")[1];
      } else if (typeof chamada.data === "object" && chamada.data.seconds) {
        const dataObj = new Date(chamada.data.seconds * 1000);
        mes = (dataObj.getMonth() + 1).toString().padStart(2, "0");
      }

      if (mes !== mesSelecionado) return;
    }

    const turma = chamada.turma || "Indefinida";
    const status = chamada.status || "falta";

    if (!dadosPresenca[turma]) {
      dadosPresenca[turma] = { total: 0, presencas: 0 };
      dadosFaltas[turma] = 0;
    }

    dadosPresenca[turma].total++;

    if (status === "presente") {
      dadosPresenca[turma].presencas++;
    } else {
      dadosFaltas[turma]++;
      totalFaltas++;
    }
  });

  gerarGraficos();
  preencherResumo(ativos);
}

function gerarGraficos() {
  ["graficoEscolas", "graficoIdade", "graficoPresenca", "graficoFaltas"].forEach(id => {
    const chart = Chart.getChart(id);
    if (chart) chart.destroy();
  });

  new Chart(document.getElementById("graficoEscolas"), {
    type: "bar",
    data: {
      labels: Object.keys(dadosEscolas),
      datasets: [{
        label: "Alunos",
        data: Object.values(dadosEscolas),
        backgroundColor: "#1b4b5f"
      }]
    },
    options: { responsive: true, plugins: { legend: { display: false } } }
  });

  new Chart(document.getElementById("graficoIdade"), {
    type: "pie",
    data: {
      labels: Object.keys(dadosFaixaEtaria),
      datasets: [{
        data: Object.values(dadosFaixaEtaria),
        backgroundColor: ["#f39017", "#1b4b5f", "#3c78b4"]
      }]
    },
    options: { responsive: true, plugins: { legend: { position: "bottom" } } }
  });

  const turmas = Object.keys(dadosPresenca);
  const medias = turmas.map(t => {
    const d = dadosPresenca[t];
    return d.total > 0 ? Math.round((d.presencas / d.total) * 100) : 0;
  });

  new Chart(document.getElementById("graficoPresenca"), {
    type: "bar",
    data: {
      labels: turmas,
      datasets: [{
        label: "% Presença",
        data: medias,
        backgroundColor: "#3c78b4"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, title: { display: true, text: "Presença (%)" } }
      }
    }
  });

  const faltasTurmas = Object.entries(dadosFaltas).sort((a, b) => b[1] - a[1]).slice(0, 5);
  new Chart(document.getElementById("graficoFaltas"), {
    type: "bar",
    data: {
      labels: faltasTurmas.map(e => e[0]),
      datasets: [{
        label: "Faltas",
        data: faltasTurmas.map(e => e[1]),
        backgroundColor: "#8b4513"
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Quantidade" } }
      }
    }
  });
}

function preencherResumo(ativos) {
  const totalPresencas = Object.values(dadosPresenca).reduce((acc, val) => acc + val.presencas, 0);
  const totalRegistros = Object.values(dadosPresenca).reduce((acc, val) => acc + val.total, 0);
  const mediaPresenca = totalRegistros > 0 ? Math.round((totalPresencas / totalRegistros) * 100) : 0;

  document.getElementById("kpiTotalAlunos").textContent = `Alunos: ${totalAlunos}`;
  document.getElementById("kpiMediaPresenca").textContent = `Presença Média: ${mediaPresenca}%`;
  document.getElementById("kpiFaltasTotais").textContent = `Total de Faltas: ${totalFaltas}`;
  document.getElementById("kpiAtivos").textContent = `Ativos: ${ativos}`;
}

function preencherFiltros() {
  const meses = [
    { valor: "01", nome: "Janeiro" }, { valor: "02", nome: "Fevereiro" },
    { valor: "03", nome: "Março" }, { valor: "04", nome: "Abril" },
    { valor: "05", nome: "Maio" }, { valor: "06", nome: "Junho" },
    { valor: "07", nome: "Julho" }, { valor: "08", nome: "Agosto" },
    { valor: "09", nome: "Setembro" }, { valor: "10", nome: "Outubro" },
    { valor: "11", nome: "Novembro" }, { valor: "12", nome: "Dezembro" }
  ];

  const mesAtual = new Date().getMonth() + 1;
  filtroMes.innerHTML = meses.map(m =>
    `<option value="${m.valor}" ${m.valor == mesAtual.toString().padStart(2, "0") ? "selected" : ""}>${m.nome}</option>`
  ).join("");

  db.collection("turmas").get().then(snapshot => {
    let turmas = new Set();
    snapshot.forEach(doc => {
      const dados = doc.data();
      if (dados.oficina) turmas.add(dados.oficina);
    });

    let options = `<option value="">Todas as Oficinas</option>`;
    turmas.forEach(turma => {
      options += `<option value="${turma}">${turma}</option>`;
    });

    filtroOficina.innerHTML = options;
  });
}

function imprimirGrafico(id) {
  const area = document.getElementById(id);
  const canvas = area.querySelector("canvas");
  const titulo = area.querySelector("h5")?.outerHTML || "";

  if (!canvas) return;

  const chartInstance = Chart.getChart(canvas);
  if (!chartInstance) return;

  try {
    const imgData = canvas.toDataURL("image/png");
    const dataAtual = new Date();
    const dataFormatada = dataAtual.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const html = `
      <html>
        <head>
          <title>Impressão</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .topo {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
            }
            .data { font-size: 14px; color: #333; }
            .logo img { max-height: 60px; }
            h5 { color: #1b4b5f; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="topo">
            <div class="data">${dataFormatada}</div>
            <div class="logo"><img src="img/logo_colorida.png" alt="Logo" /></div>
          </div>
          ${titulo}
          <img src="${imgData}" style="display: block; max-width: 90%; margin: 0 auto;" />
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };
  } catch (e) {
    console.error("Erro na impressão:", e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  preencherFiltros();
  carregarKPIs();
});
