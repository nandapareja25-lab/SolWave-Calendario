import { supabase } from '@/lib/supabase'
import AjustesClient from './AjustesClient'

export const dynamic = 'force-dynamic'

export default async function AjustesPage() {
  const { data } = await supabase
    .from('app_settings')
    .select('*')
    .eq('key', 'allow_catchup_days')
    .single()

  const allowCatchup = data?.value === true || data?.value === 'true'

  return <AjustesClient initialCatchup={allowCatchup} />
}
