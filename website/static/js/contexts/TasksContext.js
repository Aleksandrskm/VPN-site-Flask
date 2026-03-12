import { taskApi } from '../api/taskApi.js';
import { armApi } from '../api/armApi.js';
import { DateUtils } from '../utils/dateUtils.js';

class TasksContextClass {
    constructor() {
        this.state = {
            startDate: DateUtils.getDateForInput(),
            startTime: DateUtils.getTimeForInput(),
            scheduleType: 'once',
            interval: { value: 120, unit: 'minutes' },
            startDateTime: {
                date: DateUtils.getDateForInput(),
                time: DateUtils.getTimeForInput()
            },
            endDateTime: {
                date: DateUtils.getDateForInput(DateUtils.addDays(new Date(), 5)),
                time: DateUtils.getTimeForInput()
            },
            taskConfig: {
                vpns: [],
                urls: [],
                programs: []
            },
            selectedArms: [],
            selectedItems: {
                vpns: [],
                urls: [],
                programs: []
            },
            validationErrors: {
                vpns: false,
                urls: false,
                programs: false,
                arms: false
            },
            isLoading: false,
            isConfigLoading: true,
            tasksResult: null,
            apiError: null
        };
        this.listeners = [];
        this.loadConfig();
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    async loadConfig() {
        this.setState({ isConfigLoading: true, apiError: null });

        try {
            console.log('Загружаем конфиг задачи...');
            const config = await taskApi.getConfig();
            console.log('Загружен конфиг:', config);

            this.setState({
                taskConfig: config,
                selectedItems: {
                    vpns: [],
                    urls: [...(config.urls || [])],
                    programs: [...(config.programs || [])]
                },
                isConfigLoading: false
            });
        } catch (error) {
            console.error('Ошибка загрузки конфига:', error);
            this.setState({
                apiError: 'Не удалось загрузить конфигурацию задачи',
                taskConfig: { vpns: [], urls: [], programs: [] },
                isConfigLoading: false
            });
        }
    }

    handleCheckboxChange(category, item, checked) {
        const newSelectedItems = { ...this.state.selectedItems };
        const newCategory = checked
            ? [...newSelectedItems[category], item]
            : newSelectedItems[category].filter(i => i !== item);

        newSelectedItems[category] = newCategory;

        this.setState({
            selectedItems: newSelectedItems,
            validationErrors: {
                ...this.state.validationErrors,
                [category]: newCategory.length === 0
            }
        });
    }

    handleDateChange(date) {
        this.setState({ startDate: date });
    }

    handleTimeChange(time) {
        this.setState({ startTime: time });
    }

    handleSelectAll(category, items) {
        this.setState({
            selectedItems: {
                ...this.state.selectedItems,
                [category]: [...items]
            },
            validationErrors: {
                ...this.state.validationErrors,
                [category]: false
            }
        });
    }

    handleClearAll(category) {
        this.setState({
            selectedItems: {
                ...this.state.selectedItems,
                [category]: []
            },
            validationErrors: {
                ...this.state.validationErrors,
                [category]: true
            }
        });
    }

    isChecked(category, item) {
        return this.state.selectedItems[category]?.includes(item) || false;
    }

    handleArmsChange(selected) {
        this.setState({
            selectedArms: selected,
            validationErrors: {
                ...this.state.validationErrors,
                arms: selected.length === 0
            }
        });
    }

    handleScheduleTypeChange(type) {
        this.setState({ scheduleType: type });
    }

    handleIntervalChange(field, value) {
        this.setState({
            interval: {
                ...this.state.interval,
                [field]: value
            }
        });
    }

    handleStartDateTimeChange(field, value) {
        this.setState({
            startDateTime: {
                ...this.state.startDateTime,
                [field]: value
            }
        });
    }

    handleEndDateTimeChange(field, value) {
        this.setState({
            endDateTime: {
                ...this.state.endDateTime,
                [field]: value
            }
        });
    }

    validateForm() {
        const errors = {
            vpns: this.state.selectedItems.vpns.length === 0,
            urls: this.state.selectedItems.urls.length === 0,
            programs: this.state.selectedItems.programs.length === 0,
            arms: this.state.selectedArms.length === 0
        };

        this.setState({ validationErrors: errors });
        return !Object.values(errors).some(error => error);
    }

    async submitForm() {
        if (!this.validateForm()) {
            console.log('Ошибка валидации:');
            if (this.state.validationErrors.vpns) console.log('   - Нужно выбрать хотя бы один VPN');
            if (this.state.validationErrors.urls) console.log('   - Нужно выбрать хотя бы один URL');
            if (this.state.validationErrors.programs) console.log('   - Нужно выбрать хотя бы одну программу');
            if (this.state.validationErrors.arms) console.log('   - Нужно выбрать хотя бы один АРМ');
            return false;
        }

        this.setState({ isLoading: true, apiError: null, tasksResult: null });

        try {
            let tasksToCreate = [];

            if (this.state.scheduleType === 'once') {
                tasksToCreate = [{
                    started_at: DateUtils.formatApiDate(this.state.startDate, this.state.startTime),
                    config: {
                        vpns: this.state.selectedItems.vpns,
                        urls: this.state.selectedItems.urls,
                        programs: this.state.selectedItems.programs
                    }
                }];
            } else {
                const start = new Date(`${this.state.startDateTime.date}T${this.state.startDateTime.time}`);
                const end = new Date(`${this.state.endDateTime.date}T${this.state.endDateTime.time}`);

                let intervalMs = this.state.interval.value;
                switch(this.state.interval.unit) {
                    case 'minutes':
                        intervalMs *= 60 * 1000;
                        break;
                    case 'hours':
                        intervalMs *= 60 * 60 * 1000;
                        break;
                    case 'days':
                        intervalMs *= 24 * 60 * 60 * 1000;
                        break;
                    default:
                        intervalMs *= 60 * 1000;
                }

                let currentDate = new Date(start);
                while (currentDate <= end) {
                    tasksToCreate.push({
                        started_at: currentDate.toISOString().replace(/\.\d{3}Z$/, '.000+00:00'),
                        config: {
                            vpns: this.state.selectedItems.vpns,
                            urls: this.state.selectedItems.urls,
                            programs: this.state.selectedItems.programs
                        }
                    });
                    currentDate = new Date(currentDate.getTime() + intervalMs);
                }
            }

            const MAX_TASKS_PER_ARM = 61;
            const MAX_TOTAL_TASKS = 250;

            const tasksPerArm = tasksToCreate.length;
            const totalTasks = tasksPerArm * this.state.selectedArms.length;

            if (tasksPerArm > MAX_TASKS_PER_ARM) {
                this.setState({
                    tasksResult: {
                        success: false,
                        error: ` Слишком много задач для одного АРМ: ${tasksPerArm}. Максимум: ${MAX_TASKS_PER_ARM}. Увеличьте интервал или уменьшите период.`
                    },
                    isLoading: false
                });
                return false;
            }

            if (totalTasks > MAX_TOTAL_TASKS) {
                this.setState({
                    tasksResult: {
                        success: false,
                        error: ` Слишком много задач всего: ${totalTasks}. Максимум: ${MAX_TOTAL_TASKS}. Уменьшите количество АРМ или период.`
                    },
                    isLoading: false
                });
                return false;
            }

            const results = [];
            const BATCH_SIZE = 5;

            let completedRequests = 0;
            const totalRequests = tasksToCreate.length * this.state.selectedArms.length;

            for (let i = 0; i < this.state.selectedArms.length; i += BATCH_SIZE) {
                const armsBatch = this.state.selectedArms.slice(i, i + BATCH_SIZE);
                const batchPromises = [];

                for (const armId of armsBatch) {
                    for (const taskData of tasksToCreate) {
                        const promise = taskApi.addTask({
                            ...taskData,
                            workstation_id: armId
                        })
                            .then(response => {
                                completedRequests++;
                                return {
                                    armId,
                                    taskTime: taskData.started_at,
                                    success: true,
                                    response
                                };
                            })
                            .catch(error => {
                                completedRequests++;
                                return {
                                    armId,
                                    taskTime: taskData.started_at,
                                    success: false,
                                    error: error.message
                                };
                            });

                        batchPromises.push(promise);
                    }
                }

                const batchResults = await Promise.all(batchPromises);
                results.push(...batchResults);

                if (totalRequests > 61) {
                    this.setState({
                        tasksResult: {
                            success: true,
                            message: `Прогресс: ${completedRequests}/${totalRequests} запросов...`
                        }
                    });
                }

                if (i + BATCH_SIZE < this.state.selectedArms.length) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }

            const successCount = results.filter(r => r.success).length;
            const failCount = results.filter(r => !r.success).length;
            const totalTasksCreated = results.length;

            if (failCount === 0) {
                this.setState({
                    tasksResult: {
                        success: true,
                        message: ` Задачи успешно созданы: ${successCount} из ${totalTasksCreated} (для ${this.state.selectedArms.length} АРМ, по ${tasksPerArm} задач на АРМ). Время: ${DateUtils.getDateTime()}`
                    }
                });
            } else if (successCount === 0) {
                this.setState({
                    tasksResult: {
                        success: false,
                        error: ` Не удалось создать задачи: ${failCount} из ${totalTasksCreated}`
                    }
                });
            } else {
                this.setState({
                    tasksResult: {
                        success: true,
                        message: ` Задачи созданы частично: ${successCount} успешно, ${failCount} ошибок из ${totalTasksCreated}. Время: ${DateUtils.getDateTime()}`
                    }
                });
            }

            return true;
        } catch (error) {
            console.error('Ошибка при создании задач:', error);
            this.setState({
                tasksResult: {
                    success: false,
                    error: error.message || 'Неизвестная ошибка'
                },
                apiError: error.message || 'Не удалось создать задачи'
            });
            return false;
        } finally {
            this.setState({ isLoading: false });
        }
    }

    resetForm() {
        const fiveDaysLater = DateUtils.addDays(new Date(), 5);

        this.setState({
            startDate: DateUtils.getDateForInput(),
            startTime: DateUtils.getTimeForInput(),
            selectedArms: [],
            selectedItems: {
                vpns: [],
                urls: [...(this.state.taskConfig.urls || [])],
                programs: [...(this.state.taskConfig.programs || [])]
            },
            validationErrors: {
                vpns: false,
                urls: false,
                programs: false,
                arms: false
            },
            tasksResult: null,
            apiError: null,
            scheduleType: 'once',
            interval: { value: 120, unit: 'minutes' },
            startDateTime: {
                date: DateUtils.getDateForInput(),
                time: DateUtils.getTimeForInput()
            },
            endDateTime: {
                date: DateUtils.getDateForInput(fiveDaysLater),
                time: DateUtils.getTimeForInput()
            }
        });
    }

    getState() {
        return this.state;
    }
}

export const TasksContext = new TasksContextClass();