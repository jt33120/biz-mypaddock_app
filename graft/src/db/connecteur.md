# src/db/connecteur.ts

- erreurDefinitive · function · L22-L24 — erreurDefinitive = (code?: string)
- Incident · type · L26-L26 — type Incident = { table: string; op: string; message: string }
- OperationCrud · type · L28-L33 — type OperationCrud = { table: string op: UpdateType opData?: Record<string, unknown> | null id: string }
- TransactionCrud · type · L35-L38 — type TransactionCrud = { crud: readonly OperationCrud[] complete: () => Promise<void> }
- ErreurEnvoi · type · L40-L40 — type ErreurEnvoi = { code?: string; message: string }
- envoyerTransaction · function · L45-L71 — envoyerTransaction = async ( piloteId: string, tx: TransactionCrud, executer: ( op: OperationCrud, donnees: Record<string, unknown>, ) => Promise<{ error: ErreurEnvoi | null }>, surIncident?: (i: Incident) => void, ): Promise<void>
- creerConnecteur · function · L73-L100 — creerConnecteur = ( piloteId: string, surIncident?: (i: Incident) => void, ): PowerSyncBackendConnector
