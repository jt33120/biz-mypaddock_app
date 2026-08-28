# src/db/usure.ts

- Niveau · type · L32-L32 — type Niveau = 'debutant' | 'intermediaire' | 'confirme' | 'racer'
- niveauDuGroupe · function · L46-L59 — niveauDuGroupe = (rang: number | null, total: number | null): Niveau | null
- Avancement · type · L68-L86 — type Avancement = { /** Roulages pondérés depuis le dernier geste consigné. Pas des kilomètres : * le téléphone n'est pas le capteur, et personne ne relève son compteur. */ ponderes: number /** L'intervalle transcrit du barème. `null` = aucun barème connu, et alors * l'horloge COMPTE sans jamais échoir — elle n'invente pas d'échéance. */ intervalle: number | null /** ⚠ CE QUE LE MANUEL DIT, MOT POUR MOT — « tous les 6 000 km ou 12 mois ». * Il ne se convertit JAMAIS en `intervalle` : une journée de piste vaut 200 à * 300 km selon le circuit et le groupe, et la conversion serait une * interprétation sur la sécurité d'une machine (FR-44). Les deux champs * coexistent donc, et ils ne disent pas la même chose : l'un fait échoir * l'horloge, l'autre l'informe sans jamais la faire échoir. */ barometre: string | null /** FR-40 — la complétude, dans le même objet, obligatoirement. */ completude: { saisis: number; sansGroupe: number } /** FR-61 — la provenance de la recommandation, jamais un état de la machine. */ source: { url: string | null; recolteLe: string | null; extraitParIa: boolean } }
- Horloge · type · L88-L93 — type Horloge = { id: string machine_id: string operation: string avancement: Avancement }
- Ligne · type · L95-L101 — type Ligne = { id: string; machine_id: string; operation: string intervalle_roulages: number | null barometre: string | null source_url: string | null; recolte_le: string | null; extrait_par_ia: number | null depuis_intervention: string | null }
- horloges · function · L111-L172 — horloges = async ( db: PowerSyncDatabase, machineId: string, jour = aujourdhui(), ): Promise<Horloge[]>
- coef · function · L125-L126 — coef = (n: Niveau | null)
- poserHorloge · function · L177-L188 — poserHorloge = async ( db: PowerSyncDatabase, h: { machineId: string; operation: string; intervalle?: number | null }, )
- repartirDe · function · L193-L199 — repartirDe = async ( db: PowerSyncDatabase, horlogeId: string, interventionId: string, )
- oublierHorloge · function · L201-L202 — oublierHorloge = (db: PowerSyncDatabase, id: string)
- cestFaitDepuisLHorloge · function · L213-L229 — cestFaitDepuisLHorloge = async ( db: PowerSyncDatabase, horlogeId: string, jour: string, ): Promise<string | null>
