import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { AvatarBannerUpload } from "@/components/AvatarBannerUpload"
import { UserCard } from "@/components/UserCard"
import InputField from "@/components/fields/InputField"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField } from "@/components/ui/form"
import { client, orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/$communityId/admin")({
  component: AdminPage,
})

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
})

function AdminPage() {
  const { communityId } = Route.useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const community = useQuery(
    orpc.community.byId.queryOptions({ input: { communityId } }),
  )
  const role = useQuery(
    orpc.community.myRoleIn.queryOptions({ input: { communityId } }),
  )
  const members = useQuery(
    orpc.community.listMembers.queryOptions({ input: { communityId } }),
  )

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { name: "", description: "" },
  })

  useEffect(() => {
    if (community.data) {
      form.reset({
        name: community.data.name,
        description: community.data.description ?? "",
      })
    }
  }, [community.data, form])

  const updateMut = useMutation({
    mutationFn: async (v: z.infer<typeof updateSchema>) =>
      client.community.update({ communityId, ...v }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: orpc.community.byId.queryKey({ input: { communityId } }),
      })
      toast.success("Saved.")
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const deleteMut = useMutation({
    mutationFn: async () => client.community.delete({ communityId }),
    onSuccess: () => {
      toast.success("Community deleted.")
      navigate({ to: "/community" as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (community.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (!community.data) return <p className="p-4">Community not found.</p>
  if (role.data?.role !== "owner" && role.data?.role !== "admin") {
    return <p className="p-4">You don't have permission.</p>
  }

  return (
    <main className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-8">
          <AvatarBannerUpload
            kind="community-avatar"
            currentFileId={community.data.avatarFileId}
            label="Change avatar"
            onUploaded={async (fileId) => {
              await client.community.update({ communityId, avatarFileId: fileId })
              qc.invalidateQueries({
                queryKey: orpc.community.byId.queryKey({ input: { communityId } }),
              })
            }}
          />
          <AvatarBannerUpload
            kind="community-banner"
            currentFileId={community.data.bannerFileId}
            label="Change banner"
            onUploaded={async (fileId) => {
              await client.community.update({ communityId, bannerFileId: fileId })
              qc.invalidateQueries({
                queryKey: orpc.community.byId.queryKey({ input: { communityId } }),
              })
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit community</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => updateMut.mutate(v))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <InputField label="Name" description="" placeholder="" field={field} />
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <InputField label="Description" description="" placeholder="" field={field} />
                )}
              />
              <Button type="submit" disabled={updateMut.isPending}>Save</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members & roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(members.data?.items ?? []).map((m) => (
              <UserCard
                key={m.userId}
                user={m}
                trailing={<span className="text-xs text-muted-foreground capitalize">{m.role}</span>}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {role.data.role === "owner" ? (
        <Card>
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete community</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete this community?</AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. All events, follows, and settings will
                  be deleted along with it.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteMut.mutate()}
                    >
                      Delete
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
