// PassagerDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { AppDispatch } from '../../../../../../app/store';  // importe seulement le type
import { fetchDevisForPassenger } from '../../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';

// Plus besoin de useDispatch ni de useAppDispatch ici

interface Passager {
  clientbeneficiaireInfoId: string;
  clientbeneficiaireInfo?: {
    nom?: string;
    prenom?: string;
  };
}

interface PassagerDropdownProps {
  passagers: Passager[];
  selectedEnteteId: string;
  dispatch: AppDispatch;                     // ← directement AppDispatch
  setDevisModalOpen: (open: boolean) => void;
}

const PassagerDropdown: React.FC<PassagerDropdownProps> = ({
  passagers,
  selectedEnteteId,
  dispatch,
  setDevisModalOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPassager = (clientId: string) => {
    dispatch(
      fetchDevisForPassenger({
        clientBeneficiaireInfoId: clientId,
        attestationEnteteId: selectedEnteteId,
      })
    );
    setDevisModalOpen(true);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block z-999" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium rounded border border-blue-200 hover:bg-blue-50 transition"
      >
        Devis:({passagers.length})
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {passagers.map((passager, idx) => {
              const nomComplet =
                passager.clientbeneficiaireInfo
                  ? `${passager.clientbeneficiaireInfo.nom || '?'} ${passager.clientbeneficiaireInfo.prenom || ''}`.trim()
                  : `Passager ${idx + 1}`;

              return (
                <button
                  key={passager.clientbeneficiaireInfoId}
                  onClick={() => handleSelectPassager(passager.clientbeneficiaireInfoId)}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition"
                >
                  {nomComplet}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassagerDropdown;