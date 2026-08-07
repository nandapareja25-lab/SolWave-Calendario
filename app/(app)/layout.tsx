import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import SeedLoader from '@/components/SeedLoader'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies()
  if (store.get('sw_session')?.value !== 'authenticated') {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <SeedLoader />
      <Sidebar />
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 mb-20 md:mb-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
