export const ViewPlanTasks = {
    element: null,
    unsubscribe: null,

    async create() {
        const section = document.createElement('section');
        section.className = 'result-tests-section';

        // Создаем пустую страницу с заглушкой
        section.innerHTML = `
            <div class="empty-results">
                <div class="empty-icon"></div>
                <h2>Просмотр планируемых задач</h2>
                <p>Здесь будут отображаться планируемые задачи</p>
                <p class="coming-soon">В разработке</p>
            </div>
        `;

        this.element = section;

        // Добавляем стили для пустой страницы
        this.addStyles();

        return section;
    },

    addStyles() {
        // Проверяем, есть ли уже стили
        if (document.getElementById('results-empty-styles')) return;

        const style = document.createElement('style');
        style.id = 'results-empty-styles';
        style.textContent = `
            .empty-results {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 400px;
                text-align: center;
                background: white;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .empty-icon {
                font-size: 64px;
                margin-bottom: 20px;
                opacity: 0.5;
            }
            
            .empty-results h2 {
                color: #333;
                margin-bottom: 10px;
                font-size: 24px;
            }
            
            .empty-results p {
                color: #666;
                margin-bottom: 5px;
                font-size: 16px;
            }
            
            .empty-results .coming-soon {
                margin-top: 20px;
                color: #999;
                font-style: italic;
                font-size: 14px;
            }
        `;

        document.head.appendChild(style);
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        // Удаляем стили при уничтожении компонента
        const style = document.getElementById('results-empty-styles');
        if (style) {
            style.remove();
        }
    }
};