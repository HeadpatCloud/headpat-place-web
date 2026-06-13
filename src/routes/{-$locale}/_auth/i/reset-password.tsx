import { Link, createFileRoute, useSearch } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"
import { ErrorMessage, SuccessMessage } from "@/components/alerts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const searchSchema = z.object({
  token: z.string().optional(),
})

export const Route = createFileRoute("/{-$locale}/_auth/i/reset-password")({
  validateSearch: searchSchema,
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const { token } = useSearch({ from: "/{-$locale}/_auth/i/reset-password" })
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!token) {
      setError("Missing reset token. Use the link from your email.")
      setTimeout(() => setError(null), 5000)
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.")
      setTimeout(() => setError(null), 5000)
      return
    }
    const r = await authClient.resetPassword({ newPassword: password, token })
    if (r.error) {
      setError(r.error.message ?? "Reset failed.")
      setTimeout(() => setError(null), 5000)
      return
    }
    setSuccess("Password reset. You can now log in.")
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
            Reset Password
          </h4>
          <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label htmlFor="newpassword">New password</Label>
              <div className="mt-2">
                <Input
                  id="newpassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirmpassword">Confirm password</Label>
              <div className="mt-2">
                <Input
                  id="confirmpassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </div>
            <div>
              <Button variant="destructive" asChild className="w-full">
                <Link to={"/login" as never}>Back to login &rarr;</Link>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
