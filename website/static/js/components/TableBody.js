import { TableRow } from './TableRow.js';
import { ModalContext } from '../contexts/ModalContext.js';

export const TableBody = {
    create(rows, selectedRow, onRowClick) {
        const tbody = document.createElement('tbody');

        rows.forEach((row, index) => {
            const tr = TableRow.create(
                row,
                selectedRow === index,
                index,
                (rowData, rowIndex) => {
                    ModalContext.updateRow(rowData);
                    onRowClick(rowIndex);
                }
            );
            tbody.appendChild(tr);
        });

        return tbody;
    },

    update(tbody, rows, selectedRow, onRowClick) {
        tbody.innerHTML = '';
        rows.forEach((row, index) => {
            const tr = TableRow.create(
                row,
                selectedRow === index,
                index,
                (rowData, rowIndex) => {
                    ModalContext.updateRow(rowData);
                    onRowClick(rowIndex);
                }
            );
            tbody.appendChild(tr);
        });
    }
};