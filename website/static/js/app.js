// Главный файл приложения
// Добавьте это в самое начало app.js, перед всеми импортами
// Глобальный перехват отправки форм
document.addEventListener('submit', (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🛑 Global form submit prevented');
    return false;
}, true); // Используем capturing phase для перехвата до других обработчиков

// Глобальный перехват кликов по кнопкам submit
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.tagName === 'BUTTON' && target.type === 'submit') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛑 Global submit button click prevented');
        return false;
    }
}, true);

// Глобальный перехват нажатия Enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        e.stopPropagation();
        console.log('🛑 Global Enter key prevented');
        return false;
    }
}, true);
import { Header } from './components/Header.js';
import { Modal } from './components/Modal.js';
import { ResultTestsTable } from './components/ResultTestsTable.js';
import { FormTask } from './components/FormTask.js';
import { TableLists } from './components/TableLists.js';
import { TableView } from './components/TableView.js';

const App = {
    currentPage: 'results',

    async init() {
        try {
            // Рендерим хедер
            const headerContainer = document.getElementById('header');
            const header = Header.create();
            headerContainer.parentNode.replaceChild(header, headerContainer);

            // Создаем модальное окно
            Modal.create();

            // Настраиваем навигацию
            this.setupNavigation();

            // Загружаем начальную страницу
            await this.loadPage('results');
        } catch (error) {
            console.error('Error initializing app:', error);
            document.getElementById('page-container').innerHTML = `
                <div class="error">
                    <h3>Ошибка инициализации приложения</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Обновить страницу
                    </button>
                </div>
            `;
        }
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

        try {
            // Добавляем список таблиц слева
            const tableLists = await TableLists.create();
            leftColumn.appendChild(tableLists);

            // Добавляем просмотр таблицы справа
            const tableView = TableView.create();
            rightColumn.appendChild(tableView);

            container.appendChild(leftColumn);
            container.appendChild(rightColumn);
        } catch (error) {
            console.error('Error creating data editor:', error);
            container.innerHTML = `
                <div class="error">
                    <h3>Ошибка загрузки редактора данных</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }

        return container;
    }
};

// Запускаем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Для отладки - делаем App доступным глобально
window.App = App;