import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/{-$locale}/admin/roles/$roleId")({ component: RoleEditor })

function RoleEditor() {
  const { roleId } = Route.useParams()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const catalog = useQuery(orpc.adminRole.catalog.queryOptions({ input: undefined }))
  const role = useQuery(orpc.adminRole.get.queryOptions({ input: { roleId } }))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (role.data) {
      setSelected(new Set(role.data.permissions))
      setName(role.data.name)
      setDescription(role.data.description ?? "")
    }
  }, [role.data])

  function invalidate() {
    qc.invalidateQueries({ queryKey: orpc.adminRole.get.queryKey({ input: { roleId } }) })
    qc.invalidateQueries({ queryKey: orpc.adminRole.list.queryKey({ input: {} }) })
  }

  const saveDetails = useMutation({
    mutationFn: () => client.adminRole.update({ roleId, name: name.trim(), description: description.trim() || null }),
    onSuccess: () => {
      invalidate()
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const savePermissions = useMutation({
    mutationFn: () => client.adminRole.setPermissions({ roleId, permissions: [...selected] }),
    onSuccess: () => {
      invalidate()
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: () => client.adminRole.delete({ roleId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orpc.adminRole.list.queryKey({ input: {} }) })
      toast.success("Role deleted.")
      navigate({ to: "/admin/roles" as never })
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
      if (next.has(perm)) next.delete(perm)
      else next.add(perm)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold tracking-tight">{role.data.name}</h1>
      {isSystem ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          This is a built-in system role with all permissions. It can't be edited or deleted.
        </p>
      ) : null}

      {!isSystem ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Details</CardTitle>
            <Button
              onClick={() => saveDetails.mutate()}
              disabled={saveDetails.isPending || !name.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Save
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="role-name">Name</Label>
              <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="What is this role for?"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Permissions ({selected.size})</CardTitle>
          {!isSystem ? (
            <Button onClick={() => savePermissions.mutate()} disabled={savePermissions.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
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

      {!isSystem ? (
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete role</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this role?</AlertDialogTitle>
                  <AlertDialogDescription>
                    "{role.data.name}" will be removed and unassigned from everyone who has it. This
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => remove.mutate()}
                    disabled={remove.isPending}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
