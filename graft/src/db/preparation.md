# src/db/preparation.ts

- Genre · type · L61-L61 — type Genre = 'piece' | 'usure' | 'chute' | 'argent'
- Tache · type · L63-L84 — type Tache = { genre: Genre libelle: string /** Le fait qui la produit, dit en clair. Une tâche sans son motif est un ordre ; * avec son motif, c'est un constat qu'on peut contester. */ motif: string /** * FR-40 — LA COMPLÉTUDE DU CHIFFRE, DANS LE MÊME OBJET QUE LE CHIFFRE. * * ⚠ ELLE MANQUAIT ICI, ET FR-40 N'A PAS D'EXCEPTION D'ÉCRAN. Le garage * affiche « sur 7 roulages saisis » à côté de chaque horloge (Usure.tsx) ; * l'avant-roulage affichait le même chiffre tout nu, donc avec une précision * que sa source n'a pas — et sur les seules lignes du produit qui touchent la * sécurité d'une machine. Elle est portée par le TYPE plutôt que par un * ternaire de rendu, exactement comme `Avancement` : ce qui est dans le type * ne se contourne pas à la troisième correction. */ complet: string | null /** Où aller pour la traiter. Une ligne qui ne mène nulle part ne sert à rien — * c'est le défaut classique d'une liste de rappels. */ vers: 'atelier' | 'usure' | 'budget' }
- poserLesPostesDeBase · function · L128-L142 — poserLesPostesDeBase = async ( db: PowerSyncDatabase, machineId: string, ): Promise<number>
- cequiResteAFaire · function · L151-L261 — cequiResteAFaire = async ( db: PowerSyncDatabase, roulage: { id: string; machineId: string | null; date: string }, ): Promise<Tache[]>
- direLaCompletude · function · L266-L268 — direLaCompletude = (c: { saisis: number; sansGroupe: number }): string
- noyauDeTache · function · L285-L285 — noyauDeTache = (s: string)
- memeTache · function · L286-L286 — memeTache = (a: string, b: string)
