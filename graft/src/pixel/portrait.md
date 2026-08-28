# src/pixel/portrait.ts

- Issue · type · L29-L31 — type Issue = | { ok: true; sprite: Sprite; reste: number; version: string } | { ok: false; motif: string; message: string; reste?: number }
- dire · function · L53-L53 — dire = (motif: string)
- Sujet · type · L65-L67 — type Sujet = | { machineId: string; equipementId?: never } | { equipementId: string; machineId?: never }
- jetonDeFabrique · function · L86-L89 — jetonDeFabrique = async (): Promise<string | null>
- fabriqueOuverte · function · L93-L94 — fabriqueOuverte = async (): Promise<boolean>
- genererPortrait · function · L96-L145 — genererPortrait = async ( _db: PowerSyncDatabase, sujet: Sujet | string, photo: Blob, piloteEnSelle = false, ): Promise<Issue>
- portraitsFaits · function · L181-L184 — portraitsFaits = async (db: PowerSyncDatabase): Promise<number>
