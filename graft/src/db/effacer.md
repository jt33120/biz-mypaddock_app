# src/db/effacer.ts

- Issue · type · L24-L26 — type Issue = | { ok: true; objets: number } | { ok: false; motif: string; message: string }
- dire · function · L36-L36 — dire = (motif: string)
- effacerLesReglages · function · L46-L54 — effacerLesReglages = (): number
- effacerAuServeur · function · L58-L80 — effacerAuServeur = async (): Promise<Issue>
- effacerLeTelephone · function · L86-L116 — effacerLeTelephone = async ( db: PowerSyncDatabase, ): Promise<{ photos: number; cles: number }>
