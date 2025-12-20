import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: RootComponent,
  errorComponent: ErrorComponent,
})

function RootComponent() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  )
}

function ErrorComponent({ error }: { error: Error }) {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f5f1e8]">
      <div className="rounded-lg border-2 border-[#8b7355] bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-bold text-[#8b7355]">
          Oops! Something went wrong
        </h1>
        <p className="mb-4 text-gray-700">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-[#8b7355] px-4 py-2 text-white hover:bg-[#6d5a43]"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}
