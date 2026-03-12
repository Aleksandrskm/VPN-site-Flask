// js/components/FormTask.js
import { TasksContext } from '../contexts/TasksContext.js';
import { ArmsList } from './ArmsList.js';
import { ScheduleBlock } from './ScheduleBlock.js';

export const FormTask = {
    element: null,
    unsubscribe: null,

    components: {
        armsList: null,
        categoriesRow: null,
        scheduleBlock: null,
        resultBlock: null,
        submitButton: null
    },

    create() {
        const section = document.createElement('section');
        section.className = 'page-section';

        const form = document.createElement('form');
        form.className = 'form-task';

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        form.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }
        });

        section.appendChild(form);
        this.element = section;

        // Подписываемся на изменения контекста
        this.unsubscribe = TasksContext.subscribe((state) => {
            if (this.element && this.element.isConnected) {
                this.updateSmart(state);
            }
        });

        // Первоначальный рендер
        this.renderInitial(TasksContext.getState());

        // Добавляем метод destroy для очистки
        section.destroy = () => this.destroy();

        return section;
    },

    async renderInitial(state) {
        const form = this.element?.querySelector('.form-task');
        if (!form) return;

        if (state.isConfigLoading) {
            form.innerHTML = this.getLoadingTemplate();
            return;
        }

        if (state.apiError && !state.taskConfig.vpns?.length) {
            form.innerHTML = this.getErrorTemplate(state);
            this.attachErrorHandlers(form);
            return;
        }

        form.innerHTML = '';

        // Создаем ArmsList с правильным await
        const armsList = await ArmsList.create(
            state.selectedArms,
            (selected) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleArmsChange(selected);
                }
            },
            state.validationErrors.arms
        );
        this.components.armsList = armsList;
        form.appendChild(armsList);

        this.components.categoriesRow = this.createCategoriesRow(state);
        form.appendChild(this.components.categoriesRow);

        this.components.scheduleBlock = ScheduleBlock.create({
            startDate: state.startDate,
            startTime: state.startTime,
            onDateChange: (date) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleDateChange(date);
                }
            },
            onTimeChange: (time) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleTimeChange(time);
                }
            },
            scheduleType: state.scheduleType,
            onScheduleTypeChange: (type) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleScheduleTypeChange(type);
                }
            },
            interval: state.interval,
            onIntervalChange: (field, value) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleIntervalChange(field, value);
                }
            },
            startDateTime: state.startDateTime,
            onStartDateTimeChange: (field, value) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleStartDateTimeChange(field, value);
                }
            },
            endDateTime: state.endDateTime,
            onEndDateTimeChange: (field, value) => {
                if (this.element && this.element.isConnected) {
                    TasksContext.handleEndDateTimeChange(field, value);
                }
            }
        });
        form.appendChild(this.components.scheduleBlock);

        if (state.tasksResult) {
            this.components.resultBlock = this.createResultBlock(state.tasksResult);
            form.appendChild(this.components.resultBlock);
        }

        this.components.submitButton = this.createSubmitButton(state);
        form.appendChild(this.components.submitButton);
    },

    updateSmart(state) {
        const form = this.element?.querySelector('.form-task');
        if (!form || !this.element.isConnected) return;

        if (state.isConfigLoading) {
            if (!this.isLoadingTemplateShown(form)) {
                form.innerHTML = this.getLoadingTemplate();
            }
            return;
        }

        if (state.apiError && !state.taskConfig.vpns?.length) {
            if (!this.isErrorTemplateShown(form)) {
                form.innerHTML = this.getErrorTemplate(state);
                this.attachErrorHandlers(form);
            }
            return;
        }

        if (form.children.length === 0) {
            this.renderInitial(state);
            return;
        }

        this.updateArmsList(state);
        this.updateCategories(state);
        this.updateScheduleBlock(state);
        this.updateResult(state);
        this.updateSubmitButton(state);
    },

    async updateArmsList(state) {
        if (this.components.armsList && this.components.armsList.isConnected) {
            if (this.components.armsList.update) {
                this.components.armsList.update(state.selectedArms, state.validationErrors.arms);
            } else {
                const newArmsList = await ArmsList.create(
                    state.selectedArms,
                    (selected) => {
                        if (this.element && this.element.isConnected) {
                            TasksContext.handleArmsChange(selected);
                        }
                    },
                    state.validationErrors.arms
                );
                this.components.armsList.replaceWith(newArmsList);

                // Уничтожаем старый список
                if (this.components.armsList.destroy) {
                    this.components.armsList.destroy();
                }

                this.components.armsList = newArmsList;
            }
        }
    },

    updateCategories(state) {
        if (this.components.categoriesRow && this.components.categoriesRow.isConnected) {
            const newCategoriesRow = this.createCategoriesRow(state);
            this.components.categoriesRow.replaceWith(newCategoriesRow);
            this.components.categoriesRow = newCategoriesRow;
        }
    },

    updateScheduleBlock(state) {
        if (this.components.scheduleBlock && this.components.scheduleBlock.isConnected) {
            const newScheduleBlock = ScheduleBlock.create({
                startDate: state.startDate,
                startTime: state.startTime,
                onDateChange: (date) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleDateChange(date);
                    }
                },
                onTimeChange: (time) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleTimeChange(time);
                    }
                },
                scheduleType: state.scheduleType,
                onScheduleTypeChange: (type) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleScheduleTypeChange(type);
                    }
                },
                interval: state.interval,
                onIntervalChange: (field, value) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleIntervalChange(field, value);
                    }
                },
                startDateTime: state.startDateTime,
                onStartDateTimeChange: (field, value) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleStartDateTimeChange(field, value);
                    }
                },
                endDateTime: state.endDateTime,
                onEndDateTimeChange: (field, value) => {
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleEndDateTimeChange(field, value);
                    }
                }
            });
            this.components.scheduleBlock.replaceWith(newScheduleBlock);
            this.components.scheduleBlock = newScheduleBlock;
        }
    },

    updateResult(state) {
        const form = this.element?.querySelector('.form-task');
        if (!form || !this.element.isConnected) return;

        if (state.tasksResult) {
            if (this.components.resultBlock && this.components.resultBlock.isConnected) {
                const newResultBlock = this.createResultBlock(state.tasksResult);
                this.components.resultBlock.replaceWith(newResultBlock);
                this.components.resultBlock = newResultBlock;
            } else {
                this.components.resultBlock = this.createResultBlock(state.tasksResult);
                if (this.components.submitButton) {
                    form.insertBefore(this.components.resultBlock, this.components.submitButton);
                } else {
                    form.appendChild(this.components.resultBlock);
                }
            }
        } else {
            if (this.components.resultBlock && this.components.resultBlock.isConnected) {
                this.components.resultBlock.remove();
                this.components.resultBlock = null;
            }
        }
    },

    updateSubmitButton(state) {
        if (this.components.submitButton && this.components.submitButton.isConnected) {
            this.components.submitButton.disabled = state.isLoading || state.isConfigLoading;
            this.components.submitButton.textContent = state.isLoading ? 'Отправка...' : 'Поставить задачу';
        }
    },

    createCategoriesRow(state) {
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
            if (!items || items.length === 0) return;

            const article = document.createElement('article');
            article.className = `category ${state.validationErrors[category] ? 'error' : ''}`;
            article.setAttribute('data-category', category);

            const title = document.createElement('h3');
            title.innerHTML = `
                ${getCategoryTitle(category)}
                ${state.validationErrors[category] ? '<span class="error-badge">Обязательно для выбора</span>' : ''}
            `;
            article.appendChild(title);

            const controls = document.createElement('div');
            controls.className = 'category-controls';

            const selectAllBtn = document.createElement('button');
            selectAllBtn.type = 'button';
            selectAllBtn.className = 'btn btn-secondary btn-sm';
            selectAllBtn.textContent = 'Выбрать все';
            selectAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.element && this.element.isConnected) {
                    TasksContext.handleSelectAll(category, items);
                }
            });

            const clearAllBtn = document.createElement('button');
            clearAllBtn.type = 'button';
            clearAllBtn.className = 'btn btn-secondary btn-sm';
            clearAllBtn.textContent = 'Снять все';
            clearAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (this.element && this.element.isConnected) {
                    TasksContext.handleClearAll(category);
                }
            });

            const countSpan = document.createElement('span');
            countSpan.className = state.validationErrors[category] ? 'error-count' : '';
            countSpan.textContent = `Выбрано: ${state.selectedItems[category]?.length || 0}/${items.length}`;

            controls.appendChild(selectAllBtn);
            controls.appendChild(clearAllBtn);
            controls.appendChild(countSpan);
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

                const label = document.createElement('label');
                label.className = 'checkbox-label';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `${category}-${index}`;
                checkbox.checked = state.selectedItems[category]?.includes(item) || false;

                checkbox.addEventListener('change', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (this.element && this.element.isConnected) {
                        TasksContext.handleCheckboxChange(category, item, e.target.checked);
                    }
                });

                const span = document.createElement('span');
                span.className = 'item-text';
                span.textContent = item;

                label.appendChild(checkbox);
                label.appendChild(span);
                li.appendChild(label);
                list.appendChild(li);
            });

            article.appendChild(list);
            categoriesRow.appendChild(article);
        });

        return categoriesRow;
    },

    createResultBlock(result) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `result-block ${result.success ? 'success' : 'error'}`;
        resultDiv.textContent = result.success
            ? `${result.message || ''}`
            : `Ошибка: ${result.error}`;
        return resultDiv;
    },

    createSubmitButton(state) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'submit-button';
        button.disabled = state.isLoading || state.isConfigLoading;
        button.textContent = state.isLoading ? 'Отправка...' : 'Поставить задачу';

        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.element && this.element.isConnected) {
                await TasksContext.submitForm();
            }
        });

        return button;
    },

    getLoadingTemplate() {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Загрузка конфигурации задачи...</p>
            </div>
        `;
    },

    getErrorTemplate(state) {
        return `
            <div class="error-container">
                <h3>Ошибка загрузки</h3>
                <p>${state.apiError}</p>
                <button type="button" class="btn btn-primary" id="reload-btn">Повторить</button>
            </div>
        `;
    },

    attachErrorHandlers(form) {
        const reloadBtn = form.querySelector('#reload-btn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                location.reload();
            });
        }
    },

    isLoadingTemplateShown(form) {
        return form.children.length === 1 && form.querySelector('.loading-container');
    },

    isErrorTemplateShown(form) {
        return form.children.length === 1 && form.querySelector('.error-container');
    },

    destroy() {
        console.log('Destroying FormTask');

        // Отписываемся от контекста
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }

        // Уничтожаем все дочерние компоненты
        Object.values(this.components).forEach(component => {
            if (component && component.destroy) {
                component.destroy();
            }
        });

        // Очищаем ссылки
        this.components = {
            armsList: null,
            categoriesRow: null,
            scheduleBlock: null,
            resultBlock: null,
            submitButton: null
        };

        this.element = null;
    }
};