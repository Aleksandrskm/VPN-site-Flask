import { dbApi } from '../api/dbApi.js';
import { transformStructureTables } from '../utils/transformStructureTables.js';
import { TableList } from './TableList.js';

export const TableLists = {
    element: null,
    unsubscribe: null,

    async create() {
        const section = document.createElement('section');
        section.className = 'table-lists';

        const header = document.createElement('header');
        header.className = 'content-header';

        const h3 = document.createElement('h3');
        h3.textContent = 'Список таблиц';

        const hr = document.createElement('hr');

        header.appendChild(h3);
        header.appendChild(hr);
        section.appendChild(header);

        const sectionInner = document.createElement('section');
        sectionInner.className = 'section-inner';

        // Показываем загрузку
        sectionInner.innerHTML = '<div class="loading">Загрузка...</div>';
        section.appendChild(sectionInner);

        this.element = section;

        try {
            const structure = await dbApi.getStructureDB();
            const tablesNames = transformStructureTables(structure);

            sectionInner.innerHTML = '';

            tablesNames.forEach(({ title, tables }) => {
                const article = document.createElement('article');
                article.className = 'article';

                const articleHeader = document.createElement('header');
                articleHeader.className = 'content-header';

                const articleH3 = document.createElement('h3');
                articleH3.textContent = title;

                articleHeader.appendChild(articleH3);
                article.appendChild(articleHeader);

                const tableList = TableList.create(tables);
                article.appendChild(tableList);

                sectionInner.appendChild(article);
            });
        } catch (error) {
            console.error('Error loading tables:', error);
            sectionInner.innerHTML = '<div class="error">Ошибка загрузки таблиц</div>';
        }

        return section;
    },

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
};