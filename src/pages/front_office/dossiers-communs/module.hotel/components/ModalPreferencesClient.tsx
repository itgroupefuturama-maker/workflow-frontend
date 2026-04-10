import { X, Star, MapPin, Calendar, Users, Clock, Bed, Coffee, Car, Baby, Cigarette, DollarSign, MessageSquare, Heart } from 'lucide-react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  prestationId: string;
};

// ─── Données statiques (à remplacer par un fetch avec prestationId) ───────────
const STATIC_PREFERENCES = {
  hotel: {
    typeEtoiles: '3 étoiles',
    emplacement: 'Centre-ville, proche commerces',
  },
  sejour: {
    dateArrivee: '2026-04-10',
    dateDepart: '2026-04-13',
    nombreNuits: 3,
    heureArrivee: '14h00',
    heureDepart: '11h00',
    motif: 'Vacances en famille',
  },
  personnes: {
    nombreTotal: 4,
    adultes: 2,
    enfants: 1,
    bebes: 1,
    ageEnfants: '8 ans',
    ageBebes: '18 mois',
  },
  chambre: {
    typeChambre: 'Deluxe',
    nombreChambres: 2,
    configurationLit: 'Grand lit + lits séparés',
    litSupplementaire: true,
    canapeLit: false,
    vue: 'Jardin',
    etage: 'Étage élevé',
    procheAscenseur: false,
    chambreCalme: true,
    chambresCommunicantes: true,
    chambresCoteACote: false,
  },
  services: {
    petitDejeuner: true,
    demiPension: false,
    pensionComplete: false,
    transfertAeroport: true,
    litBebe: true,
    nonFumeur: true,
  },
  budget: {
    budgetParNuit: '150 000 – 200 000 Ar',
  },
  demandesSpecifiques:
    'Souhaite une chambre au calme, loin de la route. Allergie aux parfums d\'ambiance. Anniversaire de mariage le 12 avril.',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Badge = ({ value, positive = true }: { value: boolean; positive?: boolean }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
      value
        ? positive
          ? 'bg-emerald-100 text-emerald-700'
          : 'bg-red-100 text-red-600'
        : 'bg-neutral-100 text-neutral-500'
    }`}
  >
    {value ? 'Oui' : 'Non'}
  </span>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-neutral-100 last:border-0">
    <span className="text-xs text-neutral-500 shrink-0">{label}</span>
    <span className="text-xs font-medium text-neutral-800 text-right">{value}</span>
  </div>
);

const SectionTitle = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
    <span className="text-neutral-400">{icon}</span>
    <h3 className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">{label}</h3>
  </div>
);

// ─── Composant principal ──────────────────────────────────────────────────────
const ModalPreferencesClient = ({ isOpen, onClose, prestationId }: Props) => {
  const p = STATIC_PREFERENCES;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40  transition-opacity"
        onClick={onClose}
      />

      {/* Panneau latéral droit */}
      <div
        className={`
          fixed mr-4 right-0 w-[370px] h-[calc(100vh-8rem)] bg-white z-50 shadow-2xl
          flex flex-col transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 bg-neutral-900 shrink-0">
          <div>
            <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest mb-0.5">
              Dossier · {prestationId.slice(-6).toUpperCase()}
            </p>
            <h2 className="text-sm font-bold text-white">Fiche de préférences client</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Hôtel ── */}
          <SectionTitle icon={<Star className="w-3.5 h-3.5" />} label="Hôtel" />
          <Row label="Type / étoiles" value={p.hotel.typeEtoiles} />
          <Row label="Emplacement" value={p.hotel.emplacement} />

          {/* ── Séjour ── */}
          <SectionTitle icon={<Calendar className="w-3.5 h-3.5" />} label="Séjour" />
          <Row
            label="Dates"
            value={`${new Date(p.sejour.dateArrivee).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} → ${new Date(p.sejour.dateDepart).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
          />
          <Row label="Nombre de nuits" value={`${p.sejour.nombreNuits} nuits`} />
          <Row label="Heure d'arrivée estimée" value={p.sejour.heureArrivee} />
          <Row label="Heure de départ souhaitée" value={p.sejour.heureDepart} />
          <Row label="Motif du séjour" value={p.sejour.motif} />

          {/* ── Personnes ── */}
          <SectionTitle icon={<Users className="w-3.5 h-3.5" />} label="Personnes" />
          <Row label="Total" value={`${p.personnes.nombreTotal} personnes`} />
          <Row label="Adultes" value={p.personnes.adultes} />
          <Row
            label="Enfants"
            value={p.personnes.enfants > 0 ? `${p.personnes.enfants} (${p.personnes.ageEnfants})` : '0'}
          />
          <Row
            label="Bébés"
            value={p.personnes.bebes > 0 ? `${p.personnes.bebes} (${p.personnes.ageBebes})` : '0'}
          />

          {/* ── Chambre ── */}
          <SectionTitle icon={<Bed className="w-3.5 h-3.5" />} label="Chambre" />
          <Row label="Type" value={p.chambre.typeChambre} />
          <Row label="Nombre" value={`${p.chambre.nombreChambres} chambre(s)`} />
          <Row label="Configuration lit" value={p.chambre.configurationLit} />
          <Row label="Lit supplémentaire" value={<Badge value={p.chambre.litSupplementaire} />} />
          <Row label="Canapé-lit" value={<Badge value={p.chambre.canapeLit} />} />
          <Row label="Vue souhaitée" value={p.chambre.vue} />
          <Row label="Étage" value={p.chambre.etage} />
          <Row label="Proche ascenseur" value={<Badge value={p.chambre.procheAscenseur} />} />
          <Row label="Chambre calme" value={<Badge value={p.chambre.chambreCalme} />} />
          <Row label="Chambres communicantes" value={<Badge value={p.chambre.chambresCommunicantes} />} />
          <Row label="Chambres côte à côte" value={<Badge value={p.chambre.chambresCoteACote} />} />

          {/* ── Services ── */}
          <SectionTitle icon={<Coffee className="w-3.5 h-3.5" />} label="Services" />
          <Row label="Petit-déjeuner inclus" value={<Badge value={p.services.petitDejeuner} />} />
          <Row label="Demi-pension" value={<Badge value={p.services.demiPension} />} />
          <Row label="Pension complète" value={<Badge value={p.services.pensionComplete} />} />
          <Row label="Transfert aéroport" value={<Badge value={p.services.transfertAeroport} />} />
          <Row label="Lit bébé (berceau)" value={<Badge value={p.services.litBebe} />} />
          <Row
            label="Chambre non-fumeur"
            value={<Badge value={p.services.nonFumeur} />}
          />

          {/* ── Budget ── */}
          <SectionTitle icon={<DollarSign className="w-3.5 h-3.5" />} label="Budget" />
          <Row label="Budget par nuit" value={p.budget.budgetParNuit} />

          {/* ── Demandes spécifiques ── */}
          <SectionTitle icon={<MessageSquare className="w-3.5 h-3.5" />} label="Demandes spécifiques" />
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-900 leading-relaxed italic">
              {p.demandesSpecifiques || '—'}
            </p>
          </div>

          {/* Padding bas */}
          <div className="h-6" />
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-neutral-200 bg-neutral-50">
          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </>
  );
};

export default ModalPreferencesClient;