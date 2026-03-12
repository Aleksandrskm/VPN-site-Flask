import { TableContext } from './TableContext.js';

class ModalContextClass {
    constructor() {
        this.state = {
            isOpen: false,
            modalData: {
                action: null,
                title: null,
                data: null
            },
            row: null,
            formData: {},
            dialogRef: null
        };
        this.listeners = [];
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    // Создает начальные данные формы со всеми полями = null
    createInitialFormData(modalData, rowData) {
        const formData = {};

        // Если есть данные модалки (структура таблицы)
        if (modalData?.data && Array.isArray(modalData.data)) {
            // Для каждого поля из структуры таблицы устанавливаем null
            modalData.data.forEach(field => {
                if (field && field.name) {
                    // Всегда устанавливаем null как базовое значение
                    formData[field.name] = null;
                }
            });

            // Если есть данные строки и это не действие 'add', заполняем их поверх null
            if (rowData && Object.keys(rowData).length > 0) {
                Object.entries(rowData).forEach(([key, value]) => {
                    if (formData.hasOwnProperty(key)) {
                        formData[key] = value;
                    }
                });
            }
        }

        console.log('Created form data with null defaults:', formData);
        return formData;
    }

    openModal(action, title, data) {
        console.log('Opening modal:', action, title, data);

        // Получаем актуальные данные из TableContext
        const { selectedRowData } = TableContext.getState();

        // Создаем форму со всеми полями = null
        const initialFormData = this.createInitialFormData({ data },
            action === 'add' ? null : selectedRowData);

        console.log('Initial form data:', initialFormData);

        this.setState({
            isOpen: true,
            modalData: { action, title, data },
            row: action === 'add' ? null : (selectedRowData || null),
            formData: initialFormData
        });
    }

    closeModal() {
        console.log('Closing modal');
        this.setState({
            isOpen: false,
            modalData: { action: null, title: null, data: null },
            row: null,
            formData: {}
        });
    }

    updateRow(row) {
        console.log('Updating row in modal context:', row);

        // Обновляем данные формы, сохраняя все поля = null как базовые
        const newFormData = this.createInitialFormData(
            { data: this.state.modalData?.data },
            row
        );

        this.setState({
            row,
            formData: newFormData
        });
    }

    updateFormData(field, value) {
        this.setState({
            formData: {
                ...this.state.formData,
                [field]: value
            }
        });
    }

    setDialogRef(ref) {
        this.setState({ dialogRef: ref });
    }

    getState() {
        return this.state;
    }
}

export const ModalContext = new ModalContextClass();