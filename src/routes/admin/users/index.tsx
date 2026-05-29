import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Pager } from "@/components/Pager"
import { UserCard, type UserSummary } from "@/components/UserCard"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/users/")({ component: UsersList })

const pageSize = 24

function UsersList() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const users = useQuery(orpc.adminUser.list.queryOptions({ input: { search, page, pageSize } }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Users</h1>
      <Input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setPage(1)
        }}
        placeholder="Search users"
      />

      {users.isError ? (
        <p className="text-muted-foreground">You don't have access to this.</p>
      ) : users.isPending ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="space-y-2">
            {users.data.items.map((u) => (
              <Link key={u.userId} to={`/admin/users/${u.userId}` as never} className="block">
                <UserCard
                  user={u as UserSummary}
                  trailing={u.banned ? <Badge variant="destructive">banned</Badge> : null}
                />
              </Link>
            ))}
            {users.data.items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No users.</p>
            ) : null}
          </div>
          <Pager
            page={users.data.page}
            total={users.data.total}
            pageSize={users.data.pageSize}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  )
}
