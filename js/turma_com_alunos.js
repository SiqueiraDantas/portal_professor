document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const listaTurmas = document.getElementById("listaTurmas");

  try {
    const turmasSnap = await db.collection("turmas").get();
    const alunosSnap = await db.collection("alunos").get();

    const turmas = turmasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const alunos = alunosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (turmas.length === 0) {
      listaTurmas.innerHTML = "<p class='text-muted'>Nenhuma turma cadastrada.</p>";
      return;
    }

    turmas.forEach(turma => {
      const oficina = turma.oficina || "—";
      const turno = turma.turma || "—";
      const horarios = (turma.horarios || []).map(h => `${h.dia}: ${h.hora}`).join("<br>") || "—";

      const alunosDaTurma = alunos.filter(aluno =>
        aluno.oficina === oficina && aluno.turma === turno
      );

      const alunosHTML = alunosDaTurma.length > 0
        ? alunosDaTurma.map(a => `<p>${a.nome} (${a.matricula || "—"})</p>`).join("")
        : "<p class='text-muted'>Nenhum aluno matriculado.</p>";

      const card = document.createElement("div");
      card.className = "card mb-3";

      card.innerHTML = `
        <div class="card-body">
          <h5 class="card-title"><strong>Oficina:</strong> ${oficina}</h5>
          <p class="card-text"><strong>Turno:</strong> ${turno}</p>
          <p class="card-text"><strong>Dias e Horários:</strong><br>${horarios}</p>
          <hr>
          <h6>Alunos Matriculados:</h6>
          ${alunosHTML}
        </div>
      `;

      listaTurmas.appendChild(card);
    });

  } catch (err) {
    console.error("Erro ao carregar turmas ou alunos:", err);
    listaTurmas.innerHTML = "<p class='text-danger'>Erro ao carregar os dados.</p>";
  }
});
