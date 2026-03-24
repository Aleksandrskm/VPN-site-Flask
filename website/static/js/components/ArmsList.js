// js/components/ArmsList.js
import { armApi } from '../api/armApi.js';
import { TasksContext } from '../contexts/TasksContext.js';

export const ArmsList = {
    element: null,
    arms: [],
    unsubscribe: null,

    components: {
        checkboxesDiv: null,
        searchInput: null,
        selectAllBtn: null,
        clearAllBtn: null, // Добавляем кнопку "Снять все"
        errorMsg: null
    },

    currentProps: {
        selectedArms: [],
        onArmsChange: null,
        validationError: false
    },

    async create(selectedArms, onArmsChange, validationError) {
        const section = document.createElement('section');
        section.className = `arms-list ${validationError ? 'error' : ''}`;

        this.currentProps = { selectedArms, onArmsChange, validationError };
        this.element = section;

        const header = document.createElement('div');
        header.className = 'arms-header';

        const title = document.createElement('h3');
        title.textContent = 'Точки проверок:';

        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';

        const selectAllBtn = document.createElement('button');
        selectAllBtn.type = 'button';
        selectAllBtn.className = 'btn btn-secondary btn-sm';
        selectAllBtn.textContent = 'Выбрать все';
        this.components.selectAllBtn = selectAllBtn;

        const clearAllBtn = document.createElement('button');
        clearAllBtn.type = 'button';
        clearAllBtn.className = 'btn btn-secondary btn-sm';
        clearAllBtn.textContent = 'Снять все';
        this.components.clearAllBtn = clearAllBtn;

        buttonGroup.appendChild(selectAllBtn);
        buttonGroup.appendChild(clearAllBtn);

        header.appendChild(title);
        header.appendChild(buttonGroup);
        section.appendChild(header);

        // Сообщение об ошибке
        if (validationError) {
            this.components.errorMsg = document.createElement('div');
            this.components.errorMsg.className = 'error-message';
            this.components.errorMsg.textContent = 'Выберите хотя бы одну Точку проверок';
            section.appendChild(this.components.errorMsg);
        }

        const searchDiv = document.createElement('div');
        searchDiv.className = 'arms-search';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control';
        searchInput.placeholder = 'Поиск точек проверок';
        this.components.searchInput = searchInput;
        searchDiv.appendChild(searchInput);
        section.appendChild(searchDiv);

        const checkboxesDiv = document.createElement('div');
        checkboxesDiv.className = 'arms-checkboxes';
        this.components.checkboxesDiv = checkboxesDiv;
        section.appendChild(checkboxesDiv);

        // Загружаем список АРМов
        try {
            console.log('Загрузка списка АРМов...');
            this.arms = await armApi.getArms();
            console.log('Загружено АРМов:', this.arms.length);
            this.renderArms(this.arms, selectedArms, onArmsChange);

            // Обработчик поиска
            searchInput.addEventListener('input', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const searchTerm = e.target.value.toLowerCase();
                const filteredArms = this.arms.filter(arm =>
                    arm.name?.toLowerCase().includes(searchTerm) ||
                    arm.id?.toString().includes(searchTerm)
                );
                this.renderArms(filteredArms, this.currentProps.selectedArms, this.currentProps.onArmsChange);
            });

            // Обработчик "Выбрать все"
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Выбрать все АРМы');
                const allArmIds = this.arms.map(arm => arm.id);
                this.currentProps.onArmsChange(allArmIds);
            });

            // Обработчик "Снять все"
            clearAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Снять все АРМы');
                this.currentProps.onArmsChange([]);
            });

        } catch (error) {
            console.error('Error loading arms:', error);
            checkboxesDiv.innerHTML = '<div class="error">Ошибка загрузки списка АРМов</div>';
        }

        // Подписка на изменения контекста
        this.unsubscribe = TasksContext.subscribe((state) => {
            // Обновляем только если изменились выбранные АРМы
            if (JSON.stringify(state.selectedArms) !== JSON.stringify(this.currentProps.selectedArms)) {
                console.log('Обновление выбранных АРМов:', state.selectedArms);
                this.updateSelected(state.selectedArms);
            }
            // Обновляем ошибку валидации
            if (state.validationErrors.arms !== this.currentProps.validationError) {
                this.updateValidationError(state.validationErrors.arms);
            }
        });

        return section;
    },

    updateSelected(selectedArms) {
        this.currentProps.selectedArms = selectedArms;

        // Получаем текущий поисковый запрос
        const searchTerm = this.components.searchInput?.value.toLowerCase() || '';

        // Фильтруем arms по поиску
        const filteredArms = this.arms.filter(arm =>
            arm.name?.toLowerCase().includes(searchTerm) ||
            arm.id?.toString().includes(searchTerm)
        );

        // Перерисовываем только список чекбоксов
        this.renderArms(filteredArms, selectedArms, this.currentProps.onArmsChange);
    },

    updateValidationError(validationError) {
        this.currentProps.validationError = validationError;

        // Обновляем класс секции
        if (this.element) {
            this.element.className = `arms-list ${validationError ? 'error' : ''}`;
        }

        // Обновляем или создаем сообщение об ошибке
        if (validationError) {
            if (!this.components.errorMsg) {
                this.components.errorMsg = document.createElement('div');
                this.components.errorMsg.className = 'error-message';
                this.components.errorMsg.textContent = 'Выберите хотя бы одну Точку проверок';
                // Вставляем после header
                const header = this.element.querySelector('.arms-header');
                if (header) {
                    header.insertAdjacentElement('afterend', this.components.errorMsg);
                }
            }
        } else {
            if (this.components.errorMsg) {
                this.components.errorMsg.remove();
                this.components.errorMsg = null;
            }
        }
    },

    renderArms(armsToRender, selectedArms, onArmsChange) {
        const container = this.components.checkboxesDiv;
        if (!container) return;

        if (!armsToRender || armsToRender.length === 0) {
            container.innerHTML = '<div class="empty">Нет доступных АРМов</div>';
            return;
        }

        container.innerHTML = '';

        armsToRender.forEach(arm => {
            const div = document.createElement('div');
            div.className = 'arm-item';

            const label = document.createElement('label');
            label.className = 'checkbox-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = arm.id;
            checkbox.checked = selectedArms.includes(arm.id);

            checkbox.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log(`Чекбокс АРМ ${arm.id} изменен:`, e.target.checked);
                const newSelected = e.target.checked
                    ? [...selectedArms, arm.id]
                    : selectedArms.filter(id => id !== arm.id);
                onArmsChange(newSelected);
            });

            const span = document.createElement('span');
            span.className = 'item-text';
            span.textContent = `${arm.name || `АРМ #${arm.id}`} (ID: ${arm.id})`;

            label.appendChild(checkbox);
            label.appendChild(span);
            div.appendChild(label);
            container.appendChild(div);
        });
    },

    update(selectedArms, validationError) {
        this.updateSelected(selectedArms);
        this.updateValidationError(validationError);
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.components = {
            checkboxesDiv: null,
            searchInput: null,
            selectAllBtn: null,
            clearAllBtn: null,
            errorMsg: null
        };
        this.currentProps = {
            selectedArms: [],
            onArmsChange: null,
            validationError: false
        };
    }
};