# src/db/accueil.ts

- Source · type · L25-L37 — type Source = | { genre: 'a_venir'; roulage: Prochain; jours: number; meilleurIci: number | null } | { genre: 'dernier'; roulage: Prochain; jours: number; meilleurIci: number | null } // ─── ÉPIQUE 9 : les quatre sources de l'atelier ──────────────────────── // « C'est ce branchement qui referme le vide saisonnier », pas l'axe machine // seul. Sans elles, entre novembre et avril, l'accueil n'a qu'un roulage // vieux de cinq mois à montrer — et un produit qui répète la même chose // pendant cinq mois est un produit qu'on cesse d'ouvrir. | { genre: 'anniversaire'; libelle: string; circuit: string; ans: number } | { genre: 'evenement'; libelle: string; jours: number | null; centimes: number | null } | { genre: 'piece'; libelle: string; machine: string; n: number } | { genre: 'reparations'; n: number; machine: string } | { genre: 'vide' }
- Prochain · type · L39-L49 — type Prochain = { id: string circuit_nom: string /** Nulle est un état valide (AD-2). Sert à dériver la préparation : sans * machine, la liste se réduit aux points qui ne dépendent pas d'une moto. */ machine_id: string | null date_jour: string meilleur: number | null sessions: number cout_centimes: number }
- ecartJours · function · L53-L54 — ecartJours = (de: string, a: string): number
- sourceAccueil · function · L77-L182 — sourceAccueil = async (db: PowerSyncDatabase, jour: string): Promise<Source>
- meilleurAuCircuit · function · L187-L203 — meilleurAuCircuit = async ( db: PowerSyncDatabase, circuit: string, saufRoulageId: string, ): Promise<number | null>
- direAVenir · function · L215-L216 — direAVenir = (jours: number): string
- direPasse · function · L218-L219 — direPasse = (jours: number): string
- direLeJour · function · L227-L229 — direLeJour = (jour: string): string
- conseilDuJour · function · L246-L259 — conseilDuJour = async ( db: PowerSyncDatabase, jour: string, ): Promise<string | null>
- EtatPlan · type · L265-L265 — type EtatPlan = { texte: string | null; sessions: number; inviter: boolean }
- etatPlan · function · L269-L279 — etatPlan = async (db: PowerSyncDatabase, jour: string): Promise<EtatPlan>
- inviteEcartee · function · L282-L284 — inviteEcartee = (): boolean
- ecarterInvite · function · L285-L287 — ecarterInvite = ()
- poserPlan · function · L292-L299 — poserPlan = async (db: PowerSyncDatabase, texte: string)
