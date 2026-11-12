import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const TAM = { normal: "18px", grande: "21px", muygrande: "24px" };

export function aplicarLetra() {
  try { document.documentElement.style.setProperty("--letra", TAM[localStorage.getItem("letra")] || TAM.normal); } catch { /* sin almacenamiento */ }
}

export function montarAjustes(cont) {
  cont.innerHTML = `
    <div class="tarjeta"><h2 class="sub" style="margin-top:0">Tamaño de letra</h2>
      <div class="botones">
        <button class="btn btn-sec" type="button" data-t="normal">Normal</button>
        <button class="btn btn-sec" type="button" data-t="grande">Grande</button>
        <button class="btn btn-sec" type="button" data-t="muygrande">Muy grande</button>
      </div></div>
    <div class="tarjeta" style="margin-top:1rem"><h2 class="sub" style="margin-top:0">Copia de seguridad</h2>
      <p class="vacio">Descarga todos los productos en un archivo que se abre con Excel.</p>
      <button class="btn" id="aCsv" type="button">Descargar CSV</button></div>`;
  cont.onclick = async e => {
    const t = e.target.dataset.t;
    if (t) { try { localStorage.setItem("letra", t); } catch { /* ignorar */ } aplicarLetra(); }
    if (e.target.id === "aCsv") {
      const s = await getDocs(collection(db, "productos"));
      const cab = ["nombre", "estado", "fecha", "tienda", "como", "precio", "categoria", "notas", "comprador"];
      const f = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const filas = s.docs.map(d => cab.map(c => f(d.data()[c])).join(";"));
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob(["\ufeff" + [cab.join(";"), ...filas].join("\n")], { type: "text/csv" }));
      a.download = "compra.csv"; a.click();
    }
  };
}
