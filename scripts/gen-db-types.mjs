import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'

config({ path: '.env.local' })

const projectId = process.env.SUPABASE_PROJECT_ID
if (!projectId) {
  console.error('SUPABASE_PROJECT_ID missing from .env.local')
  process.exit(1)
}

const out = execSync(`npx supabase gen types typescript --project-id ${projectId} --schema public`, {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe'],
  env: process.env,
})

writeFileSync('src/types/database.types.ts', out)
console.log('Wrote src/types/database.types.ts')
