const form = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");

// Garante que o usuário esteja deslogado ao chegar na tela de login
firebase.auth().signOut();

// Login com persistência de sessão (dura só enquanto a aba estiver aberta)
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
    .then(() => {
      return firebase.auth().signInWithEmailAndPassword(email, senha);
    })
    .then(() => {
      const user = firebase.auth().currentUser;
      const emailUsuario = user.email;

      if (emailUsuario.includes("@professor")) {
        // Redireciona para o dashboard e limpa histórico
        window.location.replace("dashboard.html");
      } else if (emailUsuario.includes("@diretor")) {
        // Redireciona para o painel do diretor e limpa histórico
        window.location.replace("diretor.html");
      } else {
        alert("Tipo de usuário não reconhecido. Use um e-mail com @professor ou @diretor.");
        firebase.auth().signOut();
      }
    })
    .catch((error) => {
      console.error("Erro ao fazer login:", error);
      loginError.style.display = "block";
    });
});
