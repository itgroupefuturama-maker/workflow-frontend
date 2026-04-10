import React from 'react';

const SuccesCreateCompte: React.FC = () => {
  const steps = [
    'Compte créé et sécurisé',
    'Email de confirmation envoyé',
    'Accès immédiat à votre espace',
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="bg-white border border-gray-100 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">

        {/* Icône */}
        <div className="w-18 h-18 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6"
          style={{ width: 72, height: 72 }}>
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5}
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-medium text-gray-900 mb-3">
          Compte créé avec succès <br /> dans <span className="text-blue-600">Al Bouraq App</span>
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Votre espace est prêt. Vous pouvez dès maintenant vous connecter et commencer à l'utiliser.
        </p>

        <hr className="border-gray-100 mb-6" />

        {/* Étapes */}
        <div className="flex flex-col gap-2.5 mb-8 text-left">
          {steps.map((step) => (
            <div key={step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor"
                  strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <span className="text-sm text-gray-500">{step}</span>
            </div>
          ))}
        </div>

        {/* Bouton */}
        <button
          onClick={() => window.location.href = '/'}
          className="w-full py-3 px-6 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 active:scale-99 transition-all"
        >
          Aller à l'accueil
        </button>

        {/* <p className="mt-4 text-xs text-gray-400">
          Déjà un compte ?{' '}
          <a href="/login" className="text-blue-600 font-medium hover:underline">
            Se connecter
          </a>
        </p> */}

      </div>
    </div>
  );
};

export default SuccesCreateCompte;