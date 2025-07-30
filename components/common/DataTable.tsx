import React from 'react';
import { PencilIcon, TrashIcon } from '../icons';

export interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface Action<T> {
  icon: React.FC<{ className?: string }>;
  label: string;
  onClick: (item: T) => void;
  disabled?: (item: T) => boolean;
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  actions?: Action<T>[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchPlaceholder?: string;
}

const DataTable = <T extends { id: string }>({ 
    columns, 
    data, 
    onEdit, 
    onDelete,
    actions,
    searchTerm,
    setSearchTerm,
    searchPlaceholder = "Buscar en la tabla..."
}: DataTableProps<T>) => {
  
    const renderCell = (item: T, column: Column<T>) => {
        const value = item[column.accessor];
        if (column.render) {
            return column.render(value, item);
        }
        // Handle potential null or undefined values gracefully
        return <>{value === null || value === undefined ? '-' : String(value)}</>;
    };

    return (
    <div className="bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-slate-700">
      <div className="mb-4">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md p-3 bg-slate-800 border-2 border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b border-slate-700 text-sm text-slate-400">
            <tr>
              {columns.map((col) => (
                <th key={col.header} className="p-4">{col.header}</th>
              ))}
              {(onEdit || onDelete || (actions && actions.length > 0)) && <th className="p-4 text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((item) => (
              <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                {columns.map((col) => (
                  <td key={`${item.id}-${String(col.accessor)}`} className="p-4 align-middle">
                    {renderCell(item, col)}
                  </td>
                ))}
                {(onEdit || onDelete || (actions && actions.length > 0)) && (
                  <td className="p-4 text-right align-middle">
                    <div className="flex justify-end gap-4">
                      {actions?.map(action => {
                       const isDisabled = action.disabled ? action.disabled(item) : false;
                       const Icon = action.icon;
                       return (
                         <button 
                           key={action.label}
                           onClick={() => action.onClick(item)} 
                           className={`text-slate-400 hover:text-indigo-400 disabled:text-slate-600 disabled:cursor-not-allowed`}
                           title={action.label}
                           disabled={isDisabled}
                         >
                           <Icon className="h-5 w-5" />
                         </button>
                       )
                     })}
                      {onEdit && (
                        <button onClick={() => onEdit(item)} className="text-slate-400 hover:text-indigo-400">
                          <PencilIcon className="h-5 w-5" />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-400">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length + 1} className="text-center p-8 text-slate-400">
                  No se encontraron resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;