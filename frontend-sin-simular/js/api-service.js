// js/api-service.js
const API_URL = "http://localhost:3000/api"; // URL de vuestro backend

// --- Funciones de Token ---
export function guardarToken(token) {
    localStorage.setItem("jwt", token);
}
export function obtenerToken() {
    return localStorage.getItem("jwt");
}
export function borrarToken() {
    localStorage.removeItem("jwt");
}

/**
 * Decodifica el token JWT para obtener el payload (id, email, name).
 * Nota: Esto no verifica la firma, solo decodifica.
 * El backend SIEMPRE debe verificar la firma.
 */
export function decodificarToken() {
    const token = obtenerToken();
    if (!token) return null;
    try {
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64);
        return JSON.parse(payloadJson);
    } catch (e) {
        console.error("Error decodificando token:", e);
        borrarToken(); // El token está corrupto
        return null;
    }
}

// --- Wrapper de Fetch con Auth ---
async function fetchConAuth(url, options = {}) {
    const token = obtenerToken();
    
    // Configuración de headers por defecto
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Añadir token si existe
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Configuración final de la petición
    const config = {
        ...options,
        headers: headers,
    };

    const response = await fetch(url, config);

    // Si el token es inválido o expiró (401), desloguear al usuario.
    if (response.status === 401) {
        borrarToken();
        window.location.href = '../auth/login.html'; // Ajustar ruta si es necesario
        return Promise.reject(new Error('Token inválido o expirado.'));
    }

    // Si la respuesta no es JSON (ej. 204 No Content de un DELETE)
    if (response.status === 204) {
        return { success: true };
    }

    if (!response.ok) {
        // Intentar parsear el error del backend
        const errorData = await response.json().catch(() => ({}));
        return Promise.reject(errorData || new Error(`Error ${response.status}: ${response.statusText}`));
    }

    return response.json();
}

// --- AUTH (Nivel 1) ---
export function login(email, password) {
    return fetchConAuth(`${API_URL}/auth/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export function register(name, email, password) {
    return fetchConAuth(`${API_URL}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
    });
}

/**
 * Obtiene el perfil del usuario logueado
 */
export function getMiPerfil() {
    return fetchConAuth(`${API_URL}/users/me`);
}

/**
 * Actualiza el perfil del usuario logueado
 */
export function updateMiPerfil(name, avatar_url) {
    return fetchConAuth(`${API_URL}/users/me`, {
        method: 'PUT',
        body: JSON.stringify({ name, avatar_url }),
    });
}

// --- DASHBOARD (Nivel 2) ---
/**
 * Obtiene las estadísticas para el dashboard
 */
export function getDashboardStats() {
    return fetchConAuth(`${API_URL}/stats/dashboard`);
}

// --- PROYECTOS (Nivel 2) ---
/**
 * Obtiene la lista de proyectos del usuario
 */
export function getProjects() {
    return fetchConAuth(`${API_URL}/projects`);
}

/**
 * Crea un nuevo proyecto
 */
export function createProject(name, description) {
    return fetchConAuth(`${API_URL}/projects`, {
        method: "POST",
        body: JSON.stringify({ name, description }),
    });
}

/**
 * Obtiene los detalles de UN proyecto (incluye tareas y colaboradores)
 */
export function getProjectDetails(projectId) {
    return fetchConAuth(`${API_URL}/projects/${projectId}`);
}

/**
 * Borra un proyecto (Solo 'owner')
 */
export function deleteProject(projectId) {
    return fetchConAuth(`${API_URL}/projects/${projectId}`, {
        method: 'DELETE',
    });
}

// --- TAREAS (Nivel 2) ---
/**
 * Crea una nueva tarea en un proyecto
 */
export function createTask(projectId, title, status, assigned_to_user_id) {
    return fetchConAuth(`${API_URL}/projects/${projectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({ title, status, assigned_to_user_id }),
    });
}

/**
 * Actualiza una tarea
 */
export function updateTask(taskId, data) {
    return fetchConAuth(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Borra una tarea
 */
export function deleteTask(taskId) {
    return fetchConAuth(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
    });
}

// --- COLABORADORES (Nivel 3) ---
/**
 * Invita un usuario a un proyecto
 */
export function inviteUserToProject(projectId, email, role) {
    return fetchConAuth(`${API_URL}/projects/${projectId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email, role }),
    });
}