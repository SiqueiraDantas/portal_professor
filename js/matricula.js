const db = firebase.firestore();

const escolas = [
  "CEI José Alzir Silva Lima",
  "CEI José Hermínio Rodrigues do Nascimento",
  "CEI Mãe Toinha",
  "CEI Maria da Conceição Barros Pinho",
  "CEI Maria de Lourdes Bezerra Costa",
  "CEI Maria Mirtes Costa Salgado",
  "CEI Sara Rosita Ferreira",
  "CEI Terezinha Mariano Germano",
  "EEF 25 de Maio I",
  "EEF Álvaro de Araújo Carneiro",
  "EEF Dau Alberto",
  "EEF Francisco Correia Lima",
  "EEF João Costa",
  "EEF José Severo de Pinho",
  "EEF Margarida Alves",
  "EEF Padre Jaime Felício",
  "EEF Paula Queiroz",
  "EEF Vicente Patrício de Almeida",
  "EEIF Antonio Alves da Silva",
  "EEIF Comunidade Pau Ferros",
  "EEIF Damião Carneiro",
  "EEIF Eliônia Campos",
  "IEST Santa Teresinha Instituto Educacional",
  "EEEP Joao Jackson Lobo Guerra",
  "EEEP Venceslau Vieira Batista",
  "EEM Alfredo Machado",
  "IFCE Campus Boa Viagem"
];

function gerarMatricula() {
  const ano = new Date().getFullYear();
  const mes = new Date().getMonth() + 1;
  const semestre = mes <= 6 ? 'A' : 'B';
  const codigo = Math.floor(1000 + Math.random() * 9000);
  return `${ano}${semestre}EMM${codigo}`;
}

function preencherEscolas() {
  const select = document.getElementById("escola");
  escolas.forEach(nome => {
    const opt = document.createElement("option");
    opt.value = nome;
    opt.textContent = nome;
    select.appendChild(opt);
  });
}

function preencherTurmas() {
  const select = document.getElementById("turma");
  db.collection("turmas").get().then(snapshot => {
    snapshot.forEach(doc => {
      const turma = doc.data();
      const opt = document.createElement("option");
      opt.value = turma.oficina;
      opt.textContent = turma.oficina;
      select.appendChild(opt);
    });
    // Atualiza o selectpicker após adicionar os itens
    $('.selectpicker').selectpicker('refresh');
  });
}

async function verificarCpfDuplicado(cpf) {
  const snapshot = await db.collection("alunos")
    .where("cpf", "==", cpf.trim())
    .get();
  return !snapshot.empty;
}

async function comprimirImagem(file, maxLargura = 800, qualidade = 0.7) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = (evento) => {
      const imagem = new Image();
      imagem.onload = () => {
        const canvas = document.createElement("canvas");
        const proporcao = maxLargura / imagem.width;
        canvas.width = maxLargura;
        canvas.height = imagem.height * proporcao;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(imagem, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error("Erro ao comprimir imagem"));
        }, "image/jpeg", qualidade);
      };
      imagem.src = evento.target.result;
    };
    leitor.readAsDataURL(file);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  $('.selectpicker').selectpicker(); // Inicializa todos os selects com bootstrap-select
  preencherEscolas();
  preencherTurmas();

  const form = document.getElementById("formMatricula");
  const sucesso = document.getElementById("sucesso");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const botao = form.querySelector("button[type='submit']");
    botao.disabled = true;
    botao.innerText = "Salvando...";

    const nome = document.getElementById("nome").value;
    const idade = parseInt(document.getElementById("idade").value);
    const cpf = document.getElementById("cpf").value;
    const genero = document.getElementById("genero").value;
    const raca = document.getElementById("raca").value;
    const religiao = document.getElementById("religiao").value;
    const escola = document.getElementById("escola").value;
    const redeEnsino = document.getElementById("redeEnsino").value;
    const fotoFile = document.getElementById("fotoAluno").files[0];

    const turma = $('#turma').val(); // Captura múltiplos selecionados como array
    const programasSociais = $('#programas').val(); // Também múltiplos

    const familia = parseInt(document.getElementById("familia").value);

    const responsavel = {
      nome: document.getElementById("respNome").value,
      telefone: document.getElementById("respTelefone").value,
      email: document.getElementById("respEmail").value
    };

    const duplicado = await verificarCpfDuplicado(cpf);
    if (duplicado) {
      alert("Este CPF já está cadastrado!");
      botao.disabled = false;
      botao.innerText = "Salvar Matrícula";
      return;
    }

    try {
      const matricula = gerarMatricula();

      let fotoURL = "";
      if (fotoFile) {
        const imagemComprimida = await comprimirImagem(fotoFile);
        const storageRef = firebase.storage().ref();
        const fotoRef = storageRef.child(`fotos_alunos/${matricula}_${fotoFile.name}`);
        await fotoRef.put(imagemComprimida);
        fotoURL = await fotoRef.getDownloadURL();
      }

      await db.collection("alunos").add({
        matricula,
        nome,
        idade,
        cpf,
        genero,
        raca,
        religiao,
        escola,
        redeEnsino,
        turma,
        fotoURL,
        responsavel,
        programasSociais,
        familia
      });

      sucesso.classList.remove("d-none");
      form.reset();
      $('.selectpicker').selectpicker('refresh');

    } catch (error) {
      console.error("Erro ao salvar matrícula:", error);
      alert("Erro ao salvar a matrícula. Verifique os dados e tente novamente.");
    } finally {
      botao.disabled = false;
      botao.innerText = "Salvar Matrícula";
    }
  });
});
