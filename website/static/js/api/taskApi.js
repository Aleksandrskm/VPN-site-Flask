// js/api/taskApi.js
import { API_CONFIG, ENDPOINTS } from './config.js';

export const taskApi = {
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
    },

    async getTasks(page = 1, pageSize = 10,type ='all', sort = 'desc') {
        try {

            const url = `${API_CONFIG.baseUrl}${ENDPOINTS.TASK.GET_TASKS(page, pageSize,type,sort)}`;
            console.log('Request URL:', url); // Для отладки

            const response = await fetch(url, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Get tasks failed:', error);
            throw error;
        }
    },

    async getTaskDetail(taskId) {
        try {
            const response = await fetch(`${API_CONFIG.baseUrl}${ENDPOINTS.TASK.GET_TASK_DETAIL(taskId)}`, {
                method: 'GET',
                headers: API_CONFIG.headers
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Get task detail failed for ID ${taskId}:`, error);
            throw error;
        }
    }
};