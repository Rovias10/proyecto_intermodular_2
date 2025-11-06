// js/api-service.js
const API_URL = "http://localhost:3000/api"; // Cambia la URL a la de tu backend

function guardarToken(token) {
  localStorage.setItem("jwt", token);
}
function obtenerToken() {
  return localStorage.getItem("jwt");
}
function borrarToken() {
  localStorage.removeItem("jwt");
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function register(username, email, password) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
}

export async function getItems() {
  const res = await fetch(`${API_URL}/items`, {
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });
  return res.json();
}

export async function createItem(nombre, descripcion) {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obtenerToken()}`,
    },
    body: JSON.stringify({ nombre, descripcion }),
  });
  return res.json();
}

export async function updateItem(id, nombre, descripcion) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${obtenerToken()}`,
    },
    body: JSON.stringify({ nombre, descripcion }),
  });
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${obtenerToken()}` },
  });
  return res.json();
}
