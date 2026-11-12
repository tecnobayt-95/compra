import { db } from "./firebase-config.js";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const COMO = ["En tienda física", "Online", "Aplicación", "Otro"];
const CATEGORIAS = ["Alimentación", "Limpieza e higiene", "Hogar", "Tecnología", "Ropa", "Otros"];
const MAX_FOTOS = 3;

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const opciones = (lista, sel) => lista.map(o => `<option${o === sel ? " selected" : ""}>${o}</option>`).join("");
const hoy = () => new Date().toISOString().slice(0, 10);

function haceCuanto(iso) {
  if (!iso) return "";
  const dias = Math.round((new Date().setHours(0, 0, 0, 0) - new Date(iso + "T00:00:00")) / 86400000);
  if (dias < 0) return "fecha futura";
  if (dias === 0) return "hoy";
  if (dias === 1) return "ayer";
  if (dias < 14) return `hace ${dias} días`;
  if (dias < 60) return `hace ${Math.floor(dias / 7)} semanas`;
  if (dias < 365) return `hace ${Math.floor(dias / 30)} meses`;
  const a = Math.floor(dias / 365);
  return `hace ${a} ${a === 1 ? "año" : "años"}`;
}

// Reduce la foto para que quepa en Firestore (máx. ~225 KB por foto)
function comprimir(file) {
  return new Promise((ok, fallo) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, 800 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.7, out = c.toDataURL("image/jpeg", q);
      while (out.length > 300000 && q > 0.3) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
      ok(out);
    };
    img.onerror = () => fallo(new Error("imagen"));
    img.src = url;
  });
}

export function montarProductos(cont, usuario) {
  let productos = [], editId = null, fotos = [];

  cont.innerHTML = `
    <div class="barra">
      <input id="pBuscar" type="search" placeholder="Buscar producto o tienda" aria-label="Buscar">
      <select id="pFiltro" aria-label="Filtrar por estado">
        <option value="">Todos</option><option value="comprado">Comprados</option><option value="pendiente">Pendientes</option>
      </select>
      <button class="btn" id="pNuevo" type="button">Añadir producto</button>
    </div>
    <p id="pAviso" class="error"></p>
    <div id="pRejilla" class="rejilla"></div>
    <dialog id="pDialogo"><form id="pForm">
      <h2 id="pTitulo">Nuevo producto</h2>
      <label for="fNombre">Nombre del producto</label>
      <input id="fNombre" required maxlength="80">
      <div class="fila">
        <div><label for="fEstado">Estado</label>
          <select id="fEstado"><option value="comprado">Ya comprado</option><option value="pendiente">Pendiente de comprar</option></select></div>
        <div id="fFechaCaja"><label for="fFecha">Fecha de compra</label><input id="fFecha" type="date"></div>
      </div>
      <div class="fila">
        <div><label for="fTienda">Dónde</label><input id="fTienda" maxlength="60" placeholder="Tienda o web"></div>
        <div><label for="fComo">Cómo</label><select id="fComo">${opciones(COMO)}</select></div>
      </div>
      <div class="fila">
        <div><label for="fCant">Cantidad</label><input id="fCant" type="number" min="1" step="1" value="1" inputmode="numeric"></div>
        <div><label for="fPrecio">Precio total (€)</label><input id="fPrecio" type="number" min="0" step="0.01" inputmode="decimal"></div>
      </div>
      <label for="fCat">Categoría</label><select id="fCat">${opciones(CATEGORIAS)}</select>
      <label for="fNotas">Notas</label>
      <textarea id="fNotas" rows="2" maxlength="300"></textarea>
      <label for="fFotos">Fotos (hasta ${MAX_FOTOS})</label>
      <input id="fFotos" type="file" accept="image/*" multiple>
      <div id="fActuales" class="fotos-act"></div>
      <p id="fError" class="error" role="alert"></p>
      <div class="botones">
        <button class="btn btn-sec" type="button" id="fCancelar">Cancelar</button>
        <button class="btn" type="submit" id="fGuardar">Guardar</button>
      </div>
    </form></dialog>`;

  const $ = id => cont.querySelector("#" + id);
  const dlg = $("pDialogo");

  function pintarFotos() {
    $("fActuales").innerHTML = fotos.map((f, i) =>
      `<div><img src="${f}" alt="Foto ${i + 1}"><button type="button" class="mini" data-q="${i}">Quitar</button></div>`).join("");
  }
  const alternarFecha = () => { $("fFechaCaja").hidden = $("fEstado").value !== "comprado"; };

  function abrir(p) {
    editId = p ? p.id : null;
    $("pTitulo").textContent = p ? "Editar producto" : "Nuevo producto";
    $("fNombre").value = p?.nombre ?? "";
    $("fEstado").value = p?.estado ?? "comprado";
    $("fFecha").value = p?.fecha ?? hoy();
    $("fTienda").value = p?.tienda ?? "";
    $("fComo").value = p?.como ?? COMO[0];
    $("fPrecio").value = p?.precio ?? "";
    $("fCant").value = p?.cantidad ?? 1;
    $("fCat").value = p?.categoria ?? CATEGORIAS[0];
    $("fNotas").value = p?.notas ?? "";
    $("fFotos").value = "";
    $("fError").textContent = "";
    fotos = [...(p?.fotos ?? [])];
    pintarFotos(); alternarFecha();
    dlg.showModal();
  }

  function pintarLista() {
    const txt = $("pBuscar").value.trim().toLowerCase();
    const est = $("pFiltro").value;
    const lista = productos
      .filter(p => (!est || p.estado === est) &&
        (!txt || `${p.nombre} ${p.tienda}`.toLowerCase().includes(txt)))
      .sort((a, b) => b.creado - a.creado);
    if (!lista.length) {
      $("pRejilla").innerHTML = `<div class="tarjeta vacio" style="grid-column:1/-1"><strong>${productos.length ? "Nada coincide con la búsqueda" : "Todavía no hay productos"}</strong>${productos.length ? "Prueba con otro nombre." : "Pulsa «Añadir producto» para registrar el primero."}</div>`;
      return;
    }
    $("pRejilla").innerHTML = lista.map(p => {
      const datos = [p.tienda, p.como, p.categoria].filter(Boolean).map(esc).join(" · ");
      const precio = p.precio !== "" && p.precio != null
        ? Number(p.precio).toLocaleString("es-ES", { minimumFractionDigits: 2 }) + " €" : "";
      return `<article class="prod">
        ${p.fotos?.[0] ? `<img src="${p.fotos[0]}" alt="Foto de ${esc(p.nombre)}">` : `<div class="sinfoto">Sin foto</div>`}
        <div class="prod-info">
          <h2>${esc(p.nombre)}</h2>
          <span class="estado ${p.estado}">${p.estado === "comprado" ? "Comprado" : "Pendiente"}</span>
          ${datos ? `<p>${datos}</p>` : ""}
          ${p.cantidad ? `<p>Cantidad: ${esc(p.cantidad)}</p>` : ""}
          ${p.estado === "comprado" ? `<p>${haceCuanto(p.fecha)}${precio ? " · " + precio : ""}</p>` : (precio ? `<p>${precio}</p>` : "")}
          ${p.notas ? `<p>${esc(p.notas)}</p>` : ""}
          <p>Añadido por ${esc((p.comprador || "").split("@")[0])}</p>
          <div class="acciones">
            <button type="button" data-ed="${p.id}">Editar</button>
            <button type="button" class="borrar" data-bo="${p.id}">Borrar</button>
          </div>
        </div></article>`;
    }).join("");
  }

  $("pNuevo").onclick = () => abrir(null);
  $("fCancelar").onclick = () => dlg.close();
  $("fEstado").onchange = alternarFecha;
  $("pBuscar").oninput = pintarLista;
  $("pFiltro").onchange = pintarLista;
  $("fActuales").onclick = e => {
    if (e.target.dataset.q !== undefined) { fotos.splice(+e.target.dataset.q, 1); pintarFotos(); }
  };
  $("pRejilla").onclick = async e => {
    const ed = e.target.dataset.ed, bo = e.target.dataset.bo;
    if (ed) abrir(productos.find(p => p.id === ed));
    if (bo && confirm("¿Seguro que quieres borrar este producto?")) {
      try { await deleteDoc(doc(db, "productos", bo)); }
      catch { $("pAviso").textContent = "No se ha podido borrar."; }
    }
  };

  $("pForm").onsubmit = async e => {
    e.preventDefault();
    const err = $("fError"), btn = $("fGuardar");
    err.textContent = "";
    const nuevas = [...$("fFotos").files];
    if (fotos.length + nuevas.length > MAX_FOTOS) {
      err.textContent = `Máximo ${MAX_FOTOS} fotos por producto.`; return;
    }
    btn.disabled = true; btn.textContent = "Guardando...";
    try {
      for (const f of nuevas) fotos.push(await comprimir(f));
      const estado = $("fEstado").value;
      const datos = {
        nombre: $("fNombre").value.trim(),
        estado,
        fecha: estado === "comprado" ? $("fFecha").value : "",
        tienda: $("fTienda").value.trim(),
        como: $("fComo").value,
        cantidad: $("fCant").value || "1",
        precio: $("fPrecio").value,
        categoria: $("fCat").value,
        notas: $("fNotas").value.trim(),
        fotos
      };
      if (editId) await updateDoc(doc(db, "productos", editId), datos);
      else await addDoc(collection(db, "productos"), { ...datos, comprador: usuario.email, creado: Date.now() });
      dlg.close();
    } catch (ex) {
      err.textContent = "No se ha podido guardar. Comprueba la conexión y las reglas de Firestore.";
    } finally {
      btn.disabled = false; btn.textContent = "Guardar";
    }
  };

  const parar = onSnapshot(collection(db, "productos"),
    snap => { productos = snap.docs.map(d => ({ id: d.id, ...d.data() })); pintarLista(); },
    () => { $("pAviso").textContent = "No se pueden leer los datos. Revisa las reglas de Firestore."; });

  return parar; // se llama al salir de la sección
}
