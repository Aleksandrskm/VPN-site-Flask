// Главный файл приложения
const App = {
    currentPage: 'results',

    async init() {
        // Рендерим хедер
        const header = Header.create();
        document.getElementById('header').replaceWith(header);

        // Создаем модальное окно
        Modal.create();

        // Настраиваем навигацию
        this.setupNavigation();

        // Загружаем начальную страницу
        await this.loadPage('results');
    },

    setupNavigation() {
        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const page = e.target.dataset.page;

                // Обновляем активный класс
                document.querySelectorAll('.main-nav a').forEach(l => l.classList.remove('active'));
                e.target.classList.add('active');

                await this.loadPage(page);
            });
        });
    },

    async loadPage(page) {
        this.currentPage = page;

        const container = document.getElementById('page-container');
        container.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            let content;

            switch(page) {
                case 'results':
                    content = await ResultTestsTable.create();
                    break;

                case 'task-manager':
                    // FormTask.create() теперь асинхронный!
                    content = await FormTask.create();
                    break;

                case 'data-editor':
                    content = await this.createDataEditor();
                    break;

                default:
                    content = document.createElement('div');
                    content.textContent = 'Страница не найдена';
            }

            container.innerHTML = '';
            container.appendChild(content);

        } catch (error) {
            console.error('Error loading page:', error);
            container.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки страницы</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Обновить страницу
                    </button>
                </div>
            `;
        }
    },

    async createDataEditor() {
        const container = document.createElement('div');
        container.className = 'data-editor';

        // Создаем две колонки
        const leftColumn = document.createElement('div');
        leftColumn.className = 'left-column';

        const rightColumn = document.createElement('div');
        rightColumn.className = 'right-column';

        // Добавляем список таблиц слева
        const tableLists = await TableLists.create();
        leftColumn.appendChild(tableLists);

        // Добавляем просмотр таблицы справа
        const tableView = TableView.create();
        rightColumn.appendChild(tableView);

        container.appendChild(leftColumn);
        container.appendChild(rightColumn);

        return container;
    }
};

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});