import { db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, writeBatch }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function montarLista(cont, usuario) {
  let items = [];
  cont.innerHTML = `
    <form id="lForm" class="barra">
      <input id="lNombre" placeholder="Qué falta por comprar" required maxlength="80" aria-label="Producto">
      <input id="lCant" placeholder="Cantidad" maxlength="20" style="flex:0 1 120px" aria-label="Cantidad">
      <button class="btn" type="submit">Añadir</button>
    </form>
    <p id="lAviso" class="error"></p>
    <div id="lItems"></div>
    <button id="lLimpiar" class="btn btn-sec" type="button" hidden>Quitar lo marcado</button>`;
  const $ = id => cont.querySelector("#" + id);

  const pintar = () => {
    const ord = [...items].sort((a, b) => (a.hecho - b.hecho) || (b.creado - a.creado));
    $("lItems").innerHTML = ord.length ? ord.map(i => `
      <div class="item${i.hecho ? " hecho" : ""}">
        <label><input type="checkbox" data-id="${i.id}"${i.hecho ? " checked" : ""}>
          <span>${esc(i.nombre)}${i.cantidad ? " <small>(" + esc(i.cantidad) + ")</small>" : ""}</span></label>
        <button class="mini" type="button" data-bo="${i.id}">Quitar</button>
      </div>`).join("")
      : `<div class="tarjeta vacio"><strong>La lista está vacía</strong>Añade lo que falta por comprar.</div>`;
    $("lLimpiar").hidden = !items.some(i => i.hecho);
  };

  $("lForm").onsubmit = async e => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "lista"), { nombre: $("lNombre").value.trim(), cantidad: $("lCant").value.trim(),
        hecho: false, por: usuario.email, creado: Date.now() });
      e.target.reset(); $("lNombre").focus();
    } catch { $("lAviso").textContent = "No se ha podido añadir."; }
  };
  $("lItems").onchange = e => { if (e.target.dataset.id) updateDoc(doc(db, "lista", e.target.dataset.id), { hecho: e.target.checked }); };
  $("lItems").onclick = e => { if (e.target.dataset.bo) deleteDoc(doc(db, "lista", e.target.dataset.bo)); };
  $("lLimpiar").onclick = async () => {
    const b = writeBatch(db);
    items.filter(i => i.hecho).forEach(i => b.delete(doc(db, "lista", i.id)));
    await b.commit();
  };
  return onSnapshot(collection(db, "lista"),
    s => { items = s.docs.map(d => ({ id: d.id, ...d.data() })); pintar(); },
    () => { $("lAviso").textContent = "No se pueden leer los datos."; });
}
