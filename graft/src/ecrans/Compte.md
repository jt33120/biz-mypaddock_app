# src/ecrans/Compte.tsx

- Etape · type · L54-L54 — type Etape = 'formulaire' | 'confirmation'
- Compte · function · L56-L167 — function Compte({ db, identite, adoption, onLegal, onSonde }: { db: PowerSyncDatabase; identite: Identite | null /** L'état de la première sauvegarde, ENTREPRISE PAR L'APPLICATION. Cet écran * la raconte, il ne la déclenche plus. */ adoption: Adoption onLegal: () => void /** La sonde vit ICI depuis que le compte a pris sa place dans la barre basse. * C'est un instrument, pas un lieu : elle n'a jamais eu à occuper un onglet, * mais elle doit rester atteignable — le récit 7.1 exige que les trois * instruments de bord soient LISIBLES, pas seulement calculés. */ onSonde: () => void })
- Effacer · function · L177-L284 — function Effacer({ db, onEngager }: { db: PowerSyncDatabase /** Prévenir l'écran que le point de non-retour est franchi. Sans ce signal, * l'identité qui tombe pendant l'effacement démonte cette section avant * qu'elle n'ait rendu son résultat — voir le commentaire de `Compte`. */ onEngager: () => void })
- effacer · function · L192-L206 — effacer = async ()
- Emporter · function · L290-L373 — function Emporter({ db }: { db: PowerSyncDatabase })
- emporter · function · L299-L325 — emporter = async (avecPhotos: boolean)
- Anonyme · function · L377-L484 — function Anonyme({ db, onLegal }: { db: PowerSyncDatabase; onLegal: () => void })
- lancer · function · L388-L395 — lancer = async (action: () => Promise<Issue>)
- Repris · function · L499-L516 — function Repris({ etat }: { etat: BilanEnvoi })
- SauvegardeConnectee · function · L520-L637 — function SauvegardeConnectee({ db, identite, adoption }: { db: PowerSyncDatabase; identite: Identite; adoption: Adoption })
- envoyer · function · L545-L559 — envoyer = async ()
- Mesures · function · L646-L672 — function Mesures()
- basculer · function · L648-L648 — basculer = ()
- EnvoiDesPhotos · function · L694-L727 — function EnvoiDesPhotos()
