# src/ecrans/Barres.tsx

- Barre · type · L53-L63 — type Barre = { /** Ce qui est nommé. Toujours présent : la barre ne se lit jamais seule. */ nom: string centimes: number /** Ce dont c'était fait, en clair. Vide quand il n'y a rien à en dire. */ detail?: string /** `true` pour ce que le produit ne sait pas ranger — « Sans poste », « Sans * mois ». Il s'affiche en retrait, jamais absent : les ranger d'office * ferait croire qu'un choix a été fait. */ incertain?: boolean }
- Barres · function · L65-L102 — function Barres({ titre, barres, description }: { titre: string barres: readonly Barre[] /** Ce que le tracé montre, en une phrase. Elle n'est pas décorative : sans * elle, un lecteur d'écran n'entend qu'une suite de montants. */ description: string })
