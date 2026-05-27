import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
})

function UsersPage() {
  return (
    <main className="mx-auto max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Discover users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Public user directory. Needs a backend procedure (e.g. `profile.list`
            with paging + search) that we haven't built yet — placeholder for now.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
