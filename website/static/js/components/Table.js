const Table = {
    create(tableInfo, tableData) {
        const container = document.createElement('div');
        container.className = 'table-container';

        const table = document.createElement('table');
        table.className = 'data-table';

        const columns = tableInfo?.columns_info ?? [];
        const rows = tableData?.rows ?? [];

        const thead = TableHead.create(columns);
        table.appendChild(thead);

        let selectedRow = rows.length > 0 ? rows.length - 1 : null;

        if (rows.length > 0) {
            ModalContext.updateRow(rows[rows.length - 1]);
        }

        const tbody = TableBody.create(rows, selectedRow, (index) => {
            selectedRow = index;
            const newTbody = TableBody.create(rows, selectedRow, () => {});
            table.replaceChild(newTbody, tbody);
        });

        table.appendChild(tbody);
        container.appendChild(table);

        // Подписка на обновления таблицы
        const unsubscribe = TableContext.subscribe((state) => {
            if (state.tableData?.rows) {
                const newTbody = TableBody.create(
                    state.tableData.rows,
                    state.tableData.rows.length - 1,
                    (index) => {
                        const updatedTbody = TableBody.create(
                            state.tableData.rows,
                            index,
                            () => {}
                        );
                        table.replaceChild(updatedTbody, table.querySelector('tbody'));
                    }
                );
                table.replaceChild(newTbody, table.querySelector('tbody'));
            }
        });

        // Сохраняем функцию отписки для очистки
        container._unsubscribe = unsubscribe;

        return container;
    },

    destroy(container) {
        if (container._unsubscribe) {
            container._unsubscribe();
        }
    }
};