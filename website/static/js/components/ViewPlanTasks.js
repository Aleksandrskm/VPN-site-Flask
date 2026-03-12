// js/components/ViewPlanTasks.js
import { taskApi } from '../api/taskApi.js';
import { DateUtils } from '../utils/dateUtils.js';

export const ViewPlanTasks = {
    element: null,

    // Хранилище для обработчиков событий
    eventListeners: [],

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

        // Вешаем постоянные обработчики
        this.attachStaticEvents();

        // Загружаем данные
        await this.loadTasks();

        return section;
    },

    // Очистка всех обработчиков событий
    clearEventListeners() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
    },

    // Добавление обработчика с сохранением
    addSafeEventListener(element, type, handler) {
        if (!element) return;
        element.addEventListener(type, handler);
        this.eventListeners.push({ element, type, handler });
    },

    // Постоянные обработчики (не пересоздаются)
    attachStaticEvents() {
        // Поиск по кнопке
        const searchBtn = this.element.querySelector('#search-btn');
        this.addSafeEventListener(searchBtn, 'click', () => {
            const input = this.element.querySelector('.search-input');
            this.state.searchQuery = input.value;
            this.applySearch();
        });

        // Сброс поиска
        const clearBtn = this.element.querySelector('#clear-search');
        this.addSafeEventListener(clearBtn, 'click', () => {
            const input = this.element.querySelector('.search-input');
            input.value = '';
            this.state.searchQuery = '';
            this.applySearch();
        });

        // Поиск при нажатии Enter
        const searchInput = this.element.querySelector('.search-input');
        this.addSafeEventListener(searchInput, 'keypress', (e) => {
            if (e.key === 'Enter') {
                this.state.searchQuery = e.target.value;
                this.applySearch();
            }
        });

        // Изменение размера страницы
        const pageSizeSelect = this.element.querySelector('#page-size');
        this.addSafeEventListener(pageSizeSelect, 'change', (e) => {
            this.state.pageSize = parseInt(e.target.value);
            this.state.currentPage = 1;
            this.state.searchQuery = '';
            const input = this.element.querySelector('.search-input');
            if (input) input.value = '';
            this.loadTasks();
        });
    },

    async loadTasks() {
        const tableContainer = this.element.querySelector('#tasks-table-container');
        tableContainer.innerHTML = '<div class="loading-state">Загрузка...</div>';

        try {
            console.log('Загрузка страницы:', this.state.currentPage);

            const response = await taskApi.getTasks(this.state.currentPage, this.state.pageSize);
            console.log('Ответ:', response);

            if (response && response.tasks) {
                this.state.tasks = response.tasks.map(task => ({
                    id: task.ID,
                    workstation_name: `АРМ-${task.ID_PR_ARM}`,
                    started_at: task.ZAD_BEG,
                    status: this.mapStatus(task.STATUS),
                    config: task.CONFIG ? JSON.parse(task.CONFIG) : null,
                    kol_vpn: task.KOL_VPN || 0,
                    kol_site: task.KOL_SITE || 0,
                    kol_prg: task.KOL_PRG || 0,
                    http: task.HTTP || '-',
                    comment: task.COMMENT || '-'
                }));

                this.state.totalTasks = response.total || 0;
                this.state.totalPages = Math.ceil(this.state.totalTasks / this.state.pageSize);
                this.state.filteredTasks = [...this.state.tasks];
            }

            this.renderTable();
            this.renderPagination();

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
                        <th>АРМ</th>
                        <th>Время запуска</th>
                        <th>Статус</th>
                        <th>Конфигурация</th>
                        <th>VPN</th>
                        <th>Сайты</th>
                        <th>Программы</th>
                        <th>HTTP</th>
                        <th>Комментарий</th>
                    </tr>
                </thead>
                <tbody>
        `;

        displayTasks.forEach(task => {
            html += `
                <tr>
                    <td>${task.id || '-'}</td>
                    <td>${task.workstation_name || '-'}</td>
                    <td>${task.started_at ? DateUtils.getDateTime(new Date(task.started_at)) : '-'}</td>
                    <td>${this.getStatusText(task.status)}</td>
                    <td>${this.formatConfig(task.config)}</td>
                    <td>${task.kol_vpn}</td>
                    <td>${task.kol_site}</td>
                    <td>${task.kol_prg}</td>
                    <td>${task.http}</td>
                    <td>${task.comment}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
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

        // Очищаем старые обработчики пагинации
        this.clearEventListeners();

        // Вешаем постоянные обработчики заново (они могли быть очищены)
        this.attachStaticEvents();

        // Предыдущая страница
        const prevBtn = this.element.querySelector('#prev-page');
        if (prevBtn) {
            this.addSafeEventListener(prevBtn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Клик по предыдущей, disabled:', prevBtn.disabled);

                if (!prevBtn.disabled && this.state.currentPage > 1) {
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
            this.addSafeEventListener(nextBtn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Клик по следующей, disabled:', nextBtn.disabled);

                if (!nextBtn.disabled && this.state.currentPage < this.state.totalPages) {
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
            this.addSafeEventListener(btn, 'click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = parseInt(btn.dataset.page);
                console.log('Клик по странице:', page, 'текущая:', this.state.currentPage);

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
                    (task.workstation_name || '').toLowerCase().includes(query) ||
                    (this.getStatusText(task.status) || '').toLowerCase().includes(query) ||
                    (task.http || '').toLowerCase().includes(query) ||
                    (task.comment || '').toLowerCase().includes(query)
                );
            });
        }

        this.renderTable();
        this.renderPagination();
    },

    mapStatus(status) {
        const map = {
            0: 'pending',
            1: 'in_progress',
            2: 'completed',
            3: 'failed'
        };
        return map[status] || 'unknown';
    },

    getStatusText(status) {
        const map = {
            'pending': 'Ожидает',
            'in_progress': 'Выполняется',
            'completed': 'Завершена',
            'failed': 'Ошибка',
            'unknown': 'Неизвестно'
        };
        return map[status] || status;
    },

    formatConfig(config) {
        if (!config) return 'Нет конфигурации';

        const items = [];
        if (config.vpns?.length) items.push(`VPN: ${config.vpns.length}`);
        if (config.urls?.length) items.push(`URL: ${config.urls.length}`);
        if (config.programs?.length) items.push(`Программы: ${config.programs.length}`);

        return items.join(' • ') || 'Нет конфигурации';
    },

    destroy() {
        // Очищаем все обработчики событий
        this.clearEventListeners();

        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
};