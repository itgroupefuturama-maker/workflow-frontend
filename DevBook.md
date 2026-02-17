<!-- Calcule de prix dans le benchmarking Hotel -->

<!-- Si % change (ex: 5%) -->
Forfaitaire Unit. = prixBenchmark × (5 / 100)
Forfaitaire Global = Forfaitaire Unit. × nbChambreClient
Montant Commission = Forfaitaire Global

 <!-- Si Forfaitaire Unit. change -->
% sur Prix Unit. = (Forfaitaire Unit. / prixBenchmark) × 100
Forfaitaire Global = Forfaitaire Unit. × nbChambreClient
Montant Commission = Forfaitaire Global

 <!-- Si Forfaitaire Global change -->
Forfaitaire Unit. = Forfaitaire Global / nbChambreClient
% sur Prix Unit. = (Forfaitaire Unit. / prixBenchmark) × 100
Montant Commission = Forfaitaire Global

 <!-- Ligne Client -->
Nuitée (Devise) = prixBenchmark + Forfaitaire Unit.
Nuitée (Ar) = Nuitée (Devise) × Taux Change
Montant (Ar) = Nuitée (Ar) × nbChambreClient