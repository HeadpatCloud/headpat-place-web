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

export const Route = createFileRoute("/_app/gallery/upload")({
  component: UploadPage,
})

const schema = z.object({
  name: z.string().min(1).max(200),
  longText: z.string().max(10000).optional(),
  nsfw: z.boolean().optional(),
  tags: z.string().optional(),
})

function UploadPage() {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", longText: "", nsfw: false, tags: "" },
  })
  const createMut = useMutation({
    mutationFn: async (v: z.infer<typeof schema>) =>
      client.gallery.create({
        name: v.name,
        longText: v.longText || undefined,
        nsfw: v.nsfw ?? false,
        tags: v.tags ? v.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      }),
    onSuccess: (g) => {
      toast.success("Uploaded.")
      navigate({ to: `/gallery/${g.id}` as never })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <main className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload to gallery</CardTitle>
          <p className="text-muted-foreground text-sm">
            Metadata only — file upload via presigned S3 URL coming in Phase 4.
          </p>
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
                  <InputField label="Title" description="" placeholder="" field={field} />
                )}
              />
              <FormField
                control={form.control}
                name="longText"
                render={({ field }) => (
                  <InputField label="Description" description="" placeholder="" field={field} />
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <InputField
                    label="Tags (comma-separated)"
                    description=""
                    placeholder="art, ref"
                    field={field}
                  />
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
