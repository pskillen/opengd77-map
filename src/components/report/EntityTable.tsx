import DataTable, { type DataTableColumn, type DataTableProps } from '../ui/DataTable.tsx';

export type EntityTableColumn<T> = DataTableColumn<T>;
export type EntityTableProps<T> = DataTableProps<T>;

export default DataTable;
