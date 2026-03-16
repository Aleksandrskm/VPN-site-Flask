// Главный файл приложения
// Глобальный перехват отправки форм


import { Header } from './components/Header.js';
import { Modal } from './components/Modal.js';
import { ResultTestsTable } from './components/ResultTestsTable.js';
import { ViewPlanTasks } from './components/ViewPlanTasks.js';
import { FormTask } from './components/FormTask.js';
import { TableLists } from './components/TableLists.js';
import { TableView } from './components/TableView.js';


const App = {
    currentPage: 'results',
    currentContent: null, // Ссылка на текущий контент для очистки

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

    // Метод для очистки текущего контента
    destroyCurrentContent() {
        if (this.currentContent) {
            // Если у контента есть метод destroy, вызываем его
            if (this.currentContent.destroy) {
                console.log('Destroying current content:', this.currentContent.constructor?.name);
                this.currentContent.destroy();
            }

            // Очищаем все подписки в компонентах
            if (this.currentContent.unsubscribe) {
                this.currentContent.unsubscribe();
            }

            this.currentContent = null;
        }
    },

    async loadPage(page) {
        this.currentPage = page;

        const container = document.getElementById('page-container');
        container.innerHTML = '<div class="loading">Загрузка...</div>';

        try {
            // Уничтожаем предыдущий контент
            this.destroyCurrentContent();

            let content;

            switch(page) {
                case 'results':
                    content = await ResultTestsTable.create();
                    break;
                case 'plan':
                    content = await ViewPlanTasks.create();
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

            // Сохраняем ссылку на текущий контент
            this.currentContent = content;

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

        const leftColumn = document.createElement('div');
        leftColumn.className = 'left-column';

        const rightColumn = document.createElement('div');
        rightColumn.className = 'right-column';

        try {
            const tableLists = await TableLists.create();
            leftColumn.appendChild(tableLists);

            const tableView = TableView.create();
            rightColumn.appendChild(tableView);

            container.appendChild(leftColumn);
            container.appendChild(rightColumn);

            // Сохраняем ссылки для очистки
            container.destroy = () => {
                if (tableLists.destroy) tableLists.destroy();
                if (tableView.destroy) tableView.destroy();
            };

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

window.App = App;