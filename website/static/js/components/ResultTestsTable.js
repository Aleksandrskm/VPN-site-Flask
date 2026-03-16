// js/components/ResultTestsTable.js
import { taskApi } from '../api/taskApi.js';
import { DateUtils } from '../utils/dateUtils.js';

export const ResultTestsTable = {
    element: null,
    modalElement: null,

    state: {
        tasks: [],
        currentPage: 1,
        pageSize: 10,
        totalPages: 1,
        totalTasks: 0,
        searchQuery: '',
        filteredTasks: [],
        sortField: 'started_at',
        sortDirection: 'desc',
        taskDetail: null,
        isDetailLoading: false
    },

    async create() {
        const section = document.createElement('section');
        section.className = 'view-tasks-section';

        section.innerHTML = `
            <div class="tasks-header">
                <h2>Все задачи</h2>
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

        // Создаем модальное окно
        this.createModal();

        // Загружаем данные
        await this.loadTasks();

        return section;
    },

    createModal() {
        // Проверяем, не существует ли уже модальное окно
        if (document.getElementById('task-detail-modal')) {
            this.modalElement = document.getElementById('task-detail-modal');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'task-detail-modal';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Детали задачи</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" id="modal-body">
                    <div class="loading-state">Загрузка...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;

        // Обработчик закрытия
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal();
        });

        // Закрытие по клику на оверлей
        modal.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    closeModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
            this.state.taskDetail = null;
        }
    },

    openModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
        }
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
                    id: task.id,
                    workstation_id: task.workstation_id || '-',
                    workstation_ip: task.workstation_ip || '-',
                    started_at: task.started_at,
                    completed_at: task.completed_at,
                    duration_str: task.duration_str,
                    status: this.mapStatus(task.status),
                    config: task.config ? JSON.parse(task.config) : null,
                    kol_vpn: task.vpn_total || 0,
                    kol_site: task.sites_total || 0,
                    kol_prg: task.programs_total || 0,
                    http: task.comment || '-',
                    comment: task.comment || '-'
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

    async loadTaskDetail(taskId) {
        console.log('loadTaskDetail вызван с ID:', taskId);

        this.state.isDetailLoading = true;
        this.state.taskDetail = null;

        const modalBody = this.modalElement.querySelector('#modal-body');
        modalBody.innerHTML = '<div class="loading-state">Загрузка деталей...</div>';
        this.openModal();

        try {
            console.log('Загрузка деталей задачи:', taskId);
            const detail = await taskApi.getTaskDetail(taskId);
            console.log('Детали задачи получены:', detail);

            this.state.taskDetail = detail;
            this.renderTaskDetail();
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error);
            modalBody.innerHTML = `<div class="error-state">Ошибка: ${error.message}</div>`;
        } finally {
            this.state.isDetailLoading = false;
        }
    },

    // Метод для открытия скриншота в новом окне
    openScreenshotInNewWindow(imageSrc) {
        // Открываем в новом окне
        const newWindow = window.open('', '_blank');

        if (newWindow) {
            newWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Просмотр скриншота</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 20px;
                            background: #1a1a1a;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            min-height: 100vh;
                            box-sizing: border-box;
                            font-family: Arial, sans-serif;
                        }
                        .container {
                            text-align: center;
                        }
                        img {
                            max-width: 100%;
                            max-height: 85vh;
                            object-fit: contain;
                            border: 3px solid #333;
                            border-radius: 8px;
                            box-shadow: 0 0 30px rgba(0,0,0,0.5);
                        }
                        .close-btn {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            padding: 10px 20px;
                            background: #007bff;
                            color: white;
                            border: none;
                            border-radius: 4px;
                            cursor: pointer;
                            font-size: 14px;
                            z-index: 1000;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
                        }
                        .close-btn:hover {
                            background: #0056b3;
                        }
                        .info {
                            color: #888;
                            margin-top: 10px;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <button class="close-btn" onclick="window.close()">Закрыть</button>
                    <div class="container">
                        <img src="${imageSrc}" alt="Скриншот">
                        <div class="info">Нажмите Esc или кнопку "Закрыть" для возврата</div>
                    </div>
                    <script>
                        document.addEventListener('keydown', function(e) {
                            if (e.key === 'Escape') {
                                window.close();
                            }
                        });
                    </script>
                </body>
                </html>
            `);
            newWindow.document.close();
        } else {
            // Если блокировщик всплывающих окон, открываем в текущем окне
            window.open(imageSrc, '_blank');
        }
    },

    renderTaskDetail() {
        const modalBody = this.modalElement.querySelector('#modal-body');
        const detail = this.state.taskDetail;

        if (!detail) {
            modalBody.innerHTML = '<div class="error-state">Нет данных</div>';
            return;
        }

        const hasPrograms = detail.programs_results && detail.programs_results.length > 0;
        const hasSites = detail.sites_results && detail.sites_results.length > 0;
        const hasUnconnected = (detail.unconnected_programs && detail.unconnected_programs.length > 0) ||
            (detail.unconnected_sites && detail.unconnected_sites.length > 0) ||
            (detail.unconnected_vpns && detail.unconnected_vpns.length > 0);

        let html = '<div class="task-detail-container">';

        // Программы
        html += '<div class="detail-section">';
        html += '<h4>Результаты программ</h4>';

        if (hasPrograms) {
            html += '<div class="results-grid">';
            detail.programs_results.forEach(item => {
                const imageSrc = item.SCR ? `data:image/png;base64,${item.SCR}` : null;
                html += `
                <div class="result-card">
                    <div class="result-info">
                        <div><strong>VPN:</strong> ${item.VPN || '-'}</div>
                        <div><strong>Программа:</strong> ${item.PRG || '-'}</div>
                        <div><strong>Доступ:</strong> ${item.DOSTUP === 1 ? 'Доступен' : 'Недоступен'}</div>
                        ${item.DOSTUP_T ? `<div><strong>Время:</strong> ${item.DOSTUP_T}</div>` : ''}
                    </div>
                    ${imageSrc ? `
                        <div class="result-screenshot" data-src="${imageSrc}">
                            <img src="${imageSrc}" alt="Скриншот" loading="lazy">
                        </div>
                    ` : ''}
                </div>
            `;
            });
            html += '</div>';
        } else {
            html += '<div class="empty-section">Нет результатов по программам</div>';
        }
        html += '</div>';

        // Сайты
        html += '<div class="detail-section">';
        html += '<h4>Результаты сайтов</h4>';

        if (hasSites) {
            html += '<div class="results-grid">';
            detail.sites_results.forEach(item => {
                const imageSrc = item.SCR ? `data:image/png;base64,${item.SCR}` : null;
                html += `
                <div class="result-card">
                    <div class="result-info">
                        <div><strong>VPN:</strong> ${item.VPN || '-'}</div>
                        <div><strong>Сайт:</strong> ${item.SITE || '-'}</div>
                        <div><strong>Доступ:</strong> ${item.DOSTUP === 1 ? 'Доступен' : 'Недоступен'}</div>
                        ${item.DOSTUP_T ? `<div><strong>Время:</strong> ${item.DOSTUP_T}</div>` : ''}
                    </div>
                    ${imageSrc ? `
                        <div class="result-screenshot" data-src="${imageSrc}">
                            <img src="${imageSrc}" alt="Скриншот" loading="lazy">
                        </div>
                    ` : ''}
                </div>
            `;
            });
            html += '</div>';
        } else {
            html += '<div class="empty-section">Нет результатов по сайтам</div>';
        }
        html += '</div>';

        // Неподключенные элементы
        html += '<div class="detail-section">';
        html += '<h4>Неподключенные элементы</h4>';

        if (hasUnconnected) {
            if (detail.unconnected_vpns && detail.unconnected_vpns.length > 0) {
                html += '<div class="unconnected-items">';
                detail.unconnected_vpns.forEach(item => {
                    html += `
                    <div class="unconnected-item">
                        <div><strong>VPN:</strong> ${item.VPN || item}</div>
                        <div class="error-message">${item.ERR || 'Ошибка подключения'}</div>
                    </div>
                `;
                });
                html += '</div>';
            }

            if (detail.unconnected_sites && detail.unconnected_sites.length > 0) {
                html += '<div class="unconnected-items">';
                detail.unconnected_sites.forEach(item => {
                    const name = typeof item === 'object' ? (item.SITE || '-') : item;
                    const error = typeof item === 'object' ? (item.ERR || 'Ошибка подключения') : 'Ошибка подключения';
                    html += `
                    <div class="unconnected-item">
                        <div><strong>Сайт:</strong> ${name}</div>
                        <div class="error-message">${error}</div>
                    </div>
                `;
                });
                html += '</div>';
            }

            if (detail.unconnected_programs && detail.unconnected_programs.length > 0) {
                html += '<div class="unconnected-items">';
                detail.unconnected_programs.forEach(item => {
                    const name = typeof item === 'object' ? (item.PRG || '-') : item;
                    const error = typeof item === 'object' ? (item.ERR || 'Ошибка подключения') : 'Ошибка подключения';
                    html += `
                    <div class="unconnected-item">
                        <div><strong>Программа:</strong> ${name}</div>
                        <div class="error-message">${error}</div>
                    </div>
                `;
                });
                html += '</div>';
            }
        } else {
            html += '<div class="empty-section">Нет неподключенных элементов</div>';
        }
        html += '</div>';

        html += '</div>';
        modalBody.innerHTML = html;

        // Добавляем обработчики для скриншотов
        this.attachScreenshotHandlers();
    },

    attachScreenshotHandlers() {
        const screenshotElements = this.modalElement.querySelectorAll('.result-screenshot');

        screenshotElements.forEach(element => {
            // Удаляем старые обработчики, если есть
            const newElement = element.cloneNode(true);
            element.parentNode.replaceChild(newElement, element);

            newElement.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const imageSrc = newElement.dataset.src;
                if (imageSrc) {
                    this.openScreenshotInNewWindow(imageSrc);
                }
            });

            // Добавляем стиль курсора
            newElement.style.cursor = 'pointer';
        });
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
                        <th>ID АРМ</th>
                        <th>IP адрес</th>
                        <th>Время запуска</th>
                        <th>Статус</th>
                        <th>Конфигурация</th>
                        <th>VPN</th>
                        <th>Сайты</th>
                        <th>Программы</th>
                        <th>Длительность</th>
                        <th>Детали</th>
                    </tr>
                </thead>
                <tbody>
        `;

        displayTasks.forEach(task => {
            html += `
                <tr class="task-row status-${task.status}">
                    <td class="task-id">#${task.id || '-'}</td>
                    <td class="task-workstation-id">${task.workstation_id}</td>
                    <td class="task-workstation-ip">${task.workstation_ip}</td>
                    <td class="task-time">${task.started_at ? DateUtils.getDateTime(new Date(task.started_at)) : '-'}</td>
                    <td class="task-status">${this.getStatusText(task.status)}</td>
                    <td class="task-config">${this.formatConfig(task.config)}</td>
                    <td class="task-stats">${task.kol_vpn}</td>
                    <td class="task-stats">${task.kol_site}</td>
                    <td class="task-stats">${task.kol_prg}</td>
                    <td class="task-duration">${task.duration_str || '-'}</td>
                    <td class="task-actions">
                        <button class="btn btn-primary btn-sm detail-btn" data-task-id="${task.id}">
                            Детали
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;

        // Добавляем обработчики для кнопок детализации
        this.attachDetailButtonListeners();

        // Добавляем обработчики для поиска и пагинации
        this.attachEventHandlers();
    },

    attachDetailButtonListeners() {
        const detailBtns = this.element.querySelectorAll('.detail-btn');
        console.log('Добавляем обработчики для кнопок детализации:', detailBtns.length);

        // Сохраняем ссылку на this для использования в обработчике
        const self = this;

        detailBtns.forEach(btn => {
            // Убираем все предыдущие обработчики
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            // Добавляем новый обработчик
            newBtn.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                const taskId = parseInt(this.dataset.taskId);
                console.log('Клик по кнопке детализации, ID задачи:', taskId);

                if (taskId && !isNaN(taskId)) {
                    self.loadTaskDetail(taskId);
                } else {
                    console.error('Неверный ID задачи:', this.dataset.taskId);
                }

                return false;
            });
        });
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
                this.state.pageSize = parseInt(e.target.value);
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
        if (this.modalElement) {
            this.modalElement.remove();
            this.modalElement = null;
        }

        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
};