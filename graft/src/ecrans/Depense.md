# src/ecrans/Depense.tsx

- Props · type · L42-L50 — type Props = { db: PowerSyncDatabase /** Le roulage d'où l'on vient, s'il y en a un. Sans lui la cible « journée » * n'a rien à désigner et ne s'affiche pas — plutôt que de s'afficher morte. */ roulageId: string | null dateRoulage: string | null onFini: (centimes: number) => void | Promise<void> onAnnuler: () => void }
- Depense · function · L52-L293 — function Depense({ db, roulageId, dateRoulage, onFini, onAnnuler }: Props)
- valider · function · L104-L136 — valider = async ()
- relire · function · L138-L150 — relire = async ()
