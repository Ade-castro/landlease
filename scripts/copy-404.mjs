// GitHub Pages serves 404.html for any path that isn't a real file — copying the
// built index.html there lets client-side routing take over on a deep link or refresh.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dist = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../dist')
copyFileSync(path.join(dist, 'index.html'), path.join(dist, '404.html'))
