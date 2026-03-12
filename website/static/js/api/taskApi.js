const taskApi = {
    async getConfig() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.TASK.DEFAULT_CONFIG}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get config failed:', error);
            throw error;
        }
    },

    async addTask(body) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.TASK.ADD_TASK}`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Add task failed:', error);
            throw error;
        }
    }
};