// js/components/ScheduleBlock.js
import { DateUtils } from '../utils/dateUtils.js';
import { TasksContext } from '../contexts/TasksContext.js';

export const ScheduleBlock = {
    element: null,
    unsubscribe: null,

    create() {
        const div = document.createElement('div');
        div.className = 'schedule-block';
        this.element = div;

        // Подписываемся на изменения контекста
        this.unsubscribe = TasksContext.subscribe((state) => {
            if (this.element && this.element.isConnected) {
                this.updateFromState(state);
            }
        });

        // Первоначальный рендер
        this.render(TasksContext.getState());

        return div;
    },

    render(state) {
        const html = `
            <h3 class="schedule-title">Расписание тестирования</h3>
            
            <div class="schedule-type">
                <label class="radio-label">
                    <input type="radio" name="scheduleType" value="once" ${state.scheduleType === 'once' ? 'checked' : ''}>
                    <span>Задача отдельная</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="scheduleType" value="periodic" ${state.scheduleType === 'periodic' ? 'checked' : ''}>
                    <span>Задача периодическая</span>
                </label>
            </div>
            
            <div id="schedule-content">
                ${this.renderContent(state)}
            </div>
        `;

        this.element.innerHTML = html;
        this.attachEvents();
    },

    renderContent(state) {
        if (state.scheduleType === 'once') {
            return this.renderOnceSchedule(state);
        } else {
            return this.renderPeriodicSchedule(state);
        }
    },

    renderOnceSchedule({ startDate, startTime }) {
        const now = new Date();
        return `
            <div class="once-schedule">
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="onceType" value="current" checked>
                        <span>От текущего времени</span>
                    </label>
                    <div class="current-time">
                        Начало: ${now.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}
                    </div>
                </div>
                
                <div class="radio-group">
                    <label class="radio-label">
                        <input type="radio" name="onceType" value="custom">
                        <span>От заданного времени</span>
                    </label>
                    <div class="custom-time">
                        <span>с:</span>
                        <div class="date-time-inputs">
                            <input type="date" class="date-input" id="schedule-date" value="${startDate}">
                            <input type="time" class="time-input" id="schedule-time" value="${startTime}" step="1">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPeriodicSchedule({ interval, startDateTime, endDateTime }) {
        return `
            <div class="periodic-schedule">
                <div class="interval-row">
                    <span class="label">Периодичность :</span>
                    <div class="interval-input">
                        <input type="number" class="number-input" id="interval-value" value="${interval?.value || 120}" min="1">
                        <select class="unit-select" id="interval-unit">
                            <option value="minutes" ${interval?.unit === 'minutes' ? 'selected' : ''}>мин.</option>
                            <option value="hours" ${interval?.unit === 'hours' ? 'selected' : ''}>час.</option>
                            <option value="days" ${interval?.unit === 'days' ? 'selected' : ''}>дн.</option>
                        </select>
                    </div>
                </div>
                
                <div class="period-range">
                    <div class="range-row">
                        <span class="label">с:</span>
                        <div class="date-time-inputs">
                            <input type="date" class="date-input" id="period-start-date" value="${startDateTime?.date || ''}">
                            <input type="time" class="time-input" id="period-start-time" value="${startDateTime?.time || ''}" step="1">
                        </div>
                    </div>
                    
                    <div class="range-row">
                        <span class="label">по:</span>
                        <div class="date-time-inputs">
                            <input type="date" class="date-input" id="period-end-date" value="${endDateTime?.date || ''}">
                            <input type="time" class="time-input" id="period-end-time" value="${endDateTime?.time || '00:00:00'}" step="1">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    attachEvents() {
        // Обработчики для радио кнопок типа расписания
        this.element.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Schedule type changed to:', e.target.value);
                TasksContext.handleScheduleTypeChange(e.target.value);
            });
        });

        // Вешаем обработчики в зависимости от текущего типа
        if (TasksContext.getState().scheduleType === 'once') {
            this.attachOnceEvents();
        } else {
            this.attachPeriodicEvents();
        }
    },

    attachOnceEvents() {
        const dateInput = this.element.querySelector('#schedule-date');
        const timeInput = this.element.querySelector('#schedule-time');

        if (dateInput) {
            dateInput.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Date changed to:', e.target.value);
                TasksContext.handleDateChange(e.target.value);
            });
        }

        if (timeInput) {
            timeInput.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Time changed to:', e.target.value);
                TasksContext.handleTimeChange(e.target.value);
            });
        }

        // Обработчики для радио кнопок внутри once
        this.element.querySelectorAll('input[name="onceType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const customTimeDiv = this.element.querySelector('.custom-time');
                if (customTimeDiv) {
                    customTimeDiv.style.opacity = e.target.value === 'custom' ? '1' : '0.5';
                }
            });
        });
    },

    attachPeriodicEvents() {
        const intervalValue = this.element.querySelector('#interval-value');
        const intervalUnit = this.element.querySelector('#interval-unit');
        const startDate = this.element.querySelector('#period-start-date');
        const startTime = this.element.querySelector('#period-start-time');
        const endDate = this.element.querySelector('#period-end-date');
        const endTime = this.element.querySelector('#period-end-time');

        if (intervalValue) {
            intervalValue.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Interval value changed to:', e.target.value);
                TasksContext.handleIntervalChange('value', e.target.value);
            });
        }

        if (intervalUnit) {
            intervalUnit.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Interval unit changed to:', e.target.value);
                TasksContext.handleIntervalChange('unit', e.target.value);
            });
        }

        if (startDate) {
            startDate.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start date changed to:', e.target.value);
                TasksContext.handleStartDateTimeChange('date', e.target.value);
            });
        }

        if (startTime) {
            startTime.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Start time changed to:', e.target.value);
                TasksContext.handleStartDateTimeChange('time', e.target.value);
            });
        }

        if (endDate) {
            endDate.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('End date changed to:', e.target.value);
                TasksContext.handleEndDateTimeChange('date', e.target.value);
            });
        }

        if (endTime) {
            endTime.addEventListener('change', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('End time changed to:', e.target.value);
                TasksContext.handleEndDateTimeChange('time', e.target.value);
            });
        }
    },

    updateFromState(state) {
        if (!this.element) return;

        console.log('ScheduleBlock updateFromState, scheduleType:', state.scheduleType);

        // Проверяем, нужно ли перерисовать содержимое (изменился тип расписания)
        const currentContent = this.element.querySelector('#schedule-content');
        const currentType = currentContent?.querySelector('.once-schedule') ? 'once' :
            (currentContent?.querySelector('.periodic-schedule') ? 'periodic' : null);

        if (currentType !== state.scheduleType) {
            // Тип изменился - перерисовываем содержимое
            console.log('Schedule type changed, re-rendering content');
            const contentDiv = this.element.querySelector('#schedule-content');
            if (contentDiv) {
                contentDiv.innerHTML = this.renderContent(state);
                if (state.scheduleType === 'once') {
                    this.attachOnceEvents();
                } else {
                    this.attachPeriodicEvents();
                }
            }
        } else {
            // Тип не изменился - обновляем только значения инпутов
            console.log('Updating input values only');
            if (state.scheduleType === 'once') {
                this.updateOnceFields(state);
            } else {
                this.updatePeriodicFields(state);
            }
        }
    },

    updateOnceFields(state) {
        const dateInput = this.element.querySelector('#schedule-date');
        const timeInput = this.element.querySelector('#schedule-time');

        if (dateInput && dateInput.value !== state.startDate) {
            dateInput.value = state.startDate;
        }

        if (timeInput && timeInput.value !== state.startTime) {
            timeInput.value = state.startTime;
        }
    },

    updatePeriodicFields(state) {
        const intervalValue = this.element.querySelector('#interval-value');
        const intervalUnit = this.element.querySelector('#interval-unit');
        const startDate = this.element.querySelector('#period-start-date');
        const startTime = this.element.querySelector('#period-start-time');
        const endDate = this.element.querySelector('#period-end-date');
        const endTime = this.element.querySelector('#period-end-time');

        if (intervalValue && parseInt(intervalValue.value) !== state.interval?.value) {
            intervalValue.value = state.interval?.value || 120;
        }

        if (intervalUnit && intervalUnit.value !== state.interval?.unit) {
            intervalUnit.value = state.interval?.unit || 'minutes';
        }

        if (startDate && startDate.value !== state.startDateTime?.date) {
            startDate.value = state.startDateTime?.date || '';
        }

        if (startTime && startTime.value !== state.startDateTime?.time) {
            startTime.value = state.startDateTime?.time || '';
        }

        if (endDate && endDate.value !== state.endDateTime?.date) {
            endDate.value = state.endDateTime?.date || '';
        }

        if (endTime && endTime.value !== state.endDateTime?.time) {
            endTime.value = state.endDateTime?.time || '00:00:00';
        }
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        this.element = null;
    }
};