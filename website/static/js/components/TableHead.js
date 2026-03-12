export const TableHead = {
    create(columns) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');

        columns.forEach(column => {
            const th = document.createElement('th');
            th.className = 'th';
            th.textContent = column?.description || '';
            th.setAttribute('data-column', column?.name || '');
            tr.appendChild(th);
        });

        thead.appendChild(tr);
        return thead;
    }
};