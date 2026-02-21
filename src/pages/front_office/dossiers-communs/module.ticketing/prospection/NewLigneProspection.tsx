import { FiSave, FiX } from "react-icons/fi";

interface NewLineRowProps {
  newLine: any;
  destinations: any[];
  servicesDisponibles: any[];
  updateNewLineField: (field: string, value: any) => void;
  updateServiceValue: (index: number, value: string) => void;
  handleSaveNewLine: () => void;
  handleCancelNewLine: () => void;
}

function NewLineRow({
  newLine,
  destinations,
  servicesDisponibles,
  updateNewLineField,
  updateServiceValue,
  handleSaveNewLine,
  handleCancelNewLine,
}: NewLineRowProps) {
  const inputClassName = "w-full min-w-[120px] px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white";
  const numberInputClassName = "w-full min-w-[140px] px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-right font-medium bg-white";

  function calculerDureeVol(dateDepart: string, dateArrive: string): string {
    if (!dateDepart || !dateArrive) return '';
    const depart = new Date(dateDepart);
    const arrive = new Date(dateArrive);
    const diffMs = arrive.getTime() - depart.getTime();
    if (diffMs <= 0) return '';
    const totalMinutes = Math.floor(diffMs / 60000);
    const heures = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${heures}h${String(minutes).padStart(2, '0')}`;
  }

  return (
    <tr className="bg-linear-to-r from-blue-50 to-blue-100/50 border-t-4 border-blue-400">
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      {/* <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td> */}
      <td className="px-4 py-3">
        <input
          type="number"
          step="1"
          value={newLine.nombre}
          onChange={(e) => updateNewLineField('nombre', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="1"
        />
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          value={newLine.numeroVol}
          onChange={(e) => updateNewLineField('numeroVol', e.target.value)}
          className={inputClassName}
          placeholder="MD-003"
          required
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="text"
          value={newLine.avion}
          onChange={(e) => updateNewLineField('avion', e.target.value)}
          className={inputClassName}
          placeholder="Boeing 737"
        />
      </td>

      <td className="px-4 py-3">
        <select
          value={newLine.departId}
          onChange={e => updateNewLineField('departId', e.target.value)}
          className={inputClassName}
          required
        >
          <option value="">— Départ —</option>
          {destinations.map(d => (
            <option key={d.id} value={d.id}>
              {d.code} – {d.ville}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <select
          value={newLine.destinationId}
          onChange={e => updateNewLineField('destinationId', e.target.value)}
          className={inputClassName}
          required
        >
          <option value="">— Destination —</option>
          {destinations.map(d => (
            <option key={d.id} value={d.id}>
              {d.code} – {d.ville}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-blue-300 rounded-lg bg-blue-50/50 text-sm min-w-[160px]">
          {newLine.departId && destinations.find(d => d.id === newLine.departId) ? (
            <span className="font-semibold text-blue-800">
              {destinations.find(d => d.id === newLine.departId)?.code}
            </span>
          ) : (
            <span className="text-slate-400">?</span>
          )}
          <span className="text-slate-500 font-bold">→</span>
          {newLine.destinationId && destinations.find(d => d.id === newLine.destinationId) ? (
            <span className="font-semibold text-blue-800">
              {destinations.find(d => d.id === newLine.destinationId)?.code}
            </span>
          ) : (
            <span className="text-slate-400">?</span>
          )}
        </div>
      </td>

      <td className="px-4 py-3">
        <select
          value={newLine.classe}
          onChange={(e) => updateNewLineField('classe', e.target.value)}
          className={inputClassName}
        >
          <option value="ECONOMIE">Économie</option>
          <option value="BUSINESS">Business</option>
          <option value="PREMIUM">Premium</option>
          <option value="PREMIERE">Première</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <select
          value={newLine.typePassager}
          onChange={(e) => updateNewLineField('typePassager', e.target.value)}
          className={inputClassName}
        >
          <option value="ADULTE">Adulte</option>
          <option value="ENFANT">Enfant</option>
          <option value="BEBE">Bébé</option>
        </select>
      </td>

      {/* Date Départ */}
      <td className="px-4 py-3">
        <input
          type="datetime-local"
          value={newLine.dateHeureDepart}
          onChange={(e) => {
            updateNewLineField('dateHeureDepart', e.target.value);
            const duree = calculerDureeVol(e.target.value, newLine.dateHeureArrive);
            if (duree) updateNewLineField('dureeVol', duree);
          }}
          className={inputClassName}
          required
        />
      </td>

      {/* Date Arrivée */}
      <td className="px-4 py-3">
        <input
          type="datetime-local"
          value={newLine.dateHeureArrive}
          onChange={(e) => {
            updateNewLineField('dateHeureArrive', e.target.value);
            const duree = calculerDureeVol(newLine.dateHeureDepart, e.target.value);
            if (duree) updateNewLineField('dureeVol', duree);
          }}
          className={inputClassName}
        />
      </td>

      {/* Durée Vol - readonly, calculé automatiquement */}
      <td className="px-4 py-3">
        <input
          type="text"
          value={newLine.dureeVol}
          readOnly
          className="w-full min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed"
          placeholder="Calculé auto"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="text"
          value={newLine.dureeEscale}
          onChange={(e) => updateNewLineField('dureeEscale', e.target.value)}
          className={inputClassName}
          placeholder="2h00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.puBilletCompagnieDevise}
          onChange={(e) => updateNewLineField('puBilletCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.puServiceCompagnieDevise}
          onChange={(e) => updateNewLineField('puServiceCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName}
          placeholder="0.00"
        />
      </td>

      {/* <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.puPenaliteCompagnieDevise}
          onChange={(e) => updateNewLineField('puPenaliteCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName}
          placeholder="0.00"
        />
      </td> */}

      {/* PU Pénalité Cie - champ grisé, non accessible */}
      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.puPenaliteCompagnieDevise}
          readOnly
          className="w-full min-w-[140px] px-3 py-2 border border-slate-200 rounded-lg text-sm text-right font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
          placeholder="—"
        />
      </td>

      <td className="px-4 py-3">
        <select
          value={newLine.devise}
          onChange={(e) => updateNewLineField('devise', e.target.value)}
          className={inputClassName}
        >
          <option value="EUR">EUR</option>
          <option value="USD">USD</option>
          <option value="MGA">MGA</option>
        </select>
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="1"
          value={newLine.tauxEchange}
          onChange={(e) => updateNewLineField('tauxEchange', Number(e.target.value))}
          className={numberInputClassName}
          placeholder="4900"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantBilletCompagnieDevise}
          onChange={(e) => updateNewLineField('montantBilletCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantServiceCompagnieDevise}
          onChange={(e) => updateNewLineField('montantServiceCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantPenaliteCompagnieDevise}
          onChange={(e) => updateNewLineField('montantPenaliteCompagnieDevise', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantBilletClientDevise}
          onChange={(e) => {
            const val = e.target.value;
            // Autorise vide temporairement (pour effacer)
            if (val === '' || val === '-' || val === '.') {
              updateNewLineField('montantBilletClientDevise', val);
            } else {
              const num = Number(val);
              if (!isNaN(num)) {
                updateNewLineField('montantBilletClientDevise', num);
              }
              // sinon on ignore (pas de mise à jour si lettre tapée)
            }
          }}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantServiceClientDevise}
          onChange={(e) => updateNewLineField('montantServiceClientDevise', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={newLine.montantPenaliteClientDevise}
          onChange={(e) => updateNewLineField('montantPenaliteClientDevise', Number(e.target.value))}
          className={numberInputClassName + " text-emerald-700"}
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>
      <td className="px-4 py-3 text-center text-slate-400 italic text-sm">Auto</td>

      

      <td className="px-4 py-4">
        {servicesDisponibles.length === 0 ? (
          <div className="text-amber-600 py-2 text-sm">Aucun service</div>
        ) : (
          <div className="flex flex-row gap-3 text-sm">
            {servicesDisponibles.map((svc, idx) => {
              const current = newLine.serviceValues[idx];
              if (!current) return null;

              const isBoolean =
                svc.type === 'SPECIFIQUE' || svc.type === 'SERVICE' &&
                !svc.libelle.toLowerCase().includes('bagage') &&
                !svc.libelle.toLowerCase().includes('supplément') ;

              return (
                <div key={svc.id} className="flex flex-col gap-1.5 p-3 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <label className="text-xs font-semibold text-slate-700">
                    {svc.libelle}
                    {/* <span className="ml-1 text-slate-400 font-normal">({svc.code})</span> */}
                  </label>
                  {isBoolean ? (
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={current.valeur === 'true'}
                        onChange={(e) => updateServiceValue(idx, e.target.checked ? 'true' : 'false')}
                        className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">Activé</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={current.valeur}
                      onChange={(e) => updateServiceValue(idx, e.target.value)}
                      placeholder={svc.libelle.includes('Bagage') ? 'ex: 23Kg' : 'valeur'}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        <div className="flex flex-col gap-2 min-w-[100px]">
          <button
            onClick={handleSaveNewLine}
            disabled={newLine.isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            title="Enregistrer"
          >
            {newLine.isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Enregistrer
              </>
            )}
          </button>

          <button
            onClick={handleCancelNewLine}
            disabled={newLine.isSaving}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
            title="Annuler"
          >
            <FiX size={16} />
            Annuler
          </button>
        </div>
      </td>
    </tr>
  );
}

export default NewLineRow;