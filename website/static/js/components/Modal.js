const Modal = {
    element: null,
    unsubscribe: null,

    create() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'modal';

        const content = document.createElement('div');
        content.className = 'modal-content';
        modal.appendChild(content);

        this.element = modal;

        // Подписываемся на изменения контекста
        this.unsubscribe = ModalContext.subscribe((state) => {
            this.update(state);
        });

        // Закрытие по клику вне модалки
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ModalContext.closeModal();
            }
        });

        document.body.appendChild(modal);

        return modal;
    },

    update(state) {
        if (!this.element) return;

        if (state.isOpen) {
            this.element.classList.add('show');
            this.renderContent(state);
        } else {
            this.element.classList.remove('show');
        }
    },

    renderContent(state) {
        const content = this.element.querySelector('.modal-content');
        if (!content) return;

        const { modalData, row } = state;
        const [formData, setFormData] = [row || {}, (newData) => {
            Object.assign(formData, newData);
        }];

        const getTitle = () => {
            switch(modalData.action) {
                case 'add': return 'Добавление';
                case 'edit': return 'Редактирование';
                case 'copy': return 'Копирование';
                case 'delete': return 'Удаление';
                default: return 'Модальное окно';
            }
        };

        content.innerHTML = `
            <div class="modal-header">
                <h2>${getTitle()}</h2>
                <button class="close-btn" onclick="ModalContext.closeModal()">&times;</button>
            </div>
            <form id="modal-form">
                <div class="modal-body">
                    ${this.renderFormFields(modalData, row)}
                </div>
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">${getTitle()}</button>
                    <button type="button" class="btn btn-secondary" onclick="ModalContext.closeModal()">Закрыть</button>
                </div>
            </form>
        `;

        const form = content.querySelector('#modal-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(modalData, formData);
        });

        // Добавляем обработчики для инпутов
        this.attachInputHandlers(content, formData, setFormData);
    },

    renderFormFields(modalData, row) {
        if (!modalData.data) return '';

        if (row && modalData.action !== 'delete') {
            return Object.entries(row).map(([key]) => {
                const fieldInfo = modalData.data.find(item => item.name === key);
                return `
                    <div class="form-group">
                        <label>${fieldInfo?.description || key}</label>
                        <input 
                            type="text" 
                            class="form-control" 
                            data-field="${key}"
                            value="${row[key] === null ? '' : row[key]}"
                        />
                    </div>
                `;
            }).join('');
        } else {
            return modalData.data.map(item => `
                <div class="form-group">
                    <label>${item.description}</label>
                    <input 
                        type="text" 
                        class="form-control" 
                        data-field="${item.name}"
                    />
                </div>
            `).join('');
        }
    },

    attachInputHandlers(container, formData, setFormData) {
        container.querySelectorAll('input[data-field]').forEach(input => {
            const field = input.dataset.field;
            input.addEventListener('input', (e) => {
                const newData = { ...formData };
                newData[field] = e.target.value === '' ? null : e.target.value;
                setFormData(newData);
            });
        });
    },

    async handleSubmit(modalData, formData) {
        const { selectedTableName } = TableContext.getState();

        if (!selectedTableName) {
            alert('Не выбрана таблица');
            return;
        }

        try {
            let response;
            let apiData;

            switch(modalData.action) {
                case 'add':
                    apiData = { row: formData };
                    console.log('Add data:', apiData);
                    response = await dbApi.insertRow(selectedTableName, apiData);
                    break;

                case 'edit':
                    if (!formData.ID) {
                        throw new Error('Отсутствует ID записи для редактирования');
                    }

                    const { ID, ...updates } = formData;

                    apiData = {
                        updates: updates,
                        where: {
                            column: "ID",
                            operator: "=",
                            value: ID
                        }
                    };
                    console.log('Edit data:', apiData);
                    response = await dbApi.editRow(selectedTableName, apiData);
                    break;

                case 'copy':
                    const { ID: copyId, ...copyData } = formData;

                    apiData = { row: copyData };
                    console.log('Copy data:', apiData);
                    response = await dbApi.insertRow(selectedTableName, apiData);
                    break;

                case 'delete':
                    if (!formData.ID) {
                        throw new Error('Отсутствует ID записи для удаления');
                    }

                    apiData = {
                        where: {
                            column: "ID",
                            operator: "=",
                            value: formData.ID
                        }
                    };
                    console.log('Delete data:', apiData);
                    response = await dbApi.deleteRow(selectedTableName, apiData);
                    break;

                default:
                    throw new Error('Unknown action');
            }

            console.log('API Response:', response);

            await TableContext.refreshCurrentTable();
            ModalContext.closeModal();

        } catch (err) {
            console.error('Error submitting form:', err);
            alert(`Ошибка: ${err.message}`);
        }
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.element) {
            this.element.remove();
        }
    }
};