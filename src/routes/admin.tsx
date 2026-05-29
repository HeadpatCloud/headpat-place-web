import { useQuery } from "@tanstack/react-query"
import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { AppSidebar } from "@/components/sidebar/app-sidebar"
import HeaderClient from "@/components/sidebar/header-client"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/admin")({ component: AdminLayout })

function AdminLayout() {
  const navigate = useNavigate()
  const perms = useQuery(orpc.adminRole.myPermissions.queryOptions({ input: undefined }))

  useEffect(() => {
    if (perms.isSuccess && perms.data.length === 0) {
      navigate({ to: "/" as never, replace: true })
    }
  }, [perms.isSuccess, perms.data, navigate])

  if (perms.isPending) return <p className="p-4 text-muted-foreground">Loading…</p>
  if (!perms.data || perms.data.length === 0) return <p className="p-4">Not authorized.</p>

  return (
    <HeaderClient
      sidebar={<AppSidebar mode="admin" />}
      containerClassName="mx-auto w-full max-w-screen-2xl px-4 py-6"
    >
      <Outlet />
    </HeaderClient>
  )
}
