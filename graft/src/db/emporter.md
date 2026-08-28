# src/db/emporter.ts

- filtreEmport · function · L55-L56 — filtreEmport = (table: string)
- Poids · type · L74-L82 — type Poids = { lignes: number /** Photos dont la copie locale existe, donc joignables au fichier. */ photos: number octetsPhotos: number /** Photos connues de la base mais SANS copie locale : elles ne peuvent pas * être jointes, et le fichier le dira au lieu de les passer sous silence. */ photosAbsentes: number }
- photosLocales · function · L84-L97 — photosLocales = async (db: PowerSyncDatabase)
- peser · function · L99-L123 — peser = async (db: PowerSyncDatabase): Promise<Poids>
- enDataUri · function · L125-L130 — enDataUri = (b: Blob)
- composer · function · L137-L197 — composer = async ( db: PowerSyncDatabase, avecPhotos: boolean, jour = new Date().toISOString(), ): Promise<File>
- formaterPoids · function · L201-L203 — formaterPoids = (octets: number): string
