import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { signOut } from "@/lib/auth-client"

export const Route = createFileRoute("/_auth/logout")({
  component: LogoutPage,
})

function LogoutPage() {
  useEffect(() => {
    ;(async () => {
      await signOut()
      window.location.href = "/"
    })()
  }, [])
  return (
    <div className="flex items-center justify-center px-6 py-12">
      <p className="text-muted-foreground">Logging out…</p>
    </div>
  )
}
