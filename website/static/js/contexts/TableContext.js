import { getFullTableData } from '../utils/getFullTableData.js';
import { ModalContext } from './ModalContext.js';

class TableContextClass {
    constructor() {
        this.state = {
            selectedTableName: null,
            selectedTableNameRu: null,
            tableData: null,
            tableInfo: null,
            selectedRowIndex: null,
            selectedRowData: null
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

    async selectTestsTable(tableName, tableNameRu) {
        this.setState({
            selectedTableName: tableName,
            selectedTableNameRu: tableNameRu
        });
    }

    async selectTable(tableName, tableNameRu) {
        try {
            const { tableInfo, tableData } = await getFullTableData(tableName);

            // Автоматически выбираем последнюю строку
            let selectedRowIndex = null;
            let selectedRowData = null;

            if (tableData?.rows && tableData.rows.length > 0) {
                selectedRowIndex = tableData.rows.length - 1;
                selectedRowData = tableData.rows[selectedRowIndex];
            }

            this.setState({
                selectedTableName: tableName,
                selectedTableNameRu: tableNameRu,
                tableInfo,
                tableData,
                selectedRowIndex,
                selectedRowData
            });

            // Обновляем ModalContext
            if (ModalContext) {
                ModalContext.updateRow(selectedRowData);
            }

        } catch (error) {
            console.error('Error loading table data:', error);
            this.setState({
                selectedTableName: tableName,
                selectedTableNameRu: 'В данный момент таблица отсутствует или произошла ошибка на сервере',
                tableInfo: null,
                tableData: null,
                selectedRowIndex: null,
                selectedRowData: null
            });
        }
    }

    selectRow(index, rowData) {
        console.log('Selecting row:', index, rowData);

        // Проверяем, не та ли это уже выбранная строка
        if (this.state.selectedRowIndex === index) {
            console.log('Row already selected');
            return;
        }

        this.setState({
            selectedRowIndex: index,
            selectedRowData: rowData
        });

        // Обновляем ModalContext
        if (ModalContext) {
            ModalContext.updateRow(rowData);
        }
    }

    async refreshCurrentTable(tableName = null) {
        const targetTableName = tableName || this.state.selectedTableName;

        if (!targetTableName) {
            return null;
        }

        try {
            console.log('Refreshing table:', targetTableName);

            const { tableInfo: newTableInfo, tableData: newTableData } =
                await getFullTableData(targetTableName);

            if (targetTableName === this.state.selectedTableName) {
                let selectedRowIndex = this.state.selectedRowIndex;
                let selectedRowData = this.state.selectedRowData;

                if (newTableData?.rows && newTableData.rows.length > 0) {
                    // Если была выбрана строка, проверяем её существование
                    if (selectedRowIndex !== null) {
                        if (selectedRowIndex >= newTableData.rows.length) {
                            // Если индекс вышел за пределы, выбираем последнюю строку
                            selectedRowIndex = newTableData.rows.length - 1;
                            selectedRowData = newTableData.rows[selectedRowIndex];
                        } else {
                            selectedRowData = newTableData.rows[selectedRowIndex];
                        }
                    } else {
                        // Если не было выбрано строки, выбираем последнюю
                        selectedRowIndex = newTableData.rows.length - 1;
                        selectedRowData = newTableData.rows[selectedRowIndex];
                    }
                } else {
                    selectedRowIndex = null;
                    selectedRowData = null;
                }

                this.setState({
                    tableInfo: newTableInfo,
                    tableData: newTableData,
                    selectedRowIndex,
                    selectedRowData
                });

                // Обновляем ModalContext
                if (ModalContext) {
                    ModalContext.updateRow(selectedRowData);
                }
            }

            return { newTableInfo, newTableData };
        } catch (error) {
            console.error(`Error refreshing table ${targetTableName}:`, error);
            return null;
        }
    }

    clearSelectedRow() {
        this.setState({
            selectedRowIndex: null,
            selectedRowData: null
        });

        if (ModalContext) {
            ModalContext.updateRow(null);
        }
    }

    getState() {
        return this.state;
    }
}

export const TableContext = new TableContextClass();