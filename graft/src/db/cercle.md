# src/db/cercle.ts

- Cercle · type · L31-L31 — type Cercle = { id: string; nom: string; code: string }
- Membre · type · L32-L32 — type Membre = { pilote_id: string; pseudo: string }
- LigneCercle · type · L33-L36 — type LigneCercle = { id: string; pseudo: string; circuit_nom: string; date_jour: string meilleur_ms: number | null }
- Reponse · type · L52-L52 — type Reponse<T> = { valeur: T; souci: string | null }
- mesCercles · function · L56-L61 — mesCercles = async (): Promise<Reponse<Cercle[]>>
- creerCercle · function · L76-L84 — creerCercle = async (nom: string, pseudo: string): Promise<string | null>
- rejoindre · function · L86-L101 — rejoindre = async (code: string, pseudo: string): Promise<string | null>
- membres · function · L103-L109 — membres = async (cercleId: string): Promise<Reponse<Membre[]>>
- roulagesDuCercle · function · L118-L130 — roulagesDuCercle = async ( cercleId: string, circuit: string, ): Promise<Reponse<LigneCercle[]>>
- pivot · function · L135-L137 — pivot = (nom: string): string
- chronoVisible · function · L141-L145 — chronoVisible = async (db: PowerSyncDatabase, roulageId: string)
- rendreVisible · function · L147-L153 — rendreVisible = async ( db: PowerSyncDatabase, roulageId: string, oui: boolean, )
