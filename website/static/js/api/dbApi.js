import { API_CONFIG, ENDPOINTS } from './config.js';

export const dbApi = {
    async editRow(tableName, newRowData) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.EDIT_ROW(tableName)}`, {
                method: 'PATCH',
                headers: API_CONFIG.headers,
                body: JSON.stringify(newRowData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Edit row failed for ${tableName}:`, error);
            throw error;
        }
    },

    async deleteRow(tableName, deleteRowData) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.DELETE_ROW(tableName)}`, {
                method: 'DELETE',
                headers: API_CONFIG.headers,
                body: JSON.stringify(deleteRowData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Delete row failed for ${tableName}:`, error);
            throw error;
        }
    },

    async insertRow(tableName, insertRowData) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.INSERT_ROW(tableName)}`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify(insertRowData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Insert row failed for ${tableName}:`, error);
            throw error;
        }
    },

    async getTable(tableName) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.GET_TABLE(tableName)}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Get table failed ${tableName}:`, error);
            throw error;
        }
    },

    async selectQuery(customQuery) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.SELECT_QUERY}`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify(customQuery)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Custom select failed:', error);
            throw error;
        }
    },

    async changeQuery(customQuery) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.CHANGE_QUERY}`, {
                method: 'POST',
                headers: API_CONFIG.headers,
                body: JSON.stringify(customQuery)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Custom change failed:', error);
            throw error;
        }
    },

    async tableInfo(tableName) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.TABLE_INFO(tableName)}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get Table Info failed:', error);
            throw error;
        }
    },

    async getStructureDB() {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.DB.DB_STRUCTURE}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get structure DB failed:', error);
            throw error;
        }
    }
};