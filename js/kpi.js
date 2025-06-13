const db = firebase.firestore();

let dados = {
  raca: {},
  sexo: {},
  redeEnsino: {},
  religiao: {},
  programaSocial: {},
  integrantesFamilia: {},
  escola: {},
  faixaEtaria: { "08 a 10 anos": 0, "11 a 13 anos": 0, "14 a 18 anos": 0 }
};

function limparDados() {
  for (let chave in dados) {
    if (chave === "faixaEtaria") {
      dados[chave] = { "08 a 10 anos": 0, "11 a 13 anos": 0, "14 a 18 anos": 0 };
    } else {
      dados[chave] = {};
    }
  }
}

async function carregarKPIs() {
  limparDados();

  const snapshot = await db.collection("alunos").get();
  snapshot.forEach(doc => {
    const aluno = doc.data();

    // Raça
    if (aluno.raca) {
      dados.raca[aluno.raca] = (dados.raca[aluno.raca] || 0) + 1;
    }

    // Sexo
    if (aluno.sexo) {
      dados.sexo[aluno.sexo] = (dados.sexo[aluno.sexo] || 0) + 1;
    }

    // Rede + Ensino agrupados
    if (aluno.rede && aluno.ensino) {
      const chave = `${aluno.rede} - ${aluno.ensino}`;
      dados.redeEnsino[chave] = (dados.redeEnsino[chave] || 0) + 1;
    }

    // Religião
    if (aluno.religiao) {
      dados.religiao[aluno.religiao] = (dados.religiao[aluno.religiao] || 0) + 1;
    }

    // Programas Sociais
    if (aluno.programaSocial) {
      dados.programaSocial[aluno.programaSocial] = (dados.programaSocial[aluno.programaSocial] || 0) + 1;
    }

    // Integrantes da Família
    if (aluno.familiaIntegrantes) {
      const qtd = aluno.familiaIntegrantes.toString();
      dados.integrantesFamilia[qtd] = (dados.integrantesFamilia[qtd] || 0) + 1;
    }

    // Escola
    if (aluno.escola) {
      dados.escola[aluno.escola] = (dados.escola[aluno.escola] || 0) + 1;
    }

    // Faixa Etária
    if (aluno.nascimento && dados.faixaEtaria.hasOwnProperty(aluno.nascimento)) {
      dados.faixaEtaria[aluno.nascimento]++;
    }
  });

  gerarGraficos();
}

function gerarGraficos() {
  const configuracoes = [
    { id: "graficoRaca", titulo: "Raça", data: dados.raca },
    { id: "graficoSexo", titulo: "Sexo", data: dados.sexo },
    { id: "graficoRedeEnsino", titulo: "Rede e Ensino", data: dados.redeEnsino },
    { id: "graficoReligiao", titulo: "Religião", data: dados.religiao },
    { id: "graficoProgramaSocial", titulo: "Programas Sociais", data: dados.programaSocial },
    { id: "graficoIntegrantesFamilia", titulo: "Integrantes na Família", data: dados.integrantesFamilia },
    { id: "graficoEscola", titulo: "Alunos por Escola", data: dados.escola },
    { id: "graficoFaixaEtaria", titulo: "Faixa Etária", data: dados.faixaEtaria }
  ];

  configuracoes.forEach(cfg => {
    const chart = Chart.getChart(cfg.id);
    if (chart) chart.destroy();

    new Chart(document.getElementById(cfg.id), {
      type: "bar",
      data: {
        labels: Object.keys(cfg.data),
        datasets: [{
          label: cfg.titulo,
          data: Object.values(cfg.data),
          backgroundColor: "#1B4B5F"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: cfg.titulo
          }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  });
}

function imprimirGrafico(id) {
  const area = document.getElementById(id);
  const canvas = area.querySelector("canvas");
  const titulo = area.querySelector("h5")?.outerHTML || "";

  if (!canvas) return;

  const imgData = canvas.toDataURL("image/png");
  const dataAtual = new Date();
  const dataFormatada = dataAtual.toLocaleDateString("pt-BR");

  const html = `
    <html>
      <head>
        <title>Impressão</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .topo {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .logo img { max-height: 60px; }
          h5 { text-align: center; color: #1B4B5F; }
        </style>
      </head>
      <body>
        <div class="topo">
          <div class="data">${dataFormatada}</div>
          <div class="logo"><img src="img/logo_colorida.png" alt="Logo" /></div>
        </div>
        ${titulo}
        <img src="${imgData}" style="max-width: 90%; display: block; margin: auto;" />
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
}

document.addEventListener("DOMContentLoaded", carregarKPIs);
