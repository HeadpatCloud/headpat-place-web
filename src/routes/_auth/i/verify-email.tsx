import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { z } from "zod"
import { ErrorMessage, SuccessMessage } from "@/components/alerts"
import { authClient } from "@/lib/auth-client"

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/_auth/i/verify-email")({
  validateSearch: searchSchema,
  component: VerifyEmailPage,
})

function VerifyEmailPage() {
  const { token } = useSearch({ from: "/_auth/i/verify-email" })
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setError("Missing verification token.")
      return
    }
    let cancelled = false
    ;(async () => {
      const r = await authClient.verifyEmail({ query: { token } })
      if (cancelled) return
      if (r.error) {
        setError(r.error.message ?? "Verification failed.")
        return
      }
      setSuccess("Email verified. Redirecting…")
      setTimeout(() => navigate({ to: "/account" as never }), 1500)
    })()
    return () => {
      cancelled = true
    }
  }, [token, navigate])

  return (
    <>
      {success && <SuccessMessage attentionSuccess={success} />}
      {error && <ErrorMessage attentionError={error} />}
      <div className="flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="text-center">
          <h4 className="text-2xl font-bold leading-9 tracking-tight">
            Verifying your email…
          </h4>
        </div>
      </div>
    </>
  )
}
