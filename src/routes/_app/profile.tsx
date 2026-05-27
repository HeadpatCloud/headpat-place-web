import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useSession } from "@/lib/auth-client"

// Convenience redirect: /profile → /user/<myProfileUrl>
export const Route = createFileRoute("/_app/profile")({
  component: MyProfileRedirect,
})

function MyProfileRedirect() {
  const navigate = useNavigate()
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.user?.id) {
      navigate({ to: `/user/${session.user.id}` as never, replace: true })
    } else {
      navigate({ to: "/login" as never, replace: true })
    }
  }, [session, navigate])
  return <p className="text-muted-foreground p-4">Redirecting…</p>
}
