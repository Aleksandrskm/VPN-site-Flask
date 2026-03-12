const ModalContext = {
    state: {
        isOpen: false,
        modalData: {
            action: null,
            title: null,
            data: null
        },
        row: null,
        dialogRef: null
    },

    listeners: [],

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    },

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    },

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    },

    openModal(action, title, data) {
        this.setState({
            isOpen: true,
            modalData: { action, title, data }
        });
    },

    closeModal() {
        this.setState({
            isOpen: false,
            modalData: { action: null, title: null, data: null },
            row: null
        });
    },

    updateRow(row) {
        this.setState({ row });
    },

    setDialogRef(ref) {
        this.setState({ dialogRef: ref });
    },

    getState() {
        return this.state;
    }
};