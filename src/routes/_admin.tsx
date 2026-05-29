import { useQuery } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect } from "react"
import { orpc } from "@/lib/orpc"

export const Route = createFileRoute("/_admin")({ component: AdminLayout })

const NAV = {
  Access: [
    { label: "Roles", to: "/admin/roles", enabled: true },
    { label: "Users", to: "/admin/users", enabled: false },
  ],
  Operations: [
    { label: "Reports", to: "/admin/reports", enabled: false },
    { label: "Tickets", to: "/admin/tickets", enabled: false },
    { label: "Announcements", to: "/admin/announcements", enabled: false },
  ],
}

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
    <div className="min-h-screen">
      <div className="bg-sunset-hero flex items-center justify-between px-6 py-3 text-white">
        <span className="font-bold">Headpat Admin</span>
        <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs">Admin</span>
      </div>
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-4 py-6">
        <nav className="w-44 shrink-0 space-y-4 text-sm">
          {Object.entries(NAV).map(([section, items]) => (
            <div key={section}>
              <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{section}</p>
              {items.map((it) =>
                it.enabled ? (
                  <Link
                    key={it.label}
                    to={it.to as never}
                    className="block rounded-md px-3 py-1.5"
                    activeProps={{ className: "block rounded-md px-3 py-1.5 bg-primary/15 text-primary font-semibold" }}
                  >
                    {it.label}
                  </Link>
                ) : (
                  <span key={it.label} className="block rounded-md px-3 py-1.5 text-muted-foreground/40">
                    {it.label}
                  </span>
                ),
              )}
            </div>
          ))}
        </nav>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
