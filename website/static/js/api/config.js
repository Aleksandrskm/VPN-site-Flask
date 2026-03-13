export const API_CONFIG = {
    baseUrl: 'http://185.192.247.60:13500',
    headers: {
        'Content-Type': 'application/json',
    }
};

export const ENDPOINTS = {
    ARM: '/workstations',
    DB: {
        EDIT_ROW: (tableName) => `/db/update/${tableName}`,
        DELETE_ROW: (tableName) => `/db/delete/${tableName}`,
        INSERT_ROW: (tableName) => `/db/insert_row/${tableName}`,
        GET_TABLE: (tableName) => `/db/select/${tableName}`,
        SELECT_QUERY: '/db/custom_select_query',
        CHANGE_QUERY: '/db/custom_change_query',
        TABLE_INFO: (tableName) => `/db/${tableName}/info`,
        DB_STRUCTURE: '/db/structure'
    },
    TASK: {
        DEFAULT_CONFIG: '/tasks/default_config',
        ADD_TASK: '/tasks',
        GET_TASKS: (page, pageSize) => `/tasks?page=${page}&page_size=${pageSize}`,
        GET_TASK_DETAIL: (taskId) => `/tasks/${taskId}/detail`,
    }
};