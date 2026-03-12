const ResultTestsTable = {
    element: null,
    unsubscribe: null,

    async create() {
        const section = document.createElement('section');
        section.className = 'result-tests-section';

        this.element = section;

        try {
            const { tableInfo, tableData } = await getFullTableData('PR_ZAD');
            TableContext.selectTestsTable('PR_ZAD', 'Результаты тестирований');

            const table = Table.create(tableInfo, tableData);
            section.appendChild(table);

        } catch (error) {
            console.error('Error loading result tests:', error);
            section.innerHTML = '<div class="error">Ошибка загрузки данных</div>';
        }

        // Подписка на обновления
        this.unsubscribe = TableContext.subscribe((state) => {
            if (state.selectedTableName === 'PR_ZAD' && state.tableData) {
                this.update(state);
            }
        });

        return section;
    },

    update(state) {
        if (!this.element) return;

        this.element.innerHTML = '';
        const table = Table.create(state.tableInfo, state.tableData);
        this.element.appendChild(table);
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
};