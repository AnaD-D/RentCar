// ==========================================
// Configuración API
// ==========================================
const BASE_URL = 'https://silver-doodle-4j7g6p69p4xq35qj7-5000.app.github.dev/api';

const API = {
    async get(endpoint) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error al obtener datos de ${endpoint}:`, error);
            return null;
        }
    },

    async post(endpoint, data) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Error HTTP: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Error al enviar datos a ${endpoint}:`, error);
            alert(`Error: ${error.message}`);
            return null;
        }
    },

    async put(endpoint, data) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error("Error en PUT:", error);
            return null;
        }
    }
};