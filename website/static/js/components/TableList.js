const TableList = {
    create(tables) {
        const ul = document.createElement('ul');
        ul.className = 'table-list';

        tables.forEach(({ tableNameEn, tableNameRu }) => {
            const li = document.createElement('li');
            li.textContent = tableNameRu;
            li.setAttribute('data-table', tableNameEn);

            if (TableContext.getState().selectedTableName === tableNameEn) {
                li.classList.add('selected');
            }

            li.addEventListener('click', () => {
                TableContext.selectTable(tableNameEn, tableNameRu);

                // Обновляем выделение
                document.querySelectorAll('.table-list li').forEach(item => {
                    item.classList.remove('selected');
                });
                li.classList.add('selected');
            });

            ul.appendChild(li);
        });

        return ul;
    }
};