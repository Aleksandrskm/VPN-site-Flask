const TableBtns = {
    create(tableInfo, tableData) {
        const article = document.createElement('article');
        article.className = 'table-btns';

        const isTableEmpty = tableData?.rows?.length > 0 ? false : true;
        const isTable = tableInfo?.columns_info?.length > 0 ? false : true;

        const addBtn = TableBtn.create({
            title: 'Добавить',
            onClick: () => ModalContext.openModal('add', 'Добавление записи', tableInfo?.columns_info),
            disabled: isTable
        });

        const editBtn = TableBtn.create({
            title: 'Редактировать',
            onClick: () => ModalContext.openModal('edit', 'Редактирование записи', tableInfo?.columns_info),
            disabled: isTableEmpty
        });

        const copyBtn = TableBtn.create({
            title: 'Добавить с копированием',
            onClick: () => ModalContext.openModal('copy', 'Копирование записи', tableInfo?.columns_info),
            disabled: isTableEmpty
        });

        const deleteBtn = TableBtn.create({
            title: 'Удалить',
            onClick: () => ModalContext.openModal('delete', 'Удаление записи', tableInfo?.columns_info),
            disabled: isTableEmpty
        });

        article.appendChild(addBtn);
        article.appendChild(editBtn);
        article.appendChild(copyBtn);
        article.appendChild(deleteBtn);

        return article;
    }
};