import Sidebar from '@/components/Sidebar'
import SeedLoader from '@/components/SeedLoader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#FAFAF8' }}>
      <SeedLoader />
      <Sidebar />
      {/* Desktop: ml-64 for sidebar. Mobile: mt-14 for top bar, mb-20 for bottom nav */}
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 mb-20 md:mb-0 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
