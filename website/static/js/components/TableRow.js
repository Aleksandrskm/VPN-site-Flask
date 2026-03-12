import { TableContext } from '../contexts/TableContext.js';

export const TableRow = {
    create(row, isSelected, index, onClick) {
        const tr = document.createElement('tr');

        // Добавляем класс selected если строка выбрана
        if (isSelected) {
            tr.classList.add('selected');
        }

        tr.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Row clicked:', index, row);

            // Убираем класс selected у всех строк в этой таблице
            const allRows = tr.parentElement?.children;
            if (allRows) {
                Array.from(allRows).forEach(r => r.classList.remove('selected'));
            }

            // Добавляем класс selected текущей строке
            tr.classList.add('selected');

            // Вызываем колбэк
            onClick(index, row);
        });

        Object.entries(row).forEach(([key, value]) => {
            const td = document.createElement('td');
            td.className = 'td';
            td.textContent = value !== null && value !== undefined ? value : '';
            td.setAttribute('data-column', key);
            tr.appendChild(td);
        });

        return tr;
    }
};