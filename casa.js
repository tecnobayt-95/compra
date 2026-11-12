import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const dias = iso => Math.round((new Date(iso + "T00:00:00") - new Date().setHours(0, 0, 0, 0)) / 86400000);

function vista(cont, campo, t, umbral) {
  return onSnapshot(collection(db, "productos"), s => {
    const l = s.docs.map(d => d.data()).filter(p => p.estado === "comprado" && p[campo])
      .sort((a, b) => a[campo].localeCompare(b[campo]));
    cont.innerHTML = l.length ? `<div class="tarjeta">` + l.map(p => {
      const d = dias(p[campo]);
      const est = d < 0 ? `<b class="rojo">${t[0]}</b>`
        : d <= umbral ? `<b class="aviso-a">${t[1]} ${d === 0 ? "hoy" : "en " + d + " días"}</b>`
        : `<span class="vacio">${esc(p[campo])}</span>`;
      return `<p class="fila-r"><span>${esc(p.nombre)}${p.tienda ? " · " + esc(p.tienda) : ""}</span>${est}</p>`;
    }).join("") + `</div>` : `<div class="tarjeta vacio"><strong>${t[2]}</strong>${t[3]}</div>`;
  });
}
export const montarDespensa = c => vista(c, "caduca", ["Caducado", "Caduca", "Nada con fecha de caducidad", "En Productos, rellena «Caduca el» dentro de «Más datos»."], 7);
export const montarGarantias = c => vista(c, "garantia", ["Garantía caducada", "Termina", "Sin garantías guardadas", "En Productos, rellena «Garantía hasta» dentro de «Más datos»."], 30);
