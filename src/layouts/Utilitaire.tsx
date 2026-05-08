export const SectionHeader = ({ label, onAdd }: { label: string; onAdd: () => void }) => (
  <div className="flex justify-end mb-4">
    <button onClick={onAdd} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm">
      + {label}
    </button>
  </div>
);

export const TableWrapper = ({ headers, children }: { headers: string[]; children: React.ReactNode }) => (
  <div className="overflow-x-auto rounded-xl shadow border border-gray-100">
    <table className="min-w-full bg-white text-sm">
      <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
        <tr>
          {headers.map(h => (
            <th key={h} className="px-4 py-3 text-left font-semibold tracking-wide">{h}</th>
          ))}
          <th className="px-4 py-3 text-left font-semibold tracking-wide">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">{children}</tbody>
    </table>
  </div>
);

export const ActionButtons = () => (
  <div className="flex gap-2">
    {/* <button className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100">✏️ Modifier</button>
    <button className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100">🗑️ Supprimer</button> */}
  </div>
);

export const LoadingRow = () => (
  <tr><td colSpan={99} className="text-center py-6 text-gray-400">Chargement...</td></tr>
);

export const EmptyRow = ({ colSpan = 4 }: { colSpan?: number }) => (
  <tr><td colSpan={colSpan} className="text-center py-6 text-gray-400">Aucune donnée</td></tr>
);