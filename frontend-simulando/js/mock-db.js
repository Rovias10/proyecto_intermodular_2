// js/mock-db.js
/*
  Este archivo simula nuestra base de datos (Nivel 3).
  Contiene los datos con los que la aplicación trabajará.
  api-service.js leerá y escribirá aquí.
*/

export const db = {
    // Tabla `users`
    users: [
        { 
            id: 1, 
            name: 'Admin Demo', 
            email: 'admin@demo.com', 
            password: '123', // En la vida real, esto estaría hasheado
            avatar_url: 'https://placehold.co/160x160/007bff/ffffff?text=AD' 
        },
        { 
            id: 2, 
            name: 'Editora Jane', 
            email: 'editor@demo.com', 
            password: '123',
            avatar_url: 'https://placehold.co/160x160/6f42c1/ffffff?text=EJ' 
        },
        { 
            id: 3, 
            name: 'Lector Carlos', 
            email: 'viewer@demo.com', 
            password: '123',
            avatar_url: 'https://placehold.co/160x160/28a745/ffffff?text=LC' 
        }
    ],

    // Tabla `projects`
    projects: [
        { 
            id: 1, 
            owner_id: 1, 
            name: 'Proyecto Alpha (DAW)', 
            description: 'Desarrollo del backend principal del proyecto de 2º de DAW.' 
        },
        { 
            id: 2, 
            owner_id: 2, 
            name: 'Proyecto Beta (Móvil)', 
            description: 'Interfaz móvil para la app.' 
        }
    ],

    // Tabla `tasks`
    tasks: [
        { id: 1, project_id: 1, assigned_to_user_id: 1, title: 'Diseñar la base de datos', status: 'completed' },
        { id: 2, project_id: 1, assigned_to_user_id: 2, title: 'Crear API de login (auth)', status: 'in_progress' },
        { id: 3, project_id: 1, assigned_to_user_id: 3, title: 'Testear endpoints', status: 'pending' },
        { id: 4, project_id: 2, assigned_to_user_id: 2, title: 'Definir vistas de la App', status: 'pending' }
    ],

    // Tabla `project_user` (La tabla pivote del Nivel 3)
    project_user: [
        // Proyecto 1:
        { id: 1, project_id: 1, user_id: 1, role: 'owner' },   // Admin es Dueño de Alpha
        { id: 2, project_id: 1, user_id: 2, role: 'editor' },  // Jane es Editora de Alpha
        { id: 3, project_id: 1, user_id: 3, role: 'viewer' },  // Carlos es Lector de Alpha

        // Proyecto 2:
        { id: 4, project_id: 2, user_id: 2, role: 'owner' },   // Jane es Dueña de Beta
        { id: 5, project_id: 2, user_id: 1, role: 'viewer' }   // Admin es Lector de Beta
    ]
};