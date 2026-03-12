import { ModalContext } from '../contexts/ModalContext.js';

export const TableRow = {
    create(row, isSelected, index, onClick) {
        const tr = document.createElement('tr');
        if (isSelected) {
            tr.className = 'selected';
        }

        tr.addEventListener('click', () => onClick(row, index));

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