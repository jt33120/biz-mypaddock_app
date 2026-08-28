# src/db/courbe.ts

- Point · type · L26-L26 — type Point = { id: string; date: string; ms: number; record: boolean }
- Courbe · type · L27-L34 — type Courbe = { circuit: string points: Point[] /** Le gain entre le premier point et le meilleur, en millisecondes. Positif * quand le pilote a progressé. Il ÉNONCE un écart constaté, il ne promet * rien — et il n'existe pas si la courbe n'a jamais baissé. */ gainMs: number | null }
- courbeDuCircuit · function · L43-L78 — courbeDuCircuit = async ( db: PowerSyncDatabase, circuit: string, ): Promise<Courbe | null>
- circuitsAvecCourbe · function · L83-L104 — circuitsAvecCourbe = async ( db: PowerSyncDatabase, ): Promise<{ circuit: string; n: number }[]>
