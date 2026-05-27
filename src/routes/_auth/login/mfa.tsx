import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { toast } from "sonner"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"
import { twoFactor } from "@/lib/auth-client"

export const Route = createFileRoute("/_auth/login/mfa")({
  component: MfaPage,
})

function MfaPage() {
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(false)

  async function handleMfaVerify(otp: string) {
    setVerifying(true)
    try {
      const r = await twoFactor.verifyTotp({ code: otp })
      if (r.error) {
        toast.error("Incorrect code. Please try again.")
        return
      }
      navigate({ to: "/account" as never })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="absolute inset-0 flex flex-1 items-center justify-center">
      <div className="min-w-1/3 mx-auto mt-14 rounded-2xl p-8 dark:ring-white">
        <div className="mt-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div>
              <h4 className="mt-8 text-2xl font-bold tracking-tight">
                Please fill in your 2FA code
              </h4>
            </div>
            <div className="space-y-6 mt-4">
              <InputOTP
                maxLength={6}
                disabled={verifying}
                onComplete={(otp) => void handleMfaVerify(otp)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
