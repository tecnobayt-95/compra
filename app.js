import { iniciarAcceso } from "./auth.js";
import { montarProductos } from "./productos.js";
import { montarLista } from "./lista.js";
import { montarInicio, montarGastos } from "./resumen.js";
import { montarAjustes, aplicarLetra } from "./ajustes.js";

aplicarLetra();

// Lista de módulos. Para quitar una función, borra o comenta su línea.
const modulos = [
  { id: "inicio",    nombre: "Inicio", montar: montarInicio },
  { id: "lista",     nombre: "Lista", montar: montarLista },
  { id: "productos", nombre: "Productos", montar: montarProductos },
  { id: "despensa",  nombre: "Despensa",  vacio: ["La despensa está vacía", "Aquí verás lo que hay en casa y cuándo caduca."] },
  { id: "gastos",    nombre: "Gastos", montar: montarGastos },
  { id: "garantias", nombre: "Garantías", vacio: ["Sin garantías guardadas", "Guarda tickets y fechas de garantía."] },
  { id: "ajustes",   nombre: "Ajustes", montar: montarAjustes }
];

const menu = document.getElementById("menu");
const vista = document.getElementById("vista");
const titulo = document.getElementById("titulo");
let usuarioActual = null, limpiar = null;

menu.innerHTML = modulos.map(m => `<a href="#${m.id}" data-id="${m.id}">${m.nombre}</a>`).join("");

function soltar() { if (limpiar) { limpiar(); limpiar = null; } }

function pintar() {
  soltar();
  const id = location.hash.slice(1) || modulos[0].id;
  const m = modulos.find(x => x.id === id) || modulos[0];
  titulo.textContent = m.nombre;
  menu.querySelectorAll("a").forEach(a => {
    if (a.dataset.id === m.id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  if (m.montar) { limpiar = m.montar(vista, usuarioActual); return; }
  vista.innerHTML = `<div class="tarjeta vacio"><strong>${m.vacio[0]}</strong>${m.vacio[1]}` +
    (m.boton ? `<br><button class="btn" type="button">${m.boton}</button>` : "") + `</div>`;
}

addEventListener("hashchange", () => { if (usuarioActual) pintar(); });

iniciarAcceso(
  usuario => { usuarioActual = usuario; pintar(); },
  () => { soltar(); usuarioActual = null; vista.innerHTML = ""; }
);
