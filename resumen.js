import { db } from "./firebase-config.js";
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const esc = s => String(s ?? "").replace(/[&<>"']/g,
  c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const eur = n => n.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const num = p => Number(p.precio) || 0;
const escuchar = (nombre, fn) =>
  onSnapshot(collection(db, nombre), s => fn(s.docs.map(d => ({ id: d.id, ...d.data() }))));

export function montarInicio(cont) {
  let prods = [], lista = [];
  const pintar = () => {
    const mes = new Date().toISOString().slice(0, 7);
    const comp = prods.filter(p => p.estado === "comprado");
    const delMes = comp.filter(p => (p.fecha || "").startsWith(mes));
    const ult = [...comp].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")).slice(0, 5);
    cont.innerHTML = `<div class="cifras">
      <div class="tarjeta"><b>${eur(delMes.reduce((s, p) => s + num(p), 0))}</b><span>Gastado este mes</span></div>
      <div class="tarjeta"><b>${delMes.length}</b><span>Compras este mes</span></div>
      <div class="tarjeta"><b>${lista.filter(i => !i.hecho).length}</b><span>En la lista</span></div>
      <div class="tarjeta"><b>${prods.filter(p => p.estado === "pendiente").length}</b><span>Productos pendientes</span></div>
    </div><h2 class="sub">Últimas compras</h2>` + (ult.length
      ? `<div class="tarjeta">${ult.map(p => `<p class="fila-r"><span>${esc(p.nombre)}${p.tienda ? " · " + esc(p.tienda) : ""}</span><span>${esc(p.fecha)}</span></p>`).join("")}</div>`
      : `<div class="tarjeta vacio"><strong>Aún no hay compras</strong>Registra productos en la sección Productos.</div>`);
  };
  const a = escuchar("productos", d => { prods = d; pintar(); });
  const b = escuchar("lista", d => { lista = d; pintar(); });
  return () => { a(); b(); };
}

export function montarGastos(cont) {
  const barras = (titulo, mapa, cron) => {
    const e = cron ? [...mapa].sort().slice(-6) : [...mapa].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = Math.max(1, ...e.map(x => x[1]));
    return `<h2 class="sub">${titulo}</h2><div class="tarjeta">` + (e.length
      ? e.map(([k, v]) => `<div class="gbar"><span>${esc(k)}</span><div><i style="width:${Math.max(2, v / max * 100)}%"></i></div><b>${eur(v)}</b></div>`).join("")
      : `<span class="vacio">Sin datos todavía</span>`) + `</div>`;
  };
  return escuchar("productos", prods => {
    const comp = prods.filter(p => p.estado === "comprado" && num(p) > 0);
    const suma = f => { const m = new Map(); comp.forEach(p => { const k = f(p) || "Sin indicar"; m.set(k, (m.get(k) || 0) + num(p)); }); return m; };
    cont.innerHTML = `<div class="tarjeta"><b class="grande">${eur(comp.reduce((s, p) => s + num(p), 0))}</b><br><span class="vacio">Total registrado</span></div>`
      + barras("Por mes", suma(p => (p.fecha || "").slice(0, 7)), true)
      + barras("Por tienda", suma(p => p.tienda))
      + barras("Por categoría", suma(p => p.categoria));
  });
}
