const TableBtn = {
    create({ title, onClick, type = 'button', disabled = false }) {
        const button = document.createElement('button');
        button.className = 'btn btn-primary';
        button.textContent = title;
        button.type = type;
        button.disabled = disabled;

        button.addEventListener('click', onClick);

        return button;
    }
};