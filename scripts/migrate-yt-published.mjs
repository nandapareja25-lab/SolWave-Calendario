import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envFile = join(__dirname, '../.env.local')
const envVars = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)

const url = envVars.NEXT_PUBLIC_SUPABASE_URL
const key = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

const sql = `
create table if not exists yt_published (
  entry_date date not null,
  title text not null,
  published_at timestamptz not null default now(),
  primary key (entry_date, title)
);
alter table yt_published disable row level security;
`

// Use Supabase REST API with pg endpoint isn't possible with anon key.
// Print SQL for manual run.
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('Abre el SQL Editor de Supabase y ejecuta esto:')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(sql)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`URL: ${url}/project/default/sql`)
