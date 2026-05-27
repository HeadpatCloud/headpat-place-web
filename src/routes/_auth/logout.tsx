import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { signOut } from "@/lib/auth-client"

export const Route = createFileRoute("/_auth/logout")({
  component: LogoutPage,
})

function LogoutPage() {
  const navigate = useNavigate()
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await signOut()
      if (!cancelled) navigate({ to: "/" })
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])
  return (
    <div className="flex items-center justify-center px-6 py-12">
      <p className="text-muted-foreground">Logging out…</p>
    </div>
  )
}
