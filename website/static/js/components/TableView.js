import { TableContext } from '../contexts/TableContext.js';
import { Table } from './Table.js';
import { TableBtns } from './TableBtns.js';

export const TableView = {
    element: null,
    unsubscribe: null,

    create() {
        const section = document.createElement('section');
        section.className = 'table-view';

        const header = document.createElement('header');
        header.className = 'content-header';

        const h3 = document.createElement('h3');
        h3.textContent = TableContext.getState().selectedTableNameRu || 'Выберите таблицу';

        const hr = document.createElement('hr');

        header.appendChild(h3);
        header.appendChild(hr);
        section.appendChild(header);

        const tableSection = document.createElement('section');
        tableSection.className = 'table-section';
        section.appendChild(tableSection);

        const btnsSection = document.createElement('section');
        btnsSection.className = 'table-btns-section';
        section.appendChild(btnsSection);

        this.element = section;

        // Обновляем содержимое при изменении таблицы
        this.unsubscribe = TableContext.subscribe((state) => {
            this.update(state);
        });

        // Загружаем начальные данные если есть выбранная таблица
        const currentState = TableContext.getState();
        if (currentState.selectedTableName && !currentState.tableData) {
            TableContext.refreshCurrentTable();
        } else if (currentState.tableData) {
            // Если данные уже есть, сразу отображаем
            this.update(currentState);
        }

        return section;
    },

    update(state) {
        if (!this.element || !this.element.isConnected) return;

        const header = this.element.querySelector('.content-header h3');
        if (header) {
            header.textContent = state.selectedTableNameRu || 'Выберите таблицу';
        }

        const tableSection = this.element.querySelector('.table-section');
        const btnsSection = this.element.querySelector('.table-btns-section');

        if (tableSection) {
            tableSection.innerHTML = '';
            if (state.tableInfo && state.tableData) {
                const table = Table.create(state.tableInfo, state.tableData);
                tableSection.appendChild(table);
            }
        }

        if (btnsSection) {
            btnsSection.innerHTML = '';
            if (state.tableInfo) {
                const btns = TableBtns.create(state.tableInfo, state.tableData);
                btnsSection.appendChild(btns);
            }
        }
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
};