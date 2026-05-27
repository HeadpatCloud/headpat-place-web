import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import InputField from "@/components/fields/InputField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormField } from "@/components/ui/form"
import { client } from "@/lib/orpc"

export const Route = createFileRoute("/_app/community/new")({
  component: NewCommunityPage,
})

const schema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
})

function NewCommunityPage() {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "" },
  })
  const createMut = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) => client.community.create(v),
    onSuccess: (c) => {
      toast.success("Community created.")
      navigate({ to: `/community/${c.id}` as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <main className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Create community</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((v) => createMut.mutate(v))}
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
              <Button type="submit" disabled={createMut.isPending}>
                Create
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </main>
  )
}
