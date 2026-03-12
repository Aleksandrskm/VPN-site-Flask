const armApi = {
    async getArms() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.ARM}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get arms failed:', error);
            throw error;
        }
    }
};