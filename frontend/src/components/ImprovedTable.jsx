import { useState } from "react";

function ImprovedTable({ 
  columns, 
  data, 
  loading = false, 
  emptyMessage = "No data available",
  onRowClick,
  actions 
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const sortedData = data ? [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  }) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-200">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="p-4 animate-pulse">
              <div className="flex items-center gap-4">
                {Array.from({ length: columns.length }).map((_, colIndex) => (
                  <div key={colIndex} className="flex-1">
                    <div className="h-4 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-100 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-6 py-3 text-left"
                >
                  {column.sortable ? (
                    <button
                      onClick={() => handleSort(column.key)}
                      className="flex items-center gap-2 text-xs font-medium text-slate-600 uppercase tracking-wide hover:text-slate-900 transition-colors"
                    >
                      {column.title}
                      <span className="flex flex-col">
                        <span 
                          className={`text-xs ${
                            sortConfig.key === column.key && sortConfig.direction === 'asc'
                              ? 'text-blue-600'
                              : 'text-slate-400'
                          }`}
                        >
                          ▲
                        </span>
                        <span 
                          className={`text-xs -mt-1 ${
                            sortConfig.key === column.key && sortConfig.direction === 'desc'
                              ? 'text-blue-600'
                              : 'text-slate-400'
                          }`}
                        >
                          ▼
                        </span>
                      </span>
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                      {column.title}
                    </span>
                  )}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right">
                  <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Actions
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {sortedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={columns.length + (actions ? 1 : 0)} 
                  className="px-6 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                      <span className="text-2xl text-slate-400">📋</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-900 mb-1">
                        {emptyMessage}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Try adjusting your filters or create a new entry.
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedData.map((row, index) => (
                <tr 
                  key={row.id || index}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4">
                      <div className="text-sm text-slate-900">
                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                      </div>
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ImprovedTable;
