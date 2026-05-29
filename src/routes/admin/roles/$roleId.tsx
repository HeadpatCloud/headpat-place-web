import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin/roles/$roleId")({ component: RoleEditor })

function RoleEditor() {
  const { roleId } = Route.useParams()
  const qc = useQueryClient()
  const catalog = useQuery(orpc.adminRole.catalog.queryOptions({ input: undefined }))
  const role = useQuery(orpc.adminRole.get.queryOptions({ input: { roleId } }))
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (role.data) setSelected(new Set(role.data.permissions))
  }, [role.data])

  const save = useMutation({
    mutationFn: () => client.adminRole.setPermissions({ roleId, permissions: [...selected] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.adminRole.get.queryKey({ input: { roleId } }) })
      qc.invalidateQueries({ queryKey: orpc.adminRole.list.queryKey({ input: {} }) })
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (role.isPending || catalog.isPending) return <p className="text-muted-foreground">Loading…</p>
  if (role.isError || !role.data) return <p>Role not found.</p>
  const isSystem = role.data.isSystem
  const cat = catalog.data ?? {}

  function toggle(perm: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(perm) ? next.delete(perm) : next.add(perm)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{role.data.name}</h1>
      {isSystem ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          This is a built-in system role with all permissions. It can't be edited.
        </p>
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permissions ({selected.size})</CardTitle>
          {!isSystem ? (
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="divide-y">
          {Object.entries(cat).map(([resource, actions]) => (
            <div key={resource} className="grid grid-cols-[96px_1fr] items-center gap-3 py-2">
              <span className="text-sm font-semibold capitalize">{resource}</span>
              <div className="flex flex-wrap gap-1.5">
                {(actions as string[]).map((action) => {
                  const perm = `${resource}:${action}`
                  const on = selected.has(perm)
                  return (
                    <button
                      key={perm}
                      type="button"
                      disabled={isSystem}
                      onClick={() => toggle(perm)}
                      className={
                        "rounded-md border px-2 py-1 text-xs transition-colors " +
                        (on ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary/50")
                      }
                    >
                      {action}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
