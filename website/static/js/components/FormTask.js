const FormTask = {
    element: null,
    unsubscribe: null,

    async create() {
        const section = document.createElement('section');
        section.className = 'page-section';

        // Показываем загрузку сразу
        section.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Подготовка формы...</p>
            </div>
        `;

        this.element = section;

        // Загружаем конфиг перед рендерингом
        console.log('FormTask.create: загружаем конфиг...');
        await TasksContext.loadConfig();
        console.log('FormTask.create: конфиг загружен');

        // Очищаем и создаем форму
        section.innerHTML = '';

        const form = document.createElement('form');
        form.className = 'form-task';
        section.appendChild(form);

        // Подписываемся на изменения контекста
        this.unsubscribe = TasksContext.subscribe((state) => {
            this.render(state);
        });

        // Первоначальный рендер
        this.render(TasksContext.getState());

        return section;
    },

    render(state) {
        if (!this.element) return;

        const form = this.element.querySelector('.form-task');
        if (!form) return;

        // Проверяем загрузку конфига
        if (state.isConfigLoading) {
            form.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>Загрузка конфигурации задачи...</p>
                </div>
            `;
            return;
        }

        // Проверяем ошибки загрузки
        if (state.apiError) {
            form.innerHTML = `
                <div class="error-container">
                    <h3>Ошибка загрузки</h3>
                    <p>${state.apiError}</p>
                    <p>Проверьте подключение к серверу: ${API_CONFIG.baseUrl}</p>
                    <div class="button-group">
                        <button class="btn btn-primary" onclick="location.reload()">Обновить страницу</button>
                        <button class="btn btn-secondary" onclick="FormTask.retryLoad()">Повторить загрузку</button>
                    </div>
                </div>
            `;
            return;
        }

        // Проверяем наличие данных
        if (!state.taskConfig ||
            (!state.taskConfig.vpns?.length &&
                !state.taskConfig.urls?.length &&
                !state.taskConfig.programs?.length)) {

            form.innerHTML = `
                <div class="info-container">
                    <p>Нет данных для отображения</p>
                    <button class="btn btn-primary" onclick="FormTask.retryLoad()">
                        Загрузить конфигурацию
                    </button>
                </div>
            `;
            return;
        }

        // Если все хорошо, рендерим форму
        form.innerHTML = '';

        // Добавляем ArmsList
        this.renderArmsList(form, state);

        // Добавляем категории
        this.renderCategories(form, state);

        // Добавляем ScheduleBlock
        this.renderScheduleBlock(form, state);

        // Добавляем результат если есть
        if (state.tasksResult) {
            this.renderResult(form, state.tasksResult);
        }

        // Добавляем кнопку отправки
        this.renderSubmitButton(form, state);
    },

    // Метод для повторной загрузки
    static retryLoad() {
    const formTask = document.querySelector('.page-section');
    if (formTask && FormTask.instance) {
        FormTask.instance.loadConfigAndRender();
    }
},

async loadConfigAndRender() {
    if (!this.element) return;

    this.element.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Загрузка конфигурации...</p>
            </div>
        `;

    await TasksContext.resetConfig(); // Сбрасываем флаг загрузки
    await TasksContext.loadConfig();

    // Пересоздаем форму
    this.element.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'form-task';
    this.element.appendChild(form);

    this.render(TasksContext.getState());
},

async renderArmsList(form, state) {
    const armsList = await ArmsList.create(
        state.selectedArms,
        (selected) => TasksContext.handleArmsChange(selected),
        state.validationErrors.arms
    );
    form.appendChild(armsList);
},

renderCategories(form, state) {
    const categoriesRow = document.createElement('section');
    categoriesRow.className = 'categories-row';

    const getCategoryTitle = (category) => {
        const titles = {
            vpns: 'VPN - приложения',
            urls: 'Сайты (URL)',
            programs: 'Приложения'
        };
        return titles[category] || category.toUpperCase();
    };

    Object.entries(state.taskConfig).forEach(([category, items]) => {
        if (!items || items.length === 0) return; // Пропускаем пустые категории

        const article = document.createElement('article');
        article.className = `category ${state.validationErrors[category] ? 'error' : ''}`;

        const title = document.createElement('h3');
        title.innerHTML = `
                ${getCategoryTitle(category)}
                ${state.validationErrors[category] ? '<span class="error-badge">Обязательно для выбора</span>' : ''}
            `;
        article.appendChild(title);

        const controls = document.createElement('div');
        controls.className = 'category-controls';
        controls.innerHTML = `
                <button type="button" class="btn btn-secondary btn-sm">Выбрать все</button>
                <button type="button" class="btn btn-secondary btn-sm">Снять все</button>
                <span class="${state.validationErrors[category] ? 'error-count' : ''}">
                    Выбрано: ${state.selectedItems[category]?.length || 0}/${items.length}
                </span>
            `;
        article.appendChild(controls);

        if (state.validationErrors[category]) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Выберите хотя бы один элемент в этой категории';
            article.appendChild(errorMsg);
        }

        const list = document.createElement('ul');
        list.className = 'items-list';

        items.forEach((item, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                    <label class="checkbox-label">
                        <input type="checkbox" ${state.isChecked(category, item) ? 'checked' : ''}>
                        <span class="item-text">${item}</span>
                    </label>
                `;

            const checkbox = li.querySelector('input');
            checkbox.addEventListener('change', (e) => {
                TasksContext.handleCheckboxChange(category, item, e.target.checked);
            });

            list.appendChild(li);
        });

        article.appendChild(list);
        categoriesRow.appendChild(article);

        // Обработчики для кнопок
        const [selectAllBtn, clearAllBtn] = controls.querySelectorAll('button');
        selectAllBtn.addEventListener('click', () => TasksContext.handleSelectAll(category, items));
        clearAllBtn.addEventListener('click', () => TasksContext.handleClearAll(category));
    });

    form.appendChild(categoriesRow);
},

renderScheduleBlock(form, state) {
    const scheduleBlock = ScheduleBlock.create({
        startDate: state.startDate,
        startTime: state.startTime,
        onDateChange: (date) => TasksContext.handleDateChange(date),
        onTimeChange: (time) => TasksContext.handleTimeChange(time),
        scheduleType: state.scheduleType,
        onScheduleTypeChange: (type) => TasksContext.handleScheduleTypeChange(type),
        interval: state.interval,
        onIntervalChange: (field, value) => TasksContext.handleIntervalChange(field, value),
        startDateTime: state.startDateTime,
        onStartDateTimeChange: (field, value) => TasksContext.handleStartDateTimeChange(field, value),
        endDateTime: state.endDateTime,
        onEndDateTimeChange: (field, value) => TasksContext.handleEndDateTimeChange(field, value)
    });

    form.appendChild(scheduleBlock);
},

renderResult(form, result) {
    const resultDiv = document.createElement('div');
    resultDiv.className = `result-block ${result.success ? 'success' : 'error'}`;
    resultDiv.textContent = result.success
        ? `${result.message || ''}`
        : `Ошибка: ${result.error}`;
    form.appendChild(resultDiv);
},

renderSubmitButton(form, state) {
    const button = document.createElement('button');
    button.type = 'submit';
    button.className = 'submit-button';
    button.disabled = state.isLoading || state.isConfigLoading;
    button.textContent = state.isLoading ? 'Отправка...' : 'Поставить задачу';

    button.addEventListener('click', async (e) => {
        e.preventDefault();
        await TasksContext.submitForm();
    });

    form.appendChild(button);
},

destroy() {
    if (this.unsubscribe) {
        this.unsubscribe();
    }
}
};

// Сохраняем ссылку на экземпляр для статических методов
FormTask.instance = null;