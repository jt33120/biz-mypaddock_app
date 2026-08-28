# src/ecrans/Chute.tsx

- Props · type · L18-L24 — type Props = { db: PowerSyncDatabase roulageId: string machineId: string | null date: string onEcrit: () => void }
- Chutes · function · L32-L120 — function Chutes({ db, roulageId, machineId, date, onEcrit }: Props)
- UneChute · function · L122-L234 — function UneChute({ db, c, ouverte, machineId, date, onEcrit }: { db: PowerSyncDatabase c: Tombee ouverte: boolean machineId: string | null date: string onEcrit: () => Promise<void> })
- ReparationsDeChute · function · L236-L341 — function ReparationsDeChute({ db, chuteId, machineId, dateRoulage, onEcrit }: { db: PowerSyncDatabase chuteId: string machineId: string | null dateRoulage: string onEcrit: () => Promise<void> })
- PhotosDeChute · function · L343-L491 — function PhotosDeChute({ db, chuteId, onEcrit }: { db: PowerSyncDatabase chuteId: string onEcrit: () => void })
- retirer · function · L395-L431 — retirer = async (p: Photo)
