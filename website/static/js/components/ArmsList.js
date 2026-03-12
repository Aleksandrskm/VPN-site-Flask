const ArmsList = {
    element: null,
    arms: [],
    unsubscribe: null,

    async create(selectedArms, onArmsChange, validationError) {
        const section = document.createElement('section');
        section.className = `arms-list ${validationError ? 'error' : ''}`;

        const header = document.createElement('div');
        header.className = 'arms-header';

        const title = document.createElement('h3');
        title.textContent = 'Выберите АРМы для тестирования';

        const selectAllBtn = document.createElement('button');
        selectAllBtn.className = 'btn btn-secondary btn-sm';
        selectAllBtn.textContent = 'Выбрать все';

        header.appendChild(title);
        header.appendChild(selectAllBtn);
        section.appendChild(header);

        if (validationError) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Выберите хотя бы один АРМ';
            section.appendChild(errorMsg);
        }

        const searchDiv = document.createElement('div');
        searchDiv.className = 'arms-search';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control';
        searchInput.placeholder = 'Поиск АРМов...';
        searchDiv.appendChild(searchInput);
        section.appendChild(searchDiv);

        const checkboxesDiv = document.createElement('div');
        checkboxesDiv.className = 'arms-checkboxes';
        section.appendChild(checkboxesDiv);

        this.element = section;

        // Загружаем список АРМов
        try {
            this.arms = await armApi.getArms();
            this.renderArms(checkboxesDiv, this.arms, selectedArms, onArmsChange);

            // Обработчик поиска
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredArms = this.arms.filter(arm =>
                    arm.name?.toLowerCase().includes(searchTerm) ||
                    arm.id?.toString().includes(searchTerm)
                );
                this.renderArms(checkboxesDiv, filteredArms, selectedArms, onArmsChange);
            });

            // Обработчик "Выбрать все"
            selectAllBtn.addEventListener('click', () => {
                const allArmIds = this.arms.map(arm => arm.id);
                onArmsChange(allArmIds);
                this.renderArms(checkboxesDiv, this.arms, allArmIds, onArmsChange);
            });

        } catch (error) {
            console.error('Error loading arms:', error);
            checkboxesDiv.innerHTML = '<div class="error">Ошибка загрузки списка АРМов</div>';
        }

        // Подписка на изменения
        this.unsubscribe = TasksContext.subscribe((state) => {
            if (state.selectedArms !== selectedArms) {
                this.renderArms(checkboxesDiv, this.arms, state.selectedArms, onArmsChange);
            }
        });

        return section;
    },

    renderArms(container, arms, selectedArms, onArmsChange) {
        if (!arms || arms.length === 0) {
            container.innerHTML = '<div class="empty">Нет доступных АРМов</div>';
            return;
        }

        container.innerHTML = '';

        arms.forEach(arm => {
            const div = document.createElement('div');
            div.className = 'arm-item';

            const label = document.createElement('label');
            label.className = 'checkbox-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = arm.id;
            checkbox.checked = selectedArms.includes(arm.id);

            checkbox.addEventListener('change', (e) => {
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

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
};