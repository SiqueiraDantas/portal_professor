document.addEventListener("DOMContentLoaded", async () => {
  const db = firebase.firestore();
  const tabela = document.getElementById("tabelaCriticas");

  // Define o mês atual
  const hoje = new Date();
  const anoMesAtual = hoje.toISOString().slice(0, 7); // Ex: "2025-05"

  // Busca chamadas do mês atual
  const chamadasSnap = await db.collection("chamadas")
    .where("data", ">=", `${anoMesAtual}-01`)
    .where("data", "<=", `${anoMesAtual}-31`)
    .get();

  // Agrupar ausências por aluno + oficina + turma
  const ausencias = {}; // chave = alunoId + oficina + turma

  chamadasSnap.forEach(doc => {
    const ch = doc.data();
    if (ch.status !== "ausente") return;

    const chave = `${ch.alunoId}_${ch.oficina}_${ch.turma}`;
    if (!ausencias[chave]) {
      ausencias[chave] = {
        alunoId: ch.alunoId,
        oficina: ch.oficina,
        turma: ch.turma,
        totalFaltas: 0
      };
    }
    ausencias[chave].totalFaltas++;
  });

  // Para cada aluno ausente, verificar se faltou 4 vezes ou mais
  for (const chave in ausencias) {
    const info = ausencias[chave];
    if (info.totalFaltas >= 4) {
      const alunoSnap = await db.collection("alunos").doc(info.alunoId).get();
      const aluno = alunoSnap.data();

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${aluno.nome}</td>
        <td>${aluno.matricula || "—"}</td>
        <td>${info.oficina}</td>
        <td>${info.turma}</td>
        <td>${info.totalFaltas}</td>
        <td>—</td>
        <td>⚠️</td>
      `;
      tabela.appendChild(tr);
    }
  }
});
