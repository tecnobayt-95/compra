import { auth } from "./firebase-config.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const mensajes = {
  "auth/invalid-credential": "Correo o clave incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos.",
  "auth/network-request-failed": "No hay conexión a internet."
};

export function iniciarAcceso(alEntrar, alSalir) {
  const acceso = document.getElementById("acceso");
  const app = document.getElementById("app");
  const error = document.getElementById("error");

  document.getElementById("formAcceso").addEventListener("submit", async e => {
    e.preventDefault();
    error.textContent = "";
    try {
      await signInWithEmailAndPassword(auth,
        document.getElementById("correo").value.trim(),
        document.getElementById("clave").value);
    } catch (err) {
      error.textContent = mensajes[err.code] || "No se ha podido entrar. Inténtalo de nuevo.";
    }
  });

  document.getElementById("salir").addEventListener("click", () => signOut(auth));

  onAuthStateChanged(auth, usuario => {
    acceso.hidden = !!usuario;
    app.hidden = !usuario;
    if (usuario) {
      document.getElementById("usuario").textContent = usuario.email;
      document.getElementById("clave").value = "";
      alEntrar(usuario);
    } else {
      alSalir();
    }
  });
}
