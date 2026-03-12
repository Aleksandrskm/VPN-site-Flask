import { TableRow } from './TableRow.js';

export const TableBody = {
    create(rows, selectedRow, onRowClick) {
        const tbody = document.createElement('tbody');

        rows.forEach((row, index) => {
            const isSelected = selectedRow === index;
            const tr = TableRow.create(
                row,
                isSelected,
                index,
                (rowData, rowIndex) => {
                    onRowClick(rowIndex, rowData);
                }
            );
            tbody.appendChild(tr);
        });

        return tbody;
    }
};