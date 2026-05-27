import { createFileRoute } from "@tanstack/react-router"
import { useSession } from "@/lib/auth-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_app/")({
  component: Landing,
})

function Landing() {
  const { data, isPending } = useSession()

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Headpat</CardTitle>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <p className="text-muted-foreground">loading…</p>
          ) : data?.user ? (
            <div className="space-y-1">
              <p>Signed in as <span className="font-medium">{data.user.email}</span></p>
              <p className="text-muted-foreground text-sm">id: {data.user.id}</p>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Not signed in. Use the sidebar to log in or register.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
