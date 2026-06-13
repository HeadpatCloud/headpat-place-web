import { Outlet, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_auth")({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div aria-hidden className="bg-sunset pointer-events-none absolute inset-0 opacity-15 blur-3xl" />
      <div className="relative z-10 w-full max-w-md">
        <Outlet />
      </div>
    </div>
  )
}
