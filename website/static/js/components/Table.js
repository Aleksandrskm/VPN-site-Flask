import { TableHead } from './TableHead.js';
import { TableContext } from '../contexts/TableContext.js';

export const Table = {
    create(tableInfo, tableData) {
        const container = document.createElement('div');
        container.className = 'table-container';

        const table = document.createElement('table');
        table.className = 'data-table';

        const columns = tableInfo?.columns_info ?? [];
        const rows = tableData?.rows ?? [];

        // Создаем заголовок
        const thead = TableHead.create(columns);
        table.appendChild(thead);

        // Создаем тело таблицы
        const tbody = document.createElement('tbody');

        // Получаем текущую выбранную строку из контекста
        const state = TableContext.getState();
        let selectedRowIndex = state.selectedRowIndex;

        // Если нет выбранной строки, но есть данные, выбираем последнюю
        if (selectedRowIndex === null && rows.length > 0) {
            selectedRowIndex = rows.length - 1;
            // Обновляем контекст асинхронно
            setTimeout(() => {
                TableContext.selectRow(selectedRowIndex, rows[selectedRowIndex]);
            }, 0);
        }

        // Функция для обновления выделения строк
        const updateRowSelection = (clickedIndex) => {
            const rows_elements = tbody.children;
            for (let i = 0; i < rows_elements.length; i++) {
                const row = rows_elements[i];
                if (i === clickedIndex) {
                    row.classList.add('selected');
                } else {
                    row.classList.remove('selected');
                }
            }
        };

        // Создаем строки
        rows.forEach((row, index) => {
            const tr = document.createElement('tr');

            // Если это выбранная строка, добавляем класс
            if (index === selectedRowIndex) {
                tr.classList.add('selected');
            }

            // Добавляем обработчик клика
            tr.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Row clicked:', index, row);

                // Обновляем выделение
                updateRowSelection(index);

                // Обновляем контекст
                TableContext.selectRow(index, row);
            });

            // Создаем ячейки
            Object.entries(row).forEach(([key, value]) => {
                const td = document.createElement('td');
                td.className = 'td';
                td.textContent = value !== null && value !== undefined ? value : '';
                td.setAttribute('data-column', key);
                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // Подписка на обновления данных таблицы
        const unsubscribe = TableContext.subscribe((state) => {
            if (state.tableData?.rows && container.isConnected) {
                // Проверяем, изменились ли данные
                if (state.tableData.rows !== rows) {
                    // Данные изменились - нужно пересоздать таблицу
                    const newTable = Table.create(state.tableInfo, state.tableData);
                    container.parentNode?.replaceChild(newTable, container);
                }
            }
        });

        container._unsubscribe = unsubscribe;

        return container;
    },

    destroy(container) {
        if (container._unsubscribe) {
            container._unsubscribe();
        }
    }
};