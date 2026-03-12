import { getFullTableData } from '../utils/getFullTableData.js';

class TableContextClass {
    constructor() {
        this.state = {
            selectedTableName: null,
            selectedTableNameRu: null,
            tableData: null,
            tableInfo: null
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
            this.setState({
                selectedTableName: tableName,
                selectedTableNameRu: tableNameRu,
                tableInfo,
                tableData
            });
        } catch (error) {
            console.error('Error loading table data:', error);
            this.setState({
                selectedTableName: tableName,
                selectedTableNameRu: 'В данный момент таблица отсутствует или произошла ошибка на сервере',
                tableInfo: null,
                tableData: null
            });
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
                this.setState({
                    tableInfo: newTableInfo,
                    tableData: newTableData
                });
            }

            return { newTableInfo, newTableData };
        } catch (error) {
            console.error(`Error refreshing table ${targetTableName}:`, error);
            return null;
        }
    }

    getState() {
        return this.state;
    }
}

export const TableContext = new TableContextClass();