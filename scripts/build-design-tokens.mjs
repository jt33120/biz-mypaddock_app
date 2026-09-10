import { readFileSync, writeFileSync } from 'node:fs'
const { tokens } = JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url), 'utf8'))
writeFileSync(new URL('../src/styles/night-tokens.css', import.meta.url), '/* Generated from design/tokens.json. */\n:root {\n' + Object.entries(tokens).map(([key, value]) => `  --${key}: ${value};`).join('\n') + '\n}\n')
const bootstrap = {
  'ch-ink': tokens.nuit, 'ch-paper': tokens.encre, 'ch-muted': tokens['encre-faible'],
  'ch-pink': tokens.magenta, 'ch-mint': tokens.miami,
  'ch-rule': tokens.filet, 'ch-shade': 'color-mix(in srgb, ' + tokens.nuit + ' 24%, transparent)',
  'ch-display': tokens['font-display'], 'ch-body': tokens.face,
  'ch-space-1': tokens['space-2'], 'ch-space-2': tokens['space-3'], 'ch-space-3': tokens['space-6'],
  'ch-space-4': tokens['space-8'], 'ch-space-5': tokens['space-16'],
  'ch-small': tokens['text-xs'], 'ch-copy': tokens['text-base'], 'ch-brand': tokens['splash-brand'],
  'ch-canvas': tokens['splash-canvas'], 'ch-exit': tokens['splash-exit'],
}
const entry = new URL('../index.html', import.meta.url)
const html = readFileSync(entry, 'utf8').replace(/:root \{[^}]*\}/, ':root {\n' + Object.entries(bootstrap).map(([key,value]) => `        --${key}: ${value};`).join('\n') + '\n      }').replace(/(<meta name="theme-color" content=")[^"]+/, '$1' + tokens.nuit)
writeFileSync(entry, html)
