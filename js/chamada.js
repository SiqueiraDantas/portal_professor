const db = firebase.firestore();

const formFiltro = document.getElementById("formFiltro");
const formChamada = document.getElementById("formChamada");
const turmaFiltro = document.getElementById("turmaFiltro");
const dataFiltro = document.getElementById("dataFiltro");
const tabelaChamada = document.getElementById("tabelaChamada");
const msgSucesso = document.getElementById("msgSucesso");

document.addEventListener("DOMContentLoaded", async () => {
  const snap = await db.collection("turmas").orderBy("oficina").get();
  snap.forEach(doc => {
    const turma = doc.data();
    if (turma.oficina) {
      turmaFiltro.appendChild(new Option(turma.oficina, turma.oficina));
    }
  });
});

formFiltro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const turma = turmaFiltro.value;
  const data = dataFiltro.value;

  if (!turma || !data) {
    alert("Selecione uma turma e a data.");
    return;
  }

  const alunosSnap = await db.collection("alunos")
    .where("turma", "==", turma)
    .orderBy("nome")
    .get();

  tabelaChamada.innerHTML = "";

  if (alunosSnap.empty) {
    alert("Nenhum aluno encontrado para esta turma.");
    formChamada.classList.add("d-none");
    return;
  }

  alunosSnap.forEach(doc => {
    const aluno = doc.data();
    const alunoId = doc.id;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <div class="aluno-info d-flex align-items-center gap-2">
          ${aluno.fotoURL ? `<img src="${aluno.fotoURL}" class="foto-aluno" alt="Foto de ${aluno.nome}" style="width:40px;height:40px;border-radius:50%;">` : `<span class="text-muted fst-italic">Sem foto</span>`}
          <span>${aluno.nome}</span>
        </div>
      </td>
      <td>
        <select class="form-select" name="status-${alunoId}">
          <option value="presente">Presente</option>
          <option value="falta">Falta</option>
          <option value="justificada">Justificada</option>
        </select>
        <input type="file" accept="image/*,.pdf" class="form-control mt-2 d-none" name="anexo-${alunoId}" />
      </td>
    `;

    const select = tr.querySelector(`select[name="status-${alunoId}"]`);
    const inputFile = tr.querySelector(`input[name="anexo-${alunoId}"]`);

    select.addEventListener("change", () => {
      if (select.value === "justificada") {
        inputFile.classList.remove("d-none");
      } else {
        inputFile.classList.add("d-none");
      }
    });

    tabelaChamada.appendChild(tr);
  });

  formChamada.classList.remove("d-none");
});

formChamada.addEventListener("submit", async (e) => {
  e.preventDefault();

  const turma = turmaFiltro.value;
  const data = dataFiltro.value;
  const selects = tabelaChamada.querySelectorAll("select");
  const btnSalvar = formChamada.querySelector("button[type='submit']");

  btnSalvar.disabled = true;
  btnSalvar.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Salvando...`;

  try {
    const registros = [];
    const presencas = [];
    const justificadas = [];

    for (const select of selects) {
      const alunoId = select.name.split("status-")[1];
      const status = select.value;

      const alunoDoc = await db.collection("alunos").doc(alunoId).get();
      const alunoData = alunoDoc.data();
      const oficina = alunoData.turma || "";

      registros.push({ alunoId, turma, oficina, data, status });

      if (status === "presente") {
        presencas.push(alunoId);
      }

      if (status === "justificada") {
        const input = tabelaChamada.querySelector(`input[name="anexo-${alunoId}"]`);
        let anexoURL = "";

        if (input?.files.length > 0) {
          const file = input.files[0];
          const storageRef = firebase.storage().ref();
          const fileRef = storageRef.child(`atestados/${turma}_${data}_${alunoId}_${file.name}`);
          await fileRef.put(file);
          anexoURL = await fileRef.getDownloadURL();
        }

        justificadas.push({
          id: alunoId,
          anexo: anexoURL || ""
        });
      }
    }

    // Salva tudo em batch
    const batch = db.batch();

    registros.forEach(r => {
      const ref = db.collection("chamadas").doc();
      batch.set(ref, r);
    });

    const frequenciaRef = db.collection("frequencias").doc(`${turma}_${data}`);
    batch.set(frequenciaRef, {
      data,
      oficina: turma,
      presencas,
      justificadas
    });

    await batch.commit();

    msgSucesso.innerHTML = "✅ Chamada registrada com sucesso!";
    msgSucesso.classList.remove("d-none", "alert-danger");
    msgSucesso.classList.add("alert-success");

    formChamada.classList.add("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      msgSucesso.classList.add("d-none");
      msgSucesso.innerHTML = "";
    }, 3500);

  } catch (error) {
    console.error("Erro ao registrar chamada:", error);
    msgSucesso.innerHTML = "❌ Erro ao registrar a chamada.";
    msgSucesso.classList.remove("d-none", "alert-success");
    msgSucesso.classList.add("alert-danger");
  }

  btnSalvar.disabled = false;
  btnSalvar.textContent = "Salvar Chamada";
});
