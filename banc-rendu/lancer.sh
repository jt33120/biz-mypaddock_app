#!/bin/bash
# Porte de rendu — récit 0.5. Rend le banc en Chrome headless et écrit une planche PNG.
set -euo pipefail
ici="$(cd "$(dirname "$0")" && pwd)"
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

# Manifeste = le contenu réel du dossier. Aucune liste tenue à la main.
python3 - "$ici" <<'PY'
import json, os, sys
d = os.path.join(sys.argv[1], "photos")
ok = ('.jpg', '.jpeg', '.png', '.heic', '.webp')
noms = sorted(f for f in os.listdir(d) if f.lower().endswith(ok) and not f.startswith('.'))
json.dump(noms, open(os.path.join(d, "manifest.json"), "w"), ensure_ascii=False, indent=1)
print(f"{len(noms)} photo(s) au jeu d'essai")
PY

n=$(python3 -c "import json,sys;print(len(json.load(open('$ici/photos/manifest.json'))))")
hauteur=$(( 240 + n * 340 ))
sortie="$ici/sorties/planche.png"

"$chrome" --headless=new --disable-gpu --hide-scrollbars \
  --allow-file-access-from-files --force-device-scale-factor=2 \
  --virtual-time-budget=20000 --window-size=1100,"$hauteur" \
  --screenshot="$sortie" "file://$ici/index.html?headless=1" 2>/dev/null

echo "planche → $sortie"
