import React from 'react';

type Props<T> = {
  title: string;
  items: T[];
  loading: boolean;
  error: string | null;
  columns: Array<{ key: keyof T; label: string; render?: (value: any) => React.ReactNode }>;
};

const TableParametre = <T extends Record<string, any>>({
  title,
  items,
  loading,
  error,
  columns,
}: Props<T>) => {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-3 text-gray-600">Chargement...</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-6">Aucune donnée disponible</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={String(col.key)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {columns.map((col) => (
                        <td key={String(col.key)} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {col.render ? col.render(item[col.key]) : item[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TableParametre;