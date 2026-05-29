import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { StorageImage } from "@/components/StorageImage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/users/$userId")({ component: UserDetail })

function UserDetail() {
  const { userId } = Route.useParams()
  const qc = useQueryClient()
  const [reason, setReason] = useState("")
  const [roleToAdd, setRoleToAdd] = useState("")

  const userQ = useQuery(orpc.adminUser.get.queryOptions({ input: { userId } }))
  const rolesQ = useQuery(orpc.adminRole.list.queryOptions({ input: {} }))

  function invalidate() {
    qc.invalidateQueries({ queryKey: orpc.adminUser.get.queryKey({ input: { userId } }) })
  }

  const setBanned = useMutation({
    mutationFn: (vars: { banned: boolean; reason?: string }) =>
      client.adminUser.setBanned({ userId, ...vars }),
    onSuccess: () => {
      setReason("")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const assign = useMutation({
    mutationFn: (roleId: string) => client.adminRole.assign({ userId, roleId }),
    onSuccess: () => {
      setRoleToAdd("")
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const unassign = useMutation({
    mutationFn: (roleId: string) => client.adminRole.unassign({ userId, roleId }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  })

  if (userQ.isError) return <p className="text-muted-foreground">You don't have access to this.</p>
  if (userQ.isPending) return <p className="text-muted-foreground">Loading…</p>
  if (!userQ.data) return <p>User not found.</p>

  const u = userQ.data
  const assignedIds = new Set(u.roles.map((r) => r.id))
  const available = (rolesQ.data ?? []).filter((r) => !assignedIds.has(r.id))

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-row items-center gap-4 p-4">
          <StorageImage
            kind="avatar"
            fileId={u.avatarFileId}
            variant="sm"
            className="h-16 w-16 shrink-0 rounded-lg border border-border object-cover bg-muted"
            fallback={<div className="h-16 w-16 shrink-0 rounded-lg border border-border bg-muted" />}
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{u.displayName || u.name || u.profileUrl}</p>
              {u.banned ? <Badge variant="destructive">banned</Badge> : null}
            </div>
            <p className="truncate text-xs text-muted-foreground">@{u.profileUrl}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
            <p className="text-xs text-muted-foreground">
              Joined {new Date(u.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {u.banned ? (
            <>
              {u.banReason ? (
                <p className="text-sm text-muted-foreground">Reason: {u.banReason}</p>
              ) : null}
              <Button
                variant="outline"
                disabled={setBanned.isPending}
                onClick={() => setBanned.mutate({ banned: false })}
              >
                Unban
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ban reason (optional)"
              />
              <Button
                disabled={setBanned.isPending}
                onClick={() => setBanned.mutate({ banned: true, reason: reason.trim() || undefined })}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
              >
                Ban
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {u.roles.length === 0 ? (
              <span className="text-sm text-muted-foreground">No roles.</span>
            ) : (
              u.roles.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 rounded-md border border-primary px-2 py-1 text-xs text-primary"
                >
                  {r.name}
                  <button
                    type="button"
                    disabled={unassign.isPending}
                    onClick={() => unassign.mutate(r.id)}
                    className="hover:opacity-70"
                  >
                    <XIcon className="size-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Select value={roleToAdd} onValueChange={setRoleToAdd}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Add a role" />
              </SelectTrigger>
              <SelectContent>
                {available.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!roleToAdd || assign.isPending}
              onClick={() => assign.mutate(roleToAdd)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
            >
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
