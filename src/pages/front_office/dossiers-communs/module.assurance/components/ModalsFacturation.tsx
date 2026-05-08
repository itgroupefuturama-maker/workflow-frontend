/* ─────────────────────── modal facturation ──────────────── */

import { FiX } from "react-icons/fi";
import { updateAssuranceFacture, type UpdateFacturePayload } from "../../../../../app/front_office/parametre_assurance/assuranceEnteteDetailSlice";
import { fmtNum } from "../utils/formatters";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../../../../app/store";
import { useState } from "react";

const EMPTY_FORM = {
  tauxChangeFacture:       '',
  puFactureAssureurDevise: '',
  puFactureAssureurAriary: '',
  puFactureClientAriary:   '',
  commissionFactureAriary: '',
  numeroPolice:            '',
  numeroQuittance:         '',
};

export const FactureModal = ({
  assuranceId,
  initial,
  tarifRef,        // ← nouveau prop
  onClose,
  onSaved,
}: {
  assuranceId: string;
  initial:     typeof EMPTY_FORM;
  tarifRef?:   {                  // tarif de référence pour pré-remplissage
    prixAssureurDevise: number;
    commissionDevise:   number;
    prixClientDevise:   number;
    prixAssureurAriary: number;
    commissionAriary:   number;
    prixClientAriary:   number;
    devise:             string;
  };
  onClose:  () => void;
  onSaved:  () => void;
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [form,   setForm]   = useState(initial);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  /* ── Recalcul automatique quand le taux change ── */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm(prev => {
      const next = { ...prev, [name]: value };

      if (name === 'tauxChangeFacture' && tarifRef) {
        const taux = parseFloat(value) || 0;
        next.puFactureAssureurDevise = String(tarifRef.prixAssureurDevise);
        next.puFactureAssureurAriary = String(Math.round(tarifRef.prixAssureurDevise * taux));
        next.puFactureClientAriary   = String(Math.round(tarifRef.prixClientDevise   * taux));
        next.commissionFactureAriary = String(Math.round(tarifRef.commissionDevise   * taux));
      }

      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setSaving(true);
    try {
      const payload: UpdateFacturePayload = {
        assuranceId,
        tauxChangeFacture:       Number(form.tauxChangeFacture),
        puFactureAssureurDevise: Number(form.puFactureAssureurDevise),
        puFactureAssureurAriary: Number(form.puFactureAssureurAriary),
        puFactureClientAriary:   Number(form.puFactureClientAriary),
        commissionFactureAriary: Number(form.commissionFactureAriary),
        numeroPolice:            form.numeroPolice,
        numeroQuittance:         form.numeroQuittance,
      };
      await dispatch(updateAssuranceFacture(payload)).unwrap();
      onSaved();
    } catch (e: any) {
      setErr(e ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const devise = tarifRef?.devise ?? '';

  const numericFields: {
    name:  keyof typeof EMPTY_FORM;
    label: string;
    hint?: string;
    auto?: boolean;   // champ recalculé automatiquement
  }[] = [
    { name: 'tauxChangeFacture',       label: 'Taux de change',        hint: `1 ${devise} = ? Ar` },
    { name: 'puFactureAssureurDevise', label: `PU assureur (${devise || 'devise'})`, auto: true },
    { name: 'puFactureAssureurAriary', label: 'PU assureur (Ar)',       auto: true },
    { name: 'puFactureClientAriary',   label: 'PU client (Ar)',         auto: true },
    { name: 'commissionFactureAriary', label: 'Commission (Ar)',        auto: true },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm font-bold text-gray-900">Saisir les données de facturation</p>
            <p className="text-xs text-gray-400 mt-0.5">ID assurance</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-100 transition">
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Rappel tarif de référence */}
          {tarifRef && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-100 px-4 py-3 text-xs space-y-1">
              <p className="font-bold text-indigo-600 uppercase tracking-widest text-[10px] mb-1">
                Tarif de référence ({tarifRef.devise})
              </p>
              <div className="grid grid-cols-3 gap-x-4 text-gray-600">
                <span>Assureur</span>
                <span className="text-right">{fmtNum(tarifRef.prixAssureurDevise)} {tarifRef.devise}</span>
                <span className="text-right">{fmtNum(tarifRef.prixAssureurAriary)} Ar</span>

                <span className="text-amber-600">Commission</span>
                <span className="text-right text-amber-600">{fmtNum(tarifRef.commissionDevise)} {tarifRef.devise}</span>
                <span className="text-right text-amber-600">{fmtNum(tarifRef.commissionAriary)} Ar</span>

                <span className="font-bold text-indigo-700">Client</span>
                <span className="text-right font-bold text-indigo-700">{fmtNum(tarifRef.prixClientDevise)} {tarifRef.devise}</span>
                <span className="text-right font-bold text-indigo-700">{fmtNum(tarifRef.prixClientAriary)} Ar</span>
              </div>
            </div>
          )}

          {/* champs numériques */}
          <div className="grid grid-cols-2 gap-3">
            {numericFields.map(({ name, label, hint, auto }) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                  {label}
                  {auto && (
                    <span className="text-[9px] bg-amber-50 text-amber-500 border border-amber-200 px-1 rounded">
                      auto
                    </span>
                  )}
                </label>
                {hint && <span className="text-[10px] text-gray-300">{hint}</span>}
                <input
                  type="number"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className={`border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition ${
                    auto
                      ? 'border-amber-200 bg-amber-50/40 focus:ring-amber-200'
                      : 'border-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* champs texte */}
          <div className="grid grid-cols-2 gap-3">
            {(['numeroPolice', 'numeroQuittance'] as const).map((name) => (
              <div key={name} className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {name === 'numeroPolice' ? 'N° police' : 'N° quittance'}
                </label>
                <input
                  type="text"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            ))}
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-4 py-2">
              ⚠️ {err}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition inline-flex items-center gap-2">
              {saving && (
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
              )}
              {saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

