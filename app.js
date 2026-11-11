import "./firebase-config.js";

// Lista de módulos. Para quitar una función, borra o comenta su línea.
const modulos = [
  { id: "inicio",    nombre: "Inicio",    vacio: ["Aún no hay compras este mes", "Cuando registréis productos, aquí verás el resumen."] },
  { id: "lista",     nombre: "Lista",     vacio: ["La lista está vacía", "Añade lo que falta por comprar."], boton: "Añadir a la lista" },
  { id: "productos", nombre: "Productos", vacio: ["Todavía no hay productos", "Registra el primero con su foto, tienda y fecha."], boton: "Añadir producto" },
  { id: "despensa",  nombre: "Despensa",  vacio: ["La despensa está vacía", "Aquí verás lo que hay en casa y cuándo caduca."] },
  { id: "gastos",    nombre: "Gastos",    vacio: ["Sin gastos registrados", "Indica el precio de los productos para ver el total."] },
  { id: "garantias", nombre: "Garantías", vacio: ["Sin garantías guardadas", "Guarda tickets y fechas de garantía."] },
  { id: "ajustes",   nombre: "Ajustes",   vacio: ["Ajustes", "Tamaño de letra, usuarios y copia de seguridad."] }
];

const menu = document.getElementById("menu");
const vista = document.getElementById("vista");
const titulo = document.getElementById("titulo");

menu.innerHTML = modulos.map(m => `<a href="#${m.id}" data-id="${m.id}">${m.nombre}</a>`).join("");

function pintar() {
  const id = location.hash.slice(1) || modulos[0].id;
  const m = modulos.find(x => x.id === id) || modulos[0];
  titulo.textContent = m.nombre;
  menu.querySelectorAll("a").forEach(a => {
    if (a.dataset.id === m.id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  vista.innerHTML = `<div class="tarjeta vacio"><strong>${m.vacio[0]}</strong>${m.vacio[1]}` +
    (m.boton ? `<br><button class="btn" type="button">${m.boton}</button>` : "") + `</div>`;
}

addEventListener("hashchange", pintar);
pintar();
