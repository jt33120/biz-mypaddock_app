# src/ecrans/Garage.tsx

- Garage · function · L30-L483 — function Garage({ db, onEcrit }: { db: PowerSyncDatabase /** Le garage écrit des roulages et des machines : sans ce rappel, le reste de * l'application ne le savait pas et la liste des roulages restait vide. * Trouvé par l'essai, pas par la relecture — un écran qui ne se rafraîchit * pas ne se signale jamais. */ onEcrit: () => void })
- verser · function · L82-L87 — verser = async (f: File)
- fabriquer · function · L89-L111 — fabriquer = async ()
- garder · function · L113-L120 — garder = async ()
- importerCbr · function · L123-L128 — importerCbr = async ()
- importerSaison · function · L143-L165 — importerSaison = async ()
- Declarer · function · L498-L556 — function Declarer({ machine, onValider }: { machine?: Machine onValider: (m: { marque: string; modele: string; annee: number | null prixAchatCentimes: number | null; acheteeLe: string | null }) => Promise<void> })
