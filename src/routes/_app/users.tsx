import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { StorageImage } from "@/components/StorageImage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/users")({
  component: UsersPage,
})

function UsersPage() {
  const [search, setSearch] = useState("")
  const users = useQuery(
    orpc.profile.list.queryOptions({
      input: search.trim() ? { search: search.trim(), limit: 40 } : { limit: 40 },
    }),
  )

  return (
    <main className="mx-auto max-w-6xl space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Discover users</h2>
      </div>
      <Input
        placeholder="Search by name, profile URL or bio…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {users.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (users.data ?? []).length === 0 ? (
        <p className="text-muted-foreground">No users found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(users.data ?? []).map((u) => (
            <Link key={u.userId} to={`/user/${u.profileUrl}` as never}>
              <Card className="card-hover">
                <CardHeader className="flex flex-row items-center gap-3">
                  <StorageImage
                    kind="avatar"
                    fileId={u.avatarFileId}
                    className="h-12 w-12 rounded-full object-cover bg-muted"
                    fallback={<div className="h-12 w-12 rounded-full bg-muted" />}
                  />
                  <div className="min-w-0">
                    <CardTitle className="text-base font-semibold truncate">
                      {u.displayName || u.profileUrl}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      @{u.profileUrl}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {u.bio ? (
                    <p className="text-sm line-clamp-2">{u.bio}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No bio</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {u.followersCount} followers
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
