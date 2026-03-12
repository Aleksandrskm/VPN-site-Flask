import { ModalContext } from '../contexts/ModalContext.js';
import { TableContext } from '../contexts/TableContext.js';
import { dbApi } from '../api/dbApi.js';

export const Modal = {
    element: null,
    unsubscribe: null,
    currentFormData: {},
    currentModalData: null,

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
            if (this.element && this.element.isConnected) {
                this.update(state);
            }
        });

        document.body.appendChild(modal);

        return modal;
    },

    update(state) {
        if (!this.element) return;

        if (state.isOpen) {
            this.element.classList.add('show');

            const needsFullRender = this.shouldFullRender(state);

            this.currentFormData = { ...state.formData };
            this.currentModalData = { ...state.modalData };

            if (needsFullRender) {
                console.log('Full render modal');
                this.renderContent(state);
            } else {
                this.updateInputValues(state);
            }
        } else {
            this.element.classList.remove('show');
            this.currentFormData = {};
            this.currentModalData = null;
        }
    },

    shouldFullRender(state) {
        const content = this.element.querySelector('.modal-content');
        if (!content) return true;

        if (!this.currentModalData || this.currentModalData.action !== state.modalData.action) {
            return true;
        }

        const oldFields = this.currentModalData?.data || [];
        const newFields = state.modalData?.data || [];

        if (oldFields.length !== newFields.length) return true;

        for (let i = 0; i < newFields.length; i++) {
            if (oldFields[i]?.name !== newFields[i]?.name) {
                return true;
            }
        }

        return false;
    },

    getTitle(action) {
        switch(action) {
            case 'add': return 'Добавление';
            case 'edit': return 'Редактирование';
            case 'copy': return 'Копирование';
            case 'delete': return 'Удаление';
            default: return 'Модальное окно';
        }
    },

    renderContent(state) {
        const content = this.element.querySelector('.modal-content');
        if (!content) return;

        const { modalData } = state;
        const title = this.getTitle(modalData.action);

        content.innerHTML = `
            <div class="modal-header">
                <h2>${title}</h2>
            </div>
            <form id="modal-form">
                <div class="modal-body">
                    ${this.renderFormFields(modalData, this.currentFormData)}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="modal-submit">${title}</button>
                    <button type="button" class="btn btn-secondary" id="modal-cancel">Закрыть</button>
                </div>
            </form>
        `;

        // Обработчик для кнопки "Закрыть"
        content.querySelector('#modal-cancel').addEventListener('click', (e) => {
            e.preventDefault();
            ModalContext.closeModal();
        });

        // Кнопка submit
        const submitBtn = content.querySelector('#modal-submit');
        submitBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await this.handleSubmit(modalData, this.currentFormData);
        });

        // Добавляем обработчики для инпутов
        this.attachInputHandlers(content);

        // Добавляем обработчик submit на форму
        const form = content.querySelector('#modal-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
    },

    renderFormFields(modalData, formData) {
        if (!modalData.data) return '<div class="empty-fields">Нет полей для отображения</div>';

        return modalData.data.map(item => {
            const fieldName = item.name;
            const fieldId = `modal-field-${fieldName}`;
            const value = formData && formData[fieldName] !== undefined ? formData[fieldName] : null;
            const displayValue = value === null || value === undefined ? '' : String(value);

            return `
                <div class="form-group">
                    <label for="${fieldId}">${item.description || item.name}</label>
                    <input 
                        type="text" 
                        class="form-control" 
                        id="${fieldId}"
                        data-field="${fieldName}"
                        value="${displayValue.replace(/"/g, '&quot;')}"
                        placeholder="${value === null ? '' : ''}"
                    />
                </div>
            `;
        }).join('');
    },

    updateInputValues(state) {
        const inputs = this.element.querySelectorAll('input[data-field]');
        inputs.forEach(input => {
            const field = input.dataset.field;
            const value = state.formData[field];
            const newValue = value === null || value === undefined ? '' : String(value);

            if (input.value !== newValue) {
                input.value = newValue;
                input.placeholder = value === null ? '' : '';
            }
        });
    },

    attachInputHandlers(container) {
        container.querySelectorAll('input[data-field]').forEach(input => {
            const field = input.dataset.field;

            const newInput = input.cloneNode(true);
            input.parentNode.replaceChild(newInput, input);

            newInput.addEventListener('input', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const value = e.target.value === '' ? null : e.target.value;

                this.currentFormData[field] = value;
                ModalContext.updateFormData(field, value);
            });

            newInput.addEventListener('blur', (e) => {
                if (e.target.value === '') {
                    e.target.placeholder = '';
                } else {
                    e.target.placeholder = '';
                }
            });
        });
    },

    async handleSubmit(modalData, formData) {
        const { selectedTableName } = TableContext.getState();

        if (!selectedTableName) {
            alert('Не выбрана таблица');
            return;
        }

        const submitBtn = this.element.querySelector('#modal-submit');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Сохранение...';
        submitBtn.disabled = true;

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

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.element) {
            this.element.remove();
        }
        this.currentFormData = {};
        this.currentModalData = null;
    }
};