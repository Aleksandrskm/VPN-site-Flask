import { DateUtils } from '../utils/dateUtils.js';

export const ScheduleBlock = {
    create({
               startDate,
               startTime,
               onDateChange,
               onTimeChange,
               scheduleType = 'once',
               onScheduleTypeChange,
               interval,
               onIntervalChange,
               startDateTime,
               onStartDateTimeChange,
               endDateTime,
               onEndDateTimeChange
           }) {
        const div = document.createElement('div');
        div.className = 'schedule-block';

        div.innerHTML = `
            <h3 class="schedule-title">Расписание тестирования</h3>
            
            <div class="schedule-type">
                <label class="radio-label">
                    <input type="radio" name="scheduleType" value="once" ${scheduleType === 'once' ? 'checked' : ''}>
                    <span>Задача отдельная</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="scheduleType" value="periodic" ${scheduleType === 'periodic' ? 'checked' : ''}>
                    <span>Задача периодическая</span>
                </label>
            </div>
            
            <div id="schedule-content"></div>
        `;

        const contentDiv = div.querySelector('#schedule-content');
        this.renderContent(contentDiv, {
            startDate,
            startTime,
            onDateChange,
            onTimeChange,
            scheduleType,
            interval,
            onIntervalChange,
            startDateTime,
            onStartDateTimeChange,
            endDateTime,
            onEndDateTimeChange
        });

        // Обработчики для радио кнопок
        div.querySelectorAll('input[name="scheduleType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                e.preventDefault();
                onScheduleTypeChange(e.target.value);
                this.renderContent(contentDiv, {
                    startDate,
                    startTime,
                    onDateChange,
                    onTimeChange,
                    scheduleType: e.target.value,
                    interval,
                    onIntervalChange,
                    startDateTime,
                    onStartDateTimeChange,
                    endDateTime,
                    onEndDateTimeChange
                });
            });
        });

        return div;
    },

    renderContent(container, props) {
        if (props.scheduleType === 'once') {
            container.innerHTML = this.renderOnceSchedule(props);
            this.attachOnceHandlers(container, props);
        } else {
            container.innerHTML = this.renderPeriodicSchedule(props);
            this.attachPeriodicHandlers(container, props);
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
            minute: '2-digit',
            second: '2-digit'
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

    attachOnceHandlers(container, props) {
        const dateInput = container.querySelector('#schedule-date');
        const timeInput = container.querySelector('#schedule-time');

        if (dateInput) {
            dateInput.addEventListener('change', (e) => props.onDateChange(e.target.value));
        }

        if (timeInput) {
            timeInput.addEventListener('change', (e) => props.onTimeChange(e.target.value));
        }

        // Обработчики для радио кнопок
        container.querySelectorAll('input[name="onceType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const customTimeDiv = container.querySelector('.custom-time');
                if (customTimeDiv) {
                    customTimeDiv.style.opacity = e.target.value === 'custom' ? '1' : '0.5';
                }
            });
        });
    },

    // В методе attachPeriodicHandlers добавьте e.preventDefault()
    attachPeriodicHandlers(container, props) {
        const intervalValue = container.querySelector('#interval-value');
        const intervalUnit = container.querySelector('#interval-unit');
        const startDate = container.querySelector('#period-start-date');
        const startTime = container.querySelector('#period-start-time');
        const endDate = container.querySelector('#period-end-date');
        const endTime = container.querySelector('#period-end-time');

        if (intervalValue) {
            intervalValue.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onIntervalChange('value', e.target.value);
            });
        }

        if (intervalUnit) {
            intervalUnit.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onIntervalChange('unit', e.target.value);
            });
        }

        if (startDate) {
            startDate.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onStartDateTimeChange('date', e.target.value);
            });
        }

        if (startTime) {
            startTime.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onStartDateTimeChange('time', e.target.value);
            });
        }

        if (endDate) {
            endDate.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onEndDateTimeChange('date', e.target.value);
            });
        }

        if (endTime) {
            endTime.addEventListener('change', (e) => {
                e.preventDefault(); // ДОБАВЛЯЕМ
                props.onEndDateTimeChange('time', e.target.value);
            });
        }
    }
};