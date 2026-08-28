# src/recap/composer.ts

- Gabarit · type · L25-L25 — type Gabarit = 'perf' | 'budget' | 'geste'
- Matiere · type · L27-L46 — type Matiere = { circuit: string date: string sessions: number meilleurMs: number | null ecartMs: number | null /** FR-34 : une PREMIÈRE est un événement en soi, et le gabarit perf le dit. */ premiere: boolean cout: CoutRoulage | null gestes: string[] /** Le portrait de la machine, à défaut de photo. Ce n'est pas du décor de * remplissage : c'est l'objet du produit, déjà local, déjà payé, et c'est ce * qui rend l'image reconnaissable au premier coup d'œil dans un fil. */ sprite: string | null /** La photo de fond vient de la COPIE LOCALE, jamais d'une URL distante : * une autre origine teinte le canevas et l'export lève `SecurityError` — au * moment de l'export seulement, donc loin de la cause. Et FR-36 exige que le * récapitulatif se compose sans réseau, ce que la copie locale garantit. */ fond: Blob | null }
- direDate · function · L50-L52 — direDate = (iso: string)
- attendreLesFontes · function · L62-L70 — attendreLesFontes = async ()
- fond · function · L72-L85 — fond = (c: CanvasRenderingContext2D)
- libelle · function · L87-L93 — libelle = (c: CanvasRenderingContext2D, t: string, x: number, y: number)
- chiffre · function · L95-L99 — chiffre = (c: CanvasRenderingContext2D, t: string, x: number, y: number, taille = 120, teinte = ENCRE)
- coutAffichable · function · L110-L111 — coutAffichable = (cout: CoutRoulage | null, masquer: boolean)
- composer · function · L113-L233 — composer = async (m: Matiere, gabarit: Gabarit, masquerBudget: boolean): Promise<Blob>
- enFichier · function · L236-L240 — enFichier = (blob: Blob, circuit: string, date: string): File
