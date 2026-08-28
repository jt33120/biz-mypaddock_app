# src/db/vecu.ts

- dateCivileLocale · function · L35-L37 — dateCivileLocale = ( instant: Date = new Date(), decalageMinutes: number = instant.getTimezoneOffset(), ): string
- aujourdhui · function · L41-L41 — aujourdhui = (instant: Date = new Date())
- A_EU_LIEU · function · L57-L60 — A_EU_LIEU = (alias: string = 'r'): string
- aEuLieu · function · L80-L82 — aEuLieu = ( r: { etat: string | null; date_jour: string }, jour: string = aujourdhui(), ): boolean
- estAVenir · function · L93-L94 — estAVenir = (date: string, jour: string = aujourdhui()): boolean
- sePrepare · function · L139-L142 — sePrepare = ( r: { date: string; sessions: number; mesures: number }, jour: string = aujourdhui(), ): boolean
