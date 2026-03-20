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
        isDetailLoading: false,
        showScreenshots: false
    },

    async create() {
        const section = document.createElement('section');
        section.className = 'view-tasks-section';

        section.innerHTML = `
            <div class="tasks-header">
                <h2>Завершенные задачи</h2>
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
        this.createModal();
        await this.loadTasks();

        return section;
    },

    createModal() {
        if (document.getElementById('task-detail-modal')) {
            this.modalElement = document.getElementById('task-detail-modal');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-detail-overlay';
        modal.id = 'task-detail-modal';
        modal.style.display = 'none';

        modal.innerHTML = `
            <div class="modal-detail-content">
                <div class="modal-detail-header">
                    <h3>Результаты задачи</h3>
                    <button class="modal-detail-close">&times;</button>
                </div>
                <div class="modal-detail-info" id="modal-task-info"></div>
                <div class="modal-detail-controls">
                    <label class="screenshot-toggle">
                        <input type="checkbox" id="show-screenshots-checkbox">
                        <span>Показывать скриншоты</span>
                    </label>
                </div>
                <div class="modal-detail-body" id="modal-body">
                    <div class="loading-state">Загрузка...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modalElement = modal;

        const closeBtn = modal.querySelector('.modal-detail-close');
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.closeModal();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        const screenshotCheckbox = modal.querySelector('#show-screenshots-checkbox');
        screenshotCheckbox.addEventListener('change', (e) => {
            this.state.showScreenshots = e.target.checked;
            if (this.state.taskDetail) {
                this.renderTaskDetail();
            }
        });
    },

    closeModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'none';
            this.state.taskDetail = null;
            this.state.showScreenshots = false;

            const checkbox = this.modalElement.querySelector('#show-screenshots-checkbox');
            if (checkbox) checkbox.checked = false;

            setTimeout(() => {
                this.refreshEventHandlers();
            }, 100);
        }
    },

    openModal() {
        if (this.modalElement) {
            this.modalElement.style.display = 'flex';
        }
    },

    updatePageSizeSelect() {
        const select = this.element.querySelector('#page-size');
        if (select) {
            select.value = this.state.pageSize.toString();
        }
    },

    refreshEventHandlers() {
        this.attachDetailButtonListeners();
        this.attachEventHandlers();
        this.attachPaginationEvents();
        this.updatePageSizeSelect();
    },

    async loadTasks() {
        const tableContainer = this.element.querySelector('#tasks-table-container');
        tableContainer.innerHTML = '<div class="loading-state">Загрузка...</div>';

        try {
            const response = await taskApi.getTasks(this.state.currentPage, this.state.pageSize, 'completed');

            if (response && response.tasks) {
                this.state.tasks = response.tasks.map(task => ({
                    id: task.id,
                    workstation_id: task.workstation_id || '0',
                    workstation_ip: task.workstation_ip || '-',
                    started_at: task.started_at,
                    completed_at: task.completed_at,
                    duration_str: task.duration_str,
                    status: task.status,
                    config: task.config ? JSON.parse(task.config) : null,
                    vpn_total: task.vpn_total || 0,
                    vpn_connected: task.vpn_connected,
                    vpn_failed: task.vpn_failed,
                    sites_total: task.sites_total || 0,
                    sites_checked: task.sites_checked,
                    sites_available: task.sites_available,
                    sites_unavailable: task.sites_unavailable,
                    programs_total: task.programs_total || 0,
                    programs_checked: task.programs_checked,
                    programs_available: task.programs_available,
                    programs_unavailable: task.programs_unavailable,
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

    async loadTaskDetail(taskId, taskRowData = null) {
        this.state.isDetailLoading = true;
        this.state.taskDetail = null;
        this.currentTaskRowData = taskRowData;

        const modalBody = this.modalElement.querySelector('#modal-body');
        const modalInfo = this.modalElement.querySelector('#modal-task-info');

        modalBody.innerHTML = '<div class="loading-state">Загрузка...</div>';

        if (taskRowData) {
            modalInfo.innerHTML = this.renderTaskInfo(taskRowData);
        } else {
            modalInfo.innerHTML = '';
        }

        this.openModal();

        try {
            const detail = await taskApi.getTaskDetail(taskId);
            this.state.taskDetail = detail;
            this.renderTaskDetail();
        } catch (error) {
            console.error('Ошибка загрузки деталей:', error);
            modalBody.innerHTML = `<div class="error-state">Ошибка: ${error.message}</div>`;
        } finally {
            this.state.isDetailLoading = false;
        }
    },

    renderTaskInfo(taskRowData) {
        return `
            <div class="task-info-grid">
                <div class="task-info-item">
                    <span class="task-info-label">ID задачи:</span>
                    <span class="task-info-value">${taskRowData.id || '-'}</span>
                </div>
                <div class="task-info-item">
                    <span class="task-info-label">Рабочее место:</span>
                    <span class="task-info-value">${taskRowData.workstation_id || '0'}</span>
                </div>
                <div class="task-info-item">
                    <span class="task-info-label">IP-адрес:</span>
                    <span class="task-info-value">${taskRowData.workstation_ip || '0'}</span>
                </div>
                <div class="task-info-item">
                    <span class="task-info-label">Дата и время начала:</span>
                    <span class="task-info-value">${taskRowData.started_at ? DateUtils.getDateTime(new Date(taskRowData.started_at)) : '-'}</span>
                </div>
                <div class="task-info-item">
                    <span class="task-info-label">Дата и время окончания:</span>
                    <span class="task-info-value">${taskRowData.completed_at ? DateUtils.getDateTime(new Date(taskRowData.completed_at)) : '-'}</span>
                </div>
                <div class="task-info-item">
                    <span class="task-info-label">Конфигурация:</span>
                    <span class="task-info-value">${this.formatConfig(taskRowData.config)}</span>
                </div>
            </div>
        `;
    },

    openScreenshotInNewWindow(imageSrc) {
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
                    <\/script>
                </body>
                </html>
            `);
            newWindow.document.close();
        } else {
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

        let html = '<div class="task-detail-container">';

        // Результаты проверки приложений
        html += '<details class="detail-section" open>';
        html += '<summary><h4>Результаты проверки приложений</h4></summary>';
        html += '<div class="details-content">';
        html += this.renderResultsTable(detail.programs_results || [], 'program');
        html += '</div></details>';

        // Результаты проверки сайтов
        html += '<details class="detail-section" open>';
        html += '<summary><h4>Результаты проверки сайтов</h4></summary>';
        html += '<div class="details-content">';
        html += this.renderResultsTable(detail.sites_results || [], 'site');
        html += '</div></details>';

        // Ошибки VPN
        html += '<details class="detail-section" open>';
        html += '<summary><h4>Ошибки VPN</h4></summary>';
        html += '<div class="details-content">';
        html += this.renderErrorsTable(detail.unconnected_vpns || [], 'vpn');
        html += '</div></details>';

        // Ошибки приложений
        html += '<details class="detail-section" open>';
        html += '<summary><h4>Ошибки приложений</h4></summary>';
        html += '<div class="details-content">';
        html += this.renderErrorsTable(detail.unconnected_programs || [], 'program');
        html += '</div></details>';

        // Ошибки сайтов
        html += '<details class="detail-section" open>';
        html += '<summary><h4>Ошибки сайтов</h4></summary>';
        html += '<div class="details-content">';
        html += this.renderErrorsTable(detail.unconnected_sites || [], 'site');
        html += '</div></details>';

        html += '</div>';
        modalBody.innerHTML = html;

        if (this.state.showScreenshots) {
            this.attachScreenshotHandlers();
        }
        this.preventSummaryBubbling();
    },

    renderResultsTable(items, type) {
        const showScreenshots = this.state.showScreenshots;

        // Если нет данных, показываем пустую таблицу с заголовками
        if (!items || items.length === 0) {
            return `
                <div class="results-table-wrapper">
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>VPN</th>
                                <th>${type === 'program' ? 'Приложение' : 'Сайт'}</th>
                                <th>Доступ</th>
                                <th>Текст доступности</th>
                                ${showScreenshots ? '<th>Скриншот</th>' : ''}
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="${showScreenshots ? 5 : 4}" class="empty-table-row">Нет данных</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        let html = `
            <div class="results-table-wrapper">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>VPN</th>
                            <th>${type === 'program' ? 'Приложение' : 'Сайт'}</th>
                            <th>Доступ</th>
                            <th>Текст доступности</th>
                            ${showScreenshots ? '<th>Скриншот</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

        items.forEach(item => {
            const imageSrc = item.SCR ? `data:image/png;base64,${item.SCR}` : null;
            const dostupClass = item.DOSTUP === 1 ? 'status-available' : 'status-unavailable';
            const dostupText = item.DOSTUP === 1 ? 'Доступен' : 'Недоступен';
            const dostupTText = item.DOSTUP_T || '-';

            html += `
                <tr>
                    <td class="vpn-cell">${item.VPN || '-'}</td>
                    <td class="target-cell">${type === 'program' ? (item.PRG || '-') : (item.SITE || '-')}</td>
                    <td class="status-cell ${dostupClass}">${dostupText}</td>
                    <td class="dostup-t-cell">${dostupTText}</td>
            `;

            if (showScreenshots) {
                if (imageSrc) {
                    html += `
                        <td class="screenshot-cell">
                            <img src="${imageSrc}" class="screenshot-img" data-src="${imageSrc}" alt="Скриншот" loading="lazy">
                        </td>
                    `;
                } else {
                    html += `<td class="screenshot-cell">—</td>`;
                }
            }

            html += `</tr>`;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    },

    renderErrorsTable(items, type) {
        // Если нет данных, показываем пустую таблицу с заголовками
        if (!items || items.length === 0) {
            return `
                <div class="results-table-wrapper">
                    <table class="results-table errors-table">
                        <thead>
                            <tr>
                                <th>${type === 'vpn' ? 'VPN' : (type === 'program' ? 'Приложение' : 'Сайт')}</th>
                                <th>Ошибка</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td colspan="2" class="empty-table-row">Нет данных</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        let html = `
            <div class="results-table-wrapper">
                <table class="results-table errors-table">
                    <thead>
                        <tr>
                            <th>${type === 'vpn' ? 'VPN' : (type === 'program' ? 'Приложение' : 'Сайт')}</th>
                            <th>Ошибка</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        items.forEach(item => {
            let name = '-';
            let error = 'Ошибка подключения';

            if (typeof item === 'object') {
                if (type === 'vpn') {
                    name = item.VPN || '-';
                    error = item.ERR || 'Ошибка подключения';
                } else if (type === 'program') {
                    name = item.PRG || '-';
                    error = item.ERR || 'Ошибка подключения';
                } else if (type === 'site') {
                    name = item.SITE || '-';
                    error = item.ERR || 'Ошибка подключения';
                }
            } else {
                name = item;
            }

            html += `
                <tr>
                    <td class="error-name">${name}</td>
                    <td class="error-message-cell">${error}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    },

    attachScreenshotHandlers() {
        const screenshots = this.modalElement.querySelectorAll('.screenshot-img');

        screenshots.forEach(img => {
            const newImg = img.cloneNode(true);
            img.parentNode.replaceChild(newImg, img);

            newImg.style.cursor = 'pointer';
            newImg.title = 'Нажмите для увеличения';

            newImg.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const imageSrc = newImg.dataset.src;
                if (imageSrc) {
                    this.openScreenshotInNewWindow(imageSrc);
                }
            });
        });
    },

    preventSummaryBubbling() {
        const summaries = this.modalElement.querySelectorAll('summary');

        summaries.forEach(summary => {
            const newSummary = summary.cloneNode(true);
            summary.parentNode.replaceChild(newSummary, summary);

            newSummary.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            const summaryChildren = newSummary.querySelectorAll('*');
            summaryChildren.forEach(child => {
                child.addEventListener('click', (e) => {
                    e.stopPropagation();
                });
            });
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
                        <th>Рабочее место</th>
                        <th>IP-адрес</th>
                        <th>Дата и время начала проверки</th>
                        <th>Дата и время окончания проверки</th>
                        <th>Время выполнения задачи</th>
                        <th>Статус</th>
                        <th colspan="3" class="section-header">VPN</th>
                        <th colspan="4" class="section-header">Сайты</th>
                        <th colspan="4" class="section-header">Приложения</th>
                        <th>Комментарий к проверке</th>
                        <th>Конфигурация задачи</th>
                        <th>Детализация</th>
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
                        <th></th>
                    </tr>
                </thead>
                <tbody>
        `;

        displayTasks.forEach(task => {
            html += `
                <tr class="task-row status-${this.getStatusClass(task.status)}">
                    <td class="task-id">${task.id || '0'}</td>
                    <td class="task-workstation-id">${task.workstation_id}</td>
                    <td class="task-workstation-ip">${task.workstation_ip}</td>
                    <td class="task-time">${task.started_at ? DateUtils.getDateTime(new Date(task.started_at)) : '-'}</td>
                    <td class="task-time">${task.completed_at ? DateUtils.getDateTime(new Date(task.completed_at)) : '-'}</td>
                    <td class="task-duration">${task.duration_str || '-'}</td>
                    <td class="task-status">${this.getStatusText(task.status)}</td>
                    
                    <td class="task-stats">${task.vpn_total}</td>
                    <td class="task-stats ${this.getConnectedClass(task.vpn_connected, task.vpn_total)}">${task.vpn_connected ?? '-'}</td>
                    <td class="task-stats ${this.getFailedClass(task.vpn_failed)}">${task.vpn_failed ?? '-'}</td>
                    
                    <td class="task-stats">${task.sites_total}</td>
                    <td class="task-stats">${task.sites_checked ?? '-'}</td>
                    <td class="task-stats ${this.getAvailableClass(task.sites_available)}">${task.sites_available ?? '-'}</td>
                    <td class="task-stats ${this.getUnavailableClass(task.sites_unavailable)}">${task.sites_unavailable ?? '-'}</td>
                    
                    <td class="task-stats">${task.programs_total}</td>
                    <td class="task-stats">${task.programs_checked ?? '-'}</td>
                    <td class="task-stats ${this.getAvailableClass(task.programs_available)}">${task.programs_available ?? '-'}</td>
                    <td class="task-stats ${this.getUnavailableClass(task.programs_unavailable)}">${task.programs_unavailable ?? '-'}</td>
                    
                    <td class="task-comment">${task.comment}</td>
                    <td class="task-config">${this.formatConfig(task.config)}</td>
                    <td class="task-actions">
                        <button class="btn btn-primary btn-sm detail-btn" data-task-id="${task.id}" data-task-data='${JSON.stringify(task)}'>
                            Детализация
                        </button>
                    </td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
        this.attachDetailButtonListeners();
        this.attachEventHandlers();
    },

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

    attachDetailButtonListeners() {
        const detailBtns = this.element.querySelectorAll('.detail-btn');
        const self = this;

        detailBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

                const taskId = parseInt(this.dataset.taskId);
                let taskData = null;

                try {
                    if (this.dataset.taskData) {
                        taskData = JSON.parse(this.dataset.taskData);
                    }
                } catch (e) {
                    console.error('Ошибка парсинга данных задачи:', e);
                }

                if (taskId && !isNaN(taskId)) {
                    self.loadTaskDetail(taskId, taskData);
                }

                return false;
            });
        });
    },

    attachEventHandlers() {
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
                Страница ${this.state.currentPage} из ${this.state.totalPages} | Задачи: ${start}-${end} из ${this.state.totalTasks}
            </div>
            <div class="pagination-controls">
                <button type="button" class="btn btn-secondary btn-sm" id="prev-page" ${this.state.currentPage === 1 ? 'disabled' : ''}>←</button>
        `;

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
            html += `<button type="button" class="btn ${page === this.state.currentPage ? 'btn-primary' : 'btn-secondary'} btn-sm page-btn" data-page="${page}">${page}</button>`;
            lastPage = page;
        });

        html += `<button type="button" class="btn btn-secondary btn-sm" id="next-page" ${this.state.currentPage === this.state.totalPages ? 'disabled' : ''}>→</button></div>`;

        container.innerHTML = html;
        this.attachPaginationEvents();
    },

    attachPaginationEvents() {
        const prevBtn = this.element.querySelector('#prev-page');
        if (prevBtn) {
            const newPrevBtn = prevBtn.cloneNode(true);
            prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
            newPrevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!newPrevBtn.disabled && this.state.currentPage > 1) {
                    this.state.currentPage--;
                    this.state.searchQuery = '';
                    const input = this.element.querySelector('.search-input');
                    if (input) input.value = '';
                    this.loadTasks();
                }
            });
        }

        const nextBtn = this.element.querySelector('#next-page');
        if (nextBtn) {
            const newNextBtn = nextBtn.cloneNode(true);
            nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
            newNextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!newNextBtn.disabled && this.state.currentPage < this.state.totalPages) {
                    this.state.currentPage++;
                    this.state.searchQuery = '';
                    const input = this.element.querySelector('.search-input');
                    if (input) input.value = '';
                    this.loadTasks();
                }
            });
        }

        const pageBtns = this.element.querySelectorAll('.page-btn');
        pageBtns.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const page = parseInt(newBtn.dataset.page);
                if (page && page !== this.state.currentPage) {
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
        if (status === 2) return 'completed';
        if (status === -1) return 'failed';
        return 'unknown';
    },

    getStatusText(status) {
        const map = { 2: 'Завершена', '-1': 'Ошибка' };
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