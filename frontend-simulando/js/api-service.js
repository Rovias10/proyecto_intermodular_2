// js/api-service.js
// --- IMPORTANTE: Importamos la "base de datos" falsa ---
import { db } from './mock-db.js';

// --- Funciones de Token (ESTAS QUEDAN IGUAL) ---
export function guardarToken(token) {
    localStorage.setItem("jwt", token);
}
export function obtenerToken() {
    return localStorage.getItem("jwt");
}
export function borrarToken() {
    localStorage.removeItem("jwt");
}

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

// --- Helpers Internos (Simulación de Backend) ---

/**
 * [HELPER] Obtiene el usuario autenticado desde el token.
 */
function getAuthenticatedUser() {
    const payload = decodificarToken();
    if (!payload) return null;
    return db.users.find(u => u.id === payload.id);
}

/**
 * [HELPER] Simula una respuesta de error 401 (No autorizado)
 */
function unauthorized() {
    borrarToken();
    window.location.href = '../auth/login.html';
    return Promise.reject(new Error('Token inválido o expirado.'));
}

/**
 * [HELPER] Genera un ID único para nuevos items
 */
function getNextId(table) {
    const ids = table.map(item => item.id);
    return Math.max(0, ...ids) + 1;
}

// --- AUTH (Nivel 1) ---

export function login(email, password) {
    const user = db.users.find(
        u => u.email === email && u.password === password
    );

    if (!user) {
        return Promise.reject({ message: 'Credenciales incorrectas' });
    }

    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
    };
    
    // Creamos un token FALSO que respeta la estructura JWT (con 3 partes)
    // para que decodificarToken() funcione.
    const payloadBase64 = btoa(JSON.stringify(payload));
    const fakeToken = `fake-jwt-header.${payloadBase64}.fake-jwt-signature`;

    return Promise.resolve({ token: fakeToken });
}

export function register(name, email, password) {
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
        return Promise.reject({ message: 'El email ya está en uso' });
    }

    const newUser = {
        id: getNextId(db.users),
        name: name,
        email: email,
        password: password, 
        avatar_url: `https://placehold.co/160x160/cccccc/ffffff?text=${name.charAt(0).toUpperCase()}`
    };

    db.users.push(newUser);
    return login(email, password);
}

export function getMiPerfil() {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();
    return Promise.resolve({ ...user });
}

export function updateMiPerfil(name, avatar_url) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    user.name = name;
    user.avatar_url = avatar_url;

    return Promise.resolve({ ...user });
}

// --- DASHBOARD (Nivel 2) ---

export function getDashboardStats() {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();
    
    const projectIds = db.project_user
        .filter(pu => pu.user_id === user.id)
        .map(pu => pu.project_id);

    const userTasks = db.tasks.filter(t => projectIds.includes(t.project_id));

    const stats = {
        total_projects: projectIds.length,
        total_tasks: userTasks.length,
        tasks_completed: userTasks.filter(t => t.status === 'completed').length,
    };
    
    return Promise.resolve(stats);
}

// --- PROYECTOS (Nivel 2) ---

export function getProjects() {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    const projectIds = db.project_user
        .filter(pu => pu.user_id === user.id)
        .map(pu => pu.project_id);
    
    const projects = db.projects.filter(p => projectIds.includes(p.id));

    return Promise.resolve(projects);
}

export function createProject(name, description) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    const newProject = {
        id: getNextId(db.projects),
        owner_id: user.id,
        name: name,
        description: description
    };
    db.projects.push(newProject);

    const newPivotEntry = {
        id: getNextId(db.project_user),
        project_id: newProject.id,
        user_id: user.id,
        role: 'owner'
    };
    db.project_user.push(newPivotEntry);

    return Promise.resolve(newProject);
}

/**
 * Obtiene los detalles de UN proyecto (incluye tareas y colaboradores)
 */
export function getProjectDetails(projectId) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    // ----- ¡AQUÍ ESTÁ LA CORRECCIÓN! -----
    const pId = parseInt(projectId, 10);
    // -------------------------------------

    // 1. Verificar si el usuario tiene acceso
    const hasAccess = db.project_user.find(
        pu => pu.user_id === user.id && pu.project_id === pId // Usamos pId
    );
    if (!hasAccess) {
        return Promise.reject(new Error('Acceso denegado a este proyecto.'));
    }

    // 2. Obtener el proyecto
    const project = db.projects.find(p => p.id === pId); // Usamos pId
    if (!project) {
        return Promise.reject(new Error('Proyecto no encontrado.'));
    }

    // 3. Obtener tareas
    const tasks = db.tasks.filter(t => t.project_id === pId); // Usamos pId

    // 4. Obtener colaboradores (uniendo project_user y users)
    const collaboratorLinks = db.project_user.filter(pu => pu.project_id === pId); // Usamos pId
    const collaborators = collaboratorLinks.map(link => {
        const user_details = db.users.find(u => u.id === link.user_id);
        return {
            user_id: user_details.id,
            name: user_details.name,
            email: user_details.email,
            avatar_url: user_details.avatar_url,
            role: link.role
        };
    });

    // 5. Devolver todo junto
    return Promise.resolve({
        ...project, 
        tasks,      
        collaborators 
    });
}

/**
 * Borra un proyecto (Solo 'owner')
 */
export function deleteProject(projectId) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    // ----- ¡CORRECCIÓN! -----
    const pId = parseInt(projectId, 10);
    // -------------------------

    const project = db.projects.find(p => p.id === pId); // Usamos pId
    if (!project) return Promise.reject(new Error('Proyecto no encontrado'));

    if (project.owner_id !== user.id) {
        return Promise.reject(new Error('No tienes permisos para borrar este proyecto'));
    }
    
    db.projects = db.projects.filter(p => p.id !== pId); // Usamos pId
    db.tasks = db.tasks.filter(t => t.project_id !== pId); // Usamos pId
    db.project_user = db.project_user.filter(pu => pu.project_id !== pId); // Usamos pId

    return Promise.resolve({ success: true });
}

// --- TAREAS (Nivel 2) ---

export function createTask(projectId, title, status, assigned_to_user_id) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();
    
    // ----- ¡CORRECCIÓN! -----
    const pId = parseInt(projectId, 10);
    const aId = parseInt(assigned_to_user_id, 10);
    // -------------------------
    
    const newTask = {
        id: getNextId(db.tasks),
        project_id: pId, // Usamos pId
        assigned_to_user_id: aId, // Usamos aId
        title: title,
        status: status
    };
    db.tasks.push(newTask);
    
    return Promise.resolve(newTask);
}

export function updateTask(taskId, data) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    // ----- ¡CORRECCIÓN! -----
    const tId = parseInt(taskId, 10);
    // -------------------------

    const task = db.tasks.find(t => t.id === tId); // Usamos tId
    if (!task) return Promise.reject(new Error('Tarea no encontrada'));
    
    // Si 'data' incluye un nuevo 'assigned_to_user_id', también lo convertimos
    if (data.assigned_to_user_id) {
        data.assigned_to_user_id = parseInt(data.assigned_to_user_id, 10);
    }

    Object.assign(task, data);

    return Promise.resolve({ ...task });
}

export function deleteTask(taskId) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    // ----- ¡CORRECCIÓN! -----
    const tId = parseInt(taskId, 10);
    // -------------------------

    db.tasks = db.tasks.filter(t => t.id !== tId); // Usamos tId
    
    return Promise.resolve({ success: true });
}

// --- COLABORADORES (Nivel 3) ---

export function inviteUserToProject(projectId, email, role) {
    const user = getAuthenticatedUser();
    if (!user) return unauthorized();

    // ----- ¡CORRECCIÓN! -----
    const pId = parseInt(projectId, 10);
    // -------------------------

    const userToInvite = db.users.find(u => u.email === email);
    if (!userToInvite) {
        return Promise.reject(new Error('Usuario no encontrado con ese email'));
    }

    const alreadyExists = db.project_user.find(
        pu => pu.project_id === pId && pu.user_id === userToInvite.id // Usamos pId
    );
    if (alreadyExists) {
        return Promise.reject(new Error('Este usuario ya es miembro del proyecto'));
    }

    const newPivotEntry = {
        id: getNextId(db.project_user),
        project_id: pId, // Usamos pId
        user_id: userToInvite.id,
        role: role
    };
    db.project_user.push(newPivotEntry);

    const newCollaborator = {
        user_id: userToInvite.id,
        name: userToInvite.name,
        email: userToInvite.email,
        avatar_url: userToInvite.avatar_url,
        role: newPivotEntry.role
    };

    return Promise.resolve(newCollaborator);
}