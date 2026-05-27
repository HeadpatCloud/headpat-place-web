import type { AppRouter } from "@backend/routes"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"

function resolveBackendUrl(): string {
  if (typeof window !== "undefined") {
    return import.meta.env.VITE_API_URL || window.location.origin
  }
  return process.env.VITE_API_URL || "http://localhost:8787"
}

export const BACKEND_URL = resolveBackendUrl()

const link = new RPCLink({
  url: `${BACKEND_URL}/api/rpc`,
  fetch: (input, init) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
})

export const client = createORPCClient(link) as RouterClient<AppRouter>
export const orpc = createTanstackQueryUtils(client)
