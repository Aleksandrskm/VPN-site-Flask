// js/components/ViewPlanTasks.js
import { taskApi } from '../api/taskApi.js';
import { DateUtils } from '../utils/dateUtils.js';

export const ViewPlanTasks = {
    element: null,

    state: {
        tasks: [],
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalTasks: 0,
        searchQuery: '',
        filteredTasks: [],
        sortField: 'started_at',
        sortDirection: 'desc'
    },

    async create() {
        const section = document.createElement('section');
        section.className = 'view-tasks-section';

        section.innerHTML = `
            <div class="tasks-header">
                <h2>Планируемые задачи</h2>
                <div class="tasks-controls">
                    <div class="search-box">
                        <input type="text" class="search-input" placeholder="Поиск по задачам..." value="${this.state.searchQuery}">
                        <button class="btn btn-primary" id="search-btn">Поиск</button>
                        <button class="btn btn-secondary" id="clear-search">Сброс</button>
                    </div>
                    <select class="page-size-select" id="page-size">
                        <option value="5" ${this.state.pageSize === 5 ? 'selected' : ''}>5 задач</option>
                        <option value="10" ${this.state.pageSize === 10 ? 'selected' : ''}>10 задач</option>
                        <option value="20" ${this.state.pageSize === 20 ? 'selected' : ''}>20 задач</option>
                        <option value="50" ${this.state.pageSize === 50 ? 'selected' : ''}>50 задач</option>
                        <option value="100" ${this.state.pageSize === 100 ? 'selected' : ''}>100 задач</option>
                    </select>
                </div>
            </div>
            <div class="tasks-table-container" id="tasks-table-container"></div>
            <div class="pagination-container" id="pagination-container"></div>
        `;

        this.element = section;

        // Загружаем данные
        await this.loadTasks();

        return section;
    },

    refreshEventHandlers() {
        console.log('Обновление обработчиков событий');

        // Обновляем обработчики для поиска и пагинации
        this.attachEventHandlers();

        // Обновляем обработчики для пагинации
        this.attachPaginationEvents();

        // Обновляем значение select
        this.updatePageSizeSelect();
    },

    updatePageSizeSelect() {
        const select = this.element.querySelector('#page-size');
        if (select) {
            select.value = this.state.pageSize.toString();
        }
    },

    async loadTasks() {
        const tableContainer = this.element.querySelector('#tasks-table-container');
        tableContainer.innerHTML = '<div class="loading-state">Загрузка...</div>';

        try {
            console.log('Загрузка страницы:', this.state.currentPage);

            const response = await taskApi.getTasks(this.state.currentPage, this.state.pageSize, 'awaits');
            console.log('Ответ:', response);

            if (response && response.tasks) {
                this.state.tasks = response.tasks.map(task => ({
                    // Основные поля
                    id: task.id,
                    workstation_id: task.workstation_id || '-',
                    workstation_ip: task.workstation_ip || '-',
                    started_at: task.started_at,
                    completed_at: task.completed_at,
                    duration_str: task.duration_str,

                    // Статус задачи (0: Ожидает, 1: Выполняется, 2: Завершена, -1: Ошибка)
                    status: task.status,

                    // Конфигурация
                    config: task.config ? JSON.parse(task.config) : null,

                    // VPN статистика
                    vpn_total: task.vpn_total || 0,
                    vpn_connected: task.vpn_connected,
                    vpn_failed: task.vpn_failed,

                    // Сайты статистика
                    sites_total: task.sites_total || 0,
                    sites_checked: task.sites_checked,
                    sites_available: task.sites_available,
                    sites_unavailable: task.sites_unavailable,

                    // Приложения статистика
                    programs_total: task.programs_total || 0,
                    programs_checked: task.programs_checked,
                    programs_available: task.programs_available,
                    programs_unavailable: task.programs_unavailable,

                    // Комментарий
                    comment: task.comment || '-'
                }));

                this.state.totalTasks = response.total || 0;
                this.state.totalPages = Math.ceil(this.state.totalTasks / this.state.pageSize);
                this.state.filteredTasks = [...this.state.tasks];
            }

            this.renderTable();
            this.renderPagination();
            this.updatePageSizeSelect();

        } catch (error) {
            console.error('Ошибка:', error);
            tableContainer.innerHTML = `<div class="error-state">Ошибка: ${error.message}</div>`;
        }
    },

    renderTable() {
        const container = this.element.querySelector('#tasks-table-container');
        const displayTasks = this.state.searchQuery ? this.state.filteredTasks : this.state.tasks;

        if (displayTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">Нет задач</div>';
            return;
        }

        let html = `
            <table class="tasks-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Идентификатор АРМ</th>
                        <th>IP-адрес АРМ</th>
                        <th>Дата и время начала проверки</th>
                        <th>Дата и время окончания проверки</th>
                        <th>Время выполнения задачи</th>
                        <th>Статус</th>
                        <th colspan="3" class="section-header">VPN</th>
                        <th colspan="4" class="section-header">Сайты</th>
                        <th colspan="4" class="section-header">Приложения</th>
                        <th>Комментарий к проверке</th>
                        <th>Конфигурация задачи</th>
                    </tr>
                    <tr>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th></th>
                        <th>Количество VPN из конфигурации</th>
                        <th>Количество подключенных VPN</th>
                        <th>Количество неподключенных VPN</th>
                        <th>Количество сайтов из конфигурации</th>
                        <th>Количество сайтов из отчета</th>
                        <th>Количество доступных сайтов</th>
                        <th>Количество недоступных сайтов</th>
                        <th>Количество приложений из конфигурации</th>
                        <th>Количество приложений из отчета</th>
                        <th>Количество доступных приложений</th>
                        <th>Количество недоступных приложений</th>
                        <th></th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;

        displayTasks.forEach(task => {
            html += `
                <tr class="task-row status-${this.getStatusClass(task.status)}">
                    <td class="task-id">${task.id || '-'}</td>
                    <td class="task-workstation-id">${task.workstation_id}</td>
                    <td class="task-workstation-ip">${task.workstation_ip}</td>
                    <td class="task-time">${task.started_at ? DateUtils.getDateTime(new Date(task.started_at)) : '-'}</td>
                    <td class="task-time">${task.completed_at ? DateUtils.getDateTime(new Date(task.completed_at)) : '-'}</td>
                    <td class="task-duration">${task.duration_str || '-'}</td>
                    <td class="task-status">${this.getStatusText(task.status)}</td>
                    
                    <!-- VPN статистика -->
                    <td class="task-stats">${task.vpn_total}</td>
                    <td class="task-stats ${this.getConnectedClass(task.vpn_connected, task.vpn_total)}">${task.vpn_connected ?? '-'}</td>
                    <td class="task-stats ${this.getFailedClass(task.vpn_failed)}">${task.vpn_failed ?? '-'}</td>
                    
                    <!-- Сайты статистика -->
                    <td class="task-stats">${task.sites_total}</td>
                    <td class="task-stats">${task.sites_checked ?? '-'}</td>
                    <td class="task-stats ${this.getAvailableClass(task.sites_available)}">${task.sites_available ?? '-'}</td>
                    <td class="task-stats ${this.getUnavailableClass(task.sites_unavailable)}">${task.sites_unavailable ?? '-'}</td>
                    
                    <!-- Приложения статистика -->
                    <td class="task-stats">${task.programs_total}</td>
                    <td class="task-stats">${task.programs_checked ?? '-'}</td>
                    <td class="task-stats ${this.getAvailableClass(task.programs_available)}">${task.programs_available ?? '-'}</td>
                    <td class="task-stats ${this.getUnavailableClass(task.programs_unavailable)}">${task.programs_unavailable ?? '-'}</td>
                    
                    <td class="task-comment">${task.comment}</td>
                    <td class="task-config">${this.formatConfig(task.config)}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Добавляем обработчики для поиска и пагинации
        this.attachEventHandlers();
    },

    // Вспомогательные методы для стилизации ячеек
    getConnectedClass(value, total) {
        if (value === null || value === undefined) return '';
        return value === total ? 'success-value' : 'warning-value';
    },

    getFailedClass(value) {
        if (value === null || value === undefined) return '';
        return value > 0 ? 'error-value' : '';
    },

    getAvailableClass(value) {
        if (value === null || value === undefined) return '';
        return value > 0 ? 'success-value' : '';
    },

    getUnavailableClass(value) {
        if (value === null || value === undefined) return '';
        return value > 0 ? 'error-value' : '';
    },

    attachEventHandlers() {
        // Поиск по кнопке
        const searchBtn = this.element.querySelector('#search-btn');
        if (searchBtn) {
            const newSearchBtn = searchBtn.cloneNode(true);
            searchBtn.parentNode.replaceChild(newSearchBtn, searchBtn);

            newSearchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const input = this.element.querySelector('.search-input');
                this.state.searchQuery = input.value;
                this.applySearch();
            });
        }

        // Сброс поиска
        const clearBtn = this.element.querySelector('#clear-search');
        if (clearBtn) {
            const newClearBtn = clearBtn.cloneNode(true);
            clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);

            newClearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const input = this.element.querySelector('.search-input');
                input.value = '';
                this.state.searchQuery = '';
                this.applySearch();
            });
        }

        // Поиск при нажатии Enter
        const searchInput = this.element.querySelector('.search-input');
        if (searchInput) {
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);

            newSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.state.searchQuery = e.target.value;
                    this.applySearch();
                }
            });
        }

        // Изменение размера страницы
        const pageSizeSelect = this.element.querySelector('#page-size');
        if (pageSizeSelect) {
            const newPageSizeSelect = pageSizeSelect.cloneNode(true);
            pageSizeSelect.parentNode.replaceChild(newPageSizeSelect, pageSizeSelect);

            newPageSizeSelect.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const newValue = parseInt(e.target.value);
                this.state.pageSize = newValue;
                this.state.currentPage = 1;
                this.state.searchQuery = '';
                const input = this.element.querySelector('.search-input');
                if (input) input.value = '';
                this.loadTasks();
            });
        }
    },

    renderPagination() {
        const container = this.element.querySelector('#pagination-container');

        if (this.state.searchQuery) {
            container.innerHTML = `
                <div class="pagination-info">
                    Найдено: ${this.state.filteredTasks.length} из ${this.state.totalTasks}
                </div>
            `;
            return;
        }

        if (this.state.totalPages <= 1) {
            container.innerHTML = `<div class="pagination-info">Всего: ${this.state.totalTasks}</div>`;
            return;
        }

        const start = (this.state.currentPage - 1) * this.state.pageSize + 1;
        const end = Math.min(start + this.state.tasks.length - 1, this.state.totalTasks);

        let html = `
            <div class="pagination-info">
                Страница ${this.state.currentPage} из ${this.state.totalPages} | ${start}-${end} из ${this.state.totalTasks}
            </div>
            <div class="pagination-controls" id="pagination-controls">
                <button type="button" class="btn btn-secondary btn-sm" id="prev-page" ${this.state.currentPage === 1 ? 'disabled' : ''}>
                    ←
                </button>
        `;

        // Показываем первую, последнюю и страницы вокруг текущей
        const pagesToShow = new Set();
        pagesToShow.add(1);
        pagesToShow.add(this.state.totalPages);
        for (let i = this.state.currentPage - 1; i <= this.state.currentPage + 1; i++) {
            if (i >= 1 && i <= this.state.totalPages) {
                pagesToShow.add(i);
            }
        }

        const sortedPages = Array.from(pagesToShow).sort((a, b) => a - b);
        let lastPage = 0;

        sortedPages.forEach(page => {
            if (page - lastPage > 1) {
                html += `<span class="pagination-dots">...</span>`;
            }

            html += `
                <button type="button" class="btn ${page === this.state.currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm page-btn" 
                        data-page="${page}">${page}</button>
            `;

            lastPage = page;
        });

        html += `
                <button type="button" class="btn btn-secondary btn-sm" id="next-page" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>
                    →
                </button>
            </div>
        `;

        container.innerHTML = html;

        // Вешаем обработчики на кнопки пагинации
        this.attachPaginationEvents();
    },

    attachPaginationEvents() {
        console.log('Вешаем обработчики на кнопки пагинации');

        // Предыдущая страница
        const prevBtn = this.element.querySelector('#prev-page');
        if (prevBtn) {
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

            newPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!newPrevBtn.disabled && this.state.currentPage > 1) {
                    console.log('Переход на страницу:', this.state.currentPage - 1);
                    this.state.currentPage--;
                    this.state.searchQuery = '';
                    const input = this.element.querySelector('.search-input');
                    if (input) input.value = '';
                    this.loadTasks();
                }
            });
        }

        // Следующая страница
        const nextBtn = this.element.querySelector('#next-page');
        if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

            newNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (!newNextBtn.disabled && this.state.currentPage < this.state.totalPages) {
                    console.log('Переход на страницу:', this.state.currentPage + 1);
                    this.state.currentPage++;
                    this.state.searchQuery = '';
                    const input = this.element.querySelector('.search-input');
                    if (input) input.value = '';
                    this.loadTasks();
                }
            });
        }

        // Кнопки страниц
        const pageBtns = this.element.querySelectorAll('.page-btn');
        console.log('Найдено кнопок страниц:', pageBtns.length);

        pageBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = parseInt(newBtn.dataset.page);

                if (page && page !== this.state.currentPage) {
                    console.log('Переход на страницу:', page);
                    this.state.currentPage = page;
                    this.state.searchQuery = '';
                    const input = this.element.querySelector('.search-input');
                    if (input) input.value = '';
                    this.loadTasks();
                }
            });
        });
    },

    applySearch() {
        if (!this.state.searchQuery) {
            this.state.filteredTasks = [...this.state.tasks];
        } else {
            const query = this.state.searchQuery.toLowerCase().trim();
            this.state.filteredTasks = this.state.tasks.filter(task => {
                return (
                    (task.id?.toString() || '').includes(query) ||
                    (task.workstation_id?.toString() || '').includes(query) ||
                    (task.workstation_ip || '').includes(query) ||
                    (this.getStatusText(task.status) || '').toLowerCase().includes(query) ||
                    (task.comment || '').toLowerCase().includes(query)
                );
            });
        }

        this.renderTable();
        this.renderPagination();
    },

    getStatusClass(status) {
        if (status === 0) return 'awaiting';
        if (status === 1) return 'in-progress';
        if (status === 2) return 'completed';
        if (status === -1) return 'failed';
        return 'unknown';
    },

    getStatusText(status) {
        const map = {
            0: 'Ожидает',
            1: 'Выполняется',
            2: 'Завершена',
            '-1': 'Ошибка'
        };
        return map[status] || 'Неизвестно';
    },

    formatConfig(config) {
        if (!config) return 'Нет конфигурации';

        const items = [];
        if (config.vpns?.length) items.push(`VPN: ${config.vpns.length}`);
        if (config.urls?.length) items.push(`URL: ${config.urls.length}`);
        if (config.programs?.length) items.push(`Приложения: ${config.programs.length}`);

        return items.join(' • ') || 'Нет конфигурации';
    },

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
};