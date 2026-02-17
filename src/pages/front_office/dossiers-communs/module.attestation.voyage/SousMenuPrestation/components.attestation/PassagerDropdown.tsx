// PassagerDropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AppDispatch } from '../../../../../../app/store';
import { fetchDevisForPassenger } from '../../../../../../app/front_office/parametre_attestation/attestationEnteteSlice';

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
  dispatch: AppDispatch;
  setDevisModalOpen: (open: boolean) => void;
}

const PassagerDropdown: React.FC<PassagerDropdownProps> = ({
  passagers,
  selectedEnteteId,
  dispatch,
  setDevisModalOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openDropdown = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownWidth = 256;
      const left = Math.min(
        rect.right - dropdownWidth,
        window.innerWidth - dropdownWidth - 8
      );
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: Math.max(8, left + window.scrollX),
      });
    }
    setIsOpen(true);
  };

  // Ferme si clic en dehors (bouton + dropdown portal)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const clickedBtn = btnRef.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);
      if (!clickedBtn && !clickedDropdown) {
        setIsOpen(false);
      }
    };

    const handleClose = () => setIsOpen(false);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [isOpen]);

  // ← Même logique que la version qui fonctionne
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

  const dropdownMenu = isOpen
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: 256,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          <div className="py-1">
            {passagers.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400 italic">Aucun passager</p>
            ) : (
              passagers.map((passager, idx) => {
                const nomComplet = passager.clientbeneficiaireInfo
                  ? `${passager.clientbeneficiaireInfo.nom || '?'} ${passager.clientbeneficiaireInfo.prenom || ''}`.trim()
                  : `Passager ${idx + 1}`;

                return (
                  <button
                    key={passager.clientbeneficiaireInfoId}
                    // onMouseDown pour s'exécuter AVANT le handleClickOutside
                    onMouseDown={() => handleSelectPassager(passager.clientbeneficiaireInfoId)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-800 hover:bg-gray-100 transition"
                  >
                    {nomComplet}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative inline-block">
      <button
        ref={btnRef}
        onClick={openDropdown}
        className="px-4 py-2 text-blue-600 hover:text-blue-800 hover:underline text-xs font-medium rounded border border-blue-200 hover:bg-blue-50 transition"
      >
        PDF/Packs({passagers.length})
      </button>

      {dropdownMenu}
    </div>
  );
};

export default PassagerDropdown;