// js/app.js
import {
  login,
  register,
  guardarToken,
  obtenerToken,
  borrarToken,
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "./api-service.js";

// ----------- LOGIN PAGE -----------
if (document.getElementById("loginForm")) {
  document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const res = await login(username, password);
    if (res.token) {
      guardarToken(res.token);
      window.location.href = "../dashboard/index.html";
    } else {
      document.getElementById("loginError").textContent =
        res.error || "Credenciales incorrectas";
      document.getElementById("loginError").style.display = "block";
    }
  });
}
// ----------- REGISTER PAGE -----------
if (document.getElementById("registerForm")) {
  document
    .getElementById("registerForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const res = await register(username, email, password);
      if (res.success) {
        window.location.href = "login.html";
      } else {
        document.getElementById("registerError").textContent =
          res.error || "Datos inválidos";
        document.getElementById("registerError").style.display = "block";
      }
    });
}
// ----------- DASHBOARD PAGE -----------
if (document.getElementById("totalItems")) {
  async function cargarDashboard() {
    const items = await getItems();
    document.getElementById("totalItems").textContent = items.length;
    // Puedes mostrar el nombre del usuario desde el token si lo decodificas
    document.getElementById("username").textContent = "Usuario";
  }
  cargarDashboard();
}
// ----------- ITEMS PAGE -----------
if (document.getElementById("itemsTable")) {
  async function cargarItems() {
    const items = await getItems();
    const tbody = document.querySelector("#itemsTable tbody");
    tbody.innerHTML = "";
    items.forEach((item) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${item.id}</td>
                      <td>${item.nombre}</td>
                      <td>${item.descripcion}</td>
                      <td>
                        <button class='btn btn-sm btn-info editBtn'>Editar</button> 
                        <button class='btn btn-sm btn-danger deleteBtn'>Eliminar</button>
                      </td>`;
      // Eventos CRUD
      tr.querySelector(".editBtn").onclick = () => abrirModal(item);
      tr.querySelector(".deleteBtn").onclick = () => borrar(item.id);
      tbody.appendChild(tr);
    });
  }
  cargarItems();
  // Crear / editar
  function abrirModal(item = null) {
    document.getElementById("itemId").value = item?.id || "";
    document.getElementById("itemName").value = item?.nombre || "";
    document.getElementById("itemDesc").value = item?.descripcion || "";
    new bootstrap.Modal(document.getElementById("itemModal")).show();
  }
  document.getElementById("itemForm").onsubmit = async function (e) {
    e.preventDefault();
    const id = document.getElementById("itemId").value;
    const nombre = document.getElementById("itemName").value;
    const desc = document.getElementById("itemDesc").value;
    let res;
    if (id) {
      res = await updateItem(id, nombre, desc);
    } else {
      res = await createItem(nombre, desc);
    }
    if (res.success || res.id) {
      cargarItems();
      bootstrap.Modal.getInstance(document.getElementById("itemModal")).hide();
    } else {
      document.getElementById("itemError").textContent =
        res.error || "Error al guardar";
      document.getElementById("itemError").style.display = "block";
    }
  };
  async function borrar(id) {
    if (confirm("¿Seguro que quieres borrar este item?")) {
      const res = await deleteItem(id);
      if (res.success) cargarItems();
    }
  }
}
// ----------- LOGOUT universal -----------
document.querySelectorAll("#logoutBtn").forEach((btn) => {
  btn.onclick = () => {
    borrarToken();
    window.location.href = "../../auth/login.html";
  };
});
