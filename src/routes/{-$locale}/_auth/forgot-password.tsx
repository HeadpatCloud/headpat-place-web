import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { ErrorMessage, SuccessMessage } from "@/components/alerts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"

export const Route = createFileRoute("/{-$locale}/_auth/forgot-password")({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const r = await authClient.requestPasswordReset({
      email,
      redirectTo:
        (typeof window !== "undefined" ? window.location.origin : "") +
        "/i/reset-password",
    })
    if (r.error) {
      setError(r.error.message ?? "Something went wrong.")
      setTimeout(() => setError(null), 5000)
      return
    }
    setSuccess("E-Mail sent! Please check your inbox.")
    setTimeout(() => setSuccess(null), 10000)
  }

  return (
    <>
      {success && <SuccessMessage attentionSuccess={success} />}
      {error && <ErrorMessage attentionError={error} />}
      <div className="flex items-center justify-center px-6 py-12 lg:px-8">
        <div className="flex flex-col justify-center sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-24 w-auto"
            src="/logos/hp_logo_x512.webp"
            alt="Headpat Logo"
            width={128}
            height={128}
          />
          <h4 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight">
            Forgot password?
          </h4>
          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium leading-6"
              >
                Email address
              </label>
              <div className="mt-2">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button type="submit" className="w-full">
                Send E-Mail
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
